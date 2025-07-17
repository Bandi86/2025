#!/bin/bash

# Frontend debug script - szimulálja a frontend API hívásait

API_URL="http://localhost:3001"
DATE="2025-07-04"

echo "=== FRONTEND DEBUG SCRIPT ==="
echo "Dátum: $DATE"
echo

# 1. Szimulálja a frontend első API hívását (total count-ra)
echo "1. Első API hívás - total count lekérése:"
FIRST_RESPONSE=$(curl -s "${API_URL}/api/matches?page=1&limit=1")
TOTAL_COUNT=$(echo "$FIRST_RESPONSE" | jq -r '.pagination.total // 0')
echo "   Total meccsek: $TOTAL_COUNT"
echo

# 2. Szimulálja a frontend második API hívását (összes meccs)
echo "2. Második API hívás - összes meccs lekérése:"
ALL_MATCHES_RESPONSE=$(curl -s "${API_URL}/api/matches?page=1&limit=${TOTAL_COUNT}")
ALL_MATCHES_COUNT=$(echo "$ALL_MATCHES_RESPONSE" | jq -r '.data | length // 0')
echo "   Visszakapott meccsek: $ALL_MATCHES_COUNT"
echo

# 3. Szűrés július 4-re
echo "3. Szűrés július 4-re:"
JULY_4_MATCHES=$(echo "$ALL_MATCHES_RESPONSE" | jq -r '.data[] | select(.date | startswith("'$DATE'"))')
JULY_4_COUNT=$(echo "$JULY_4_MATCHES" | jq -s 'length')
echo "   Július 4-es meccsek: $JULY_4_COUNT"
echo

# 4. Megjelenítés szimuláció
echo "4. Meccsek részletesen:"
echo "$JULY_4_MATCHES" | jq -r '. | .homeTeam.name + " vs " + .awayTeam.name + " (" + (.date | split("T")[1] | split(".")[0] | split(":")[0:2] | join(":")) + ")"' | nl

echo
echo "=== FRONTEND SZŰRÉSI LOGIKA TESZTELÉSE ==="

# 5. UTC dátum csoportosítás szimuláció
echo "5. UTC dátum csoportosítás:"
UTC_GROUPS=$(echo "$ALL_MATCHES_RESPONSE" | jq -r '.data[] | (.date | split("T")[0])' | sort | uniq -c | sort -nr)
echo "$UTC_GROUPS"

echo
echo "6. Adott dátum meccsszámlálása:"
DATE_MATCH_COUNT=$(echo "$ALL_MATCHES_RESPONSE" | jq -r '.data[] | select((.date | split("T")[0]) == "'$DATE'") | .homeTeam.name + " vs " + .awayTeam.name' | wc -l)
echo "   $DATE dátumra: $DATE_MATCH_COUNT meccs"

echo
echo "=== ÖSSZESÍTÉS ==="
echo "API total count: $TOTAL_COUNT"
echo "API összes meccs: $ALL_MATCHES_COUNT"
echo "Július 4-es meccsek: $JULY_4_COUNT"
echo "UTC szűrés eredménye: $DATE_MATCH_COUNT"
