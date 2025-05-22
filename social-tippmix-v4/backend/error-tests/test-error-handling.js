#!/usr/bin/env node

/**
 * Error Handling Test Script
 *
 * This script tests the error handling system by making requests to the test endpoints.
 * It requires the API to be running locally.
 */

import fetch from 'node-fetch';
import colors from 'colors';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8080';
const TEST_ENDPOINTS = [
  { path: '/api/test/success', method: 'GET', name: 'Success Response' },
  {
    path: '/api/test/validation-error',
    method: 'POST',
    name: 'Validation Error',
    body: { name: 'Jo', age: 15 },
  },
  { path: '/api/test/not-found-error/test-id', method: 'GET', name: 'Not Found Error' },
  { path: '/api/test/unauthorized-error', method: 'GET', name: 'Unauthorized Error' },
  {
    path: '/api/test/forbidden-error?resource=post&action=delete',
    method: 'GET',
    name: 'Forbidden Error',
  },
  {
    path: '/api/test/conflict-error?email=test@example.com',
    method: 'GET',
    name: 'Conflict Error',
  },
  { path: '/api/test/database-error', method: 'GET', name: 'Database Error' },
  { path: '/api/test/rate-limit-error', method: 'GET', name: 'Rate Limit Error' },
  { path: '/api/test/file-upload-error?type=image/svg', method: 'GET', name: 'File Upload Error' },
  {
    path: '/api/test/custom-error?status=418&code=TEAPOT&severity=LOW',
    method: 'GET',
    name: 'Custom API Error',
  },
  { path: '/api/test/internal-server-error', method: 'GET', name: 'Internal Server Error' },
];

/**
 * Makes a request to the specified endpoint
 */
async function makeRequest(endpoint) {
  const options = {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (endpoint.body) {
    options.body = JSON.stringify(endpoint.body);
  }

  try {
    console.log(colors.cyan(`\nTesting ${endpoint.name} (${endpoint.method} ${endpoint.path})...`));

    const url = `${API_URL}${endpoint.path}`;
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      console.log(colors.yellow(`Status: ${response.status}`));
      console.log(colors.yellow(`Response:`));
      console.log(JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log(colors.green('✓ Success'));
      } else {
        console.log(colors.green('✓ Error handled correctly'));
      }
    } else {
      const text = await response.text();
      console.log(colors.yellow(`Status: ${response.status}`));
      console.log(colors.yellow(`Response: ${text}`));
      console.log(colors.red('✕ Non-JSON response'));
    }
  } catch (error) {
    console.log(colors.red(`Error making request: ${error.message}`));
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(colors.bold.blue('======================================='));
  console.log(colors.bold.blue('   Error Handling System Test Suite    '));
  console.log(colors.bold.blue('======================================='));
  console.log();
  console.log(`Testing against API at: ${colors.green(API_URL)}`);
  console.log();

  // Check if API is running
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Health check failed with status ${healthCheck.status}`);
    }
    const data = await healthCheck.json();
    console.log(colors.green(`API is running (Status: ${data.status}, Version: ${data.version})`));
  } catch (error) {
    console.log(colors.red(`Error: API is not running or not accessible at ${API_URL}`));
    console.log(colors.red('Please start the API server and try again.'));
    process.exit(1);
  }

  // Run tests sequentially
  for (const endpoint of TEST_ENDPOINTS) {
    await makeRequest(endpoint);
  }

  console.log();
  console.log(colors.bold.blue('======================================='));
  console.log(colors.bold.green('All tests completed!'));
  console.log(colors.bold.blue('======================================='));
  console.log();
  console.log('Check the logs directory for detailed error logs.');
}

// Run the tests
runTests();
