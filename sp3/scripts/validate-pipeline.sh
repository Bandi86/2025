#!/bin/bash

# Színes kimenetek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DATE="2025-07-04"
API_URL="http://localhost:3001"

echo -e "${BLUE}=== SP3 TELJES PIPELINE VALIDÁCIÓ JÚLIUS 4-RE ===${NC}"
echo -e "${BLUE}Date: $DATE${NC}"
echo

# 1. JSON fájlok ellenőrzése
echo -e "${YELLOW}1. JSON fájlokban meccsek száma:${NC}"
JSON_COUNT=$(find /home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed -name "*.json" -exec jq -r '.matches[] | select(.date=="'$DATE'") | .team1 + " vs " + .team2' {} \; | wc -l)
echo -e "   JSON meccsek: ${GREEN}$JSON_COUNT${NC}"

# 2. Adatbázis ellenőrzése
echo -e "${YELLOW}2. Adatbázisban meccsek száma:${NC}"
DB_COUNT=$(cd /home/bandi/Documents/code/2025/sp3/backend && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function count() {
  const matches = await prisma.match.findMany({
    where: {
      date: {
        gte: new Date('${DATE}T00:00:00.000Z'),
        lt: new Date('${DATE}T23:59:59.999Z')
      }
    }
  });
  console.log(matches.length);
  await prisma.\$disconnect();
}
count();
")
echo -e "   DB meccsek: ${GREEN}$DB_COUNT${NC}"

# 3. API ellenőrzése (összes meccs)
echo -e "${YELLOW}3. API-ban meccsek száma (full limit):${NC}"
API_COUNT=$(curl -s "${API_URL}/api/matches?page=1&limit=2000" | jq -r '[.data[] | select(.date | startswith("'$DATE'"))] | length')
echo -e "   API meccsek: ${GREEN}$API_COUNT${NC}"

# 4. API ellenőrzése (default limit)
echo -e "${YELLOW}4. API-ban meccsek száma (default limit 20):${NC}"
API_DEFAULT_COUNT=$(curl -s "${API_URL}/api/matches" | jq -r '[.data[] | select(.date | startswith("'$DATE'"))] | length')
echo -e "   API meccsek (default): ${GREEN}$API_DEFAULT_COUNT${NC}"

# 5. Frontend szimuláció - API hívás ahogy a frontend csinálja
echo -e "${YELLOW}5. Frontend API hívás szimulálása:${NC}"
TOTAL_MATCHES=$(curl -s "${API_URL}/api/matches?page=1&limit=1" | jq -r '.pagination.total')
FRONTEND_COUNT=$(curl -s "${API_URL}/api/matches?page=1&limit=${TOTAL_MATCHES}" | jq -r '[.data[] | select(.date | startswith("'$DATE'"))] | length')
echo -e "   Frontend API meccsek: ${GREEN}$FRONTEND_COUNT${NC}"

echo
echo -e "${BLUE}=== ÖSSZESÍTÉS ===${NC}"
echo -e "JSON:           ${GREEN}$JSON_COUNT${NC}"
echo -e "Database:       ${GREEN}$DB_COUNT${NC}"
echo -e "API (full):     ${GREEN}$API_COUNT${NC}"
echo -e "API (default):  ${GREEN}$API_DEFAULT_COUNT${NC}"
echo -e "Frontend API:   ${GREEN}$FRONTEND_COUNT${NC}"

echo
if [ "$JSON_COUNT" = "$DB_COUNT" ] && [ "$DB_COUNT" = "$API_COUNT" ] && [ "$API_COUNT" = "$FRONTEND_COUNT" ]; then
    echo -e "${GREEN}✅ SIKERES! Minden szinten azonos a meccsszám.${NC}"
else
    echo -e "${RED}❌ PROBLÉMA! Eltérő meccsszámok a pipeline szintjein.${NC}"
fi

echo
echo -e "${BLUE}=== HIÁNYZÓ MECCSEK KERESÉSE ===${NC}"
echo -e "${YELLOW}API első 20 meccsből July 4-re:${NC}"
curl -s "${API_URL}/api/matches" | jq -r '.data[] | select(.date | startswith("'$DATE'")) | .team1 + " vs " + .team2 + " (" + .time + ")"' | head -20

echo
echo -e "${YELLOW}Összes July 4-es meccs az API-ban:${NC}"
curl -s "${API_URL}/api/matches?page=1&limit=2000" | jq -r '.data[] | select(.date | startswith("'$DATE'")) | .team1 + " vs " + .team2 + " (" + .time + ")"' | sort
