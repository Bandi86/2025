#!/bin/bash

# Color codes for formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for API
BASE_URL="http://localhost:8080/api/test"

# Function to make a request and display the result
make_request() {
  local endpoint=$1
  local method=${2:-GET}
  local expected_status=$3
  local data=$4

  echo -e "${BLUE}Testing: ${method} ${endpoint}${NC}"
  echo -e "${YELLOW}Expected status: ${expected_status}${NC}"

  # Build curl command
  cmd="curl -s -X ${method}"

  # Add data if provided
  if [ ! -z "$data" ]; then
    cmd="${cmd} -H 'Content-Type: application/json' -d '${data}'"
  fi

  # Add endpoint
  cmd="${cmd} ${BASE_URL}${endpoint}"

  # Execute the command and get status code
  response=$(eval ${cmd})
  status_code=$(echo "${cmd} -w '%{http_code}' -o /dev/null" | bash)

  # Check if status code matches expected
  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ Success: Received expected status code ${status_code}${NC}"
  else
    echo -e "${RED}✗ Error: Expected status ${expected_status}, got ${status_code}${NC}"
  fi

  # Format and print the response
  echo -e "${YELLOW}Response:${NC}"
  echo $response | jq '.' 2>/dev/null || echo $response
  echo -e "\n${BLUE}----------------------------------------${NC}\n"
}

# Run all tests
echo -e "${BLUE}======== TESTING ERROR HANDLING SYSTEM ========${NC}\n"

# Test each endpoint
make_request "/success" "GET" 200
make_request "/validation-error" "POST" 400 '{"invalid":"data"}'
make_request "/not-found-error/123" "GET" 404
make_request "/unauthorized-error" "GET" 401
make_request "/forbidden-error" "GET" 403
make_request "/conflict-error" "GET" 409
make_request "/database-error" "GET" 500
make_request "/rate-limit-error" "GET" 429
make_request "/file-upload-error" "GET" 400
make_request "/custom-error" "GET" 500
make_request "/internal-server-error" "GET" 500

echo -e "${BLUE}======== TEST COMPLETE ========${NC}"
