#!/usr/bin/env python3
"""
Test script for API-Football integration
This script tests the basic functionality of the API-Football integration
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3001"
API_FOOTBALL_BASE = f"{BASE_URL}/api/v1/api-football"
UNIFIED_BASE = f"{BASE_URL}/api/v1/unified-football"

def test_api_football_status():
    """Test API-Football service status"""
    print("🔍 Testing API-Football service status...")
    
    try:
        response = requests.get(f"{API_FOOTBALL_BASE}/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service status: {data.get('status', 'unknown')}")
            print(f"   Rate limit - Minute remaining: {data.get('rateLimit', {}).get('minuteRemaining', 'N/A')}")
            print(f"   Rate limit - Month remaining: {data.get('rateLimit', {}).get('monthRemaining', 'N/A')}")
            return True
        else:
            print(f"❌ Status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error checking status: {e}")
        return False

def test_rate_limit():
    """Test rate limit endpoint"""
    print("\n🔍 Testing rate limit endpoint...")
    
    try:
        response = requests.get(f"{API_FOOTBALL_BASE}/rate-limit")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Rate limit check successful")
            print(f"   Minute remaining: {data.get('minuteRemaining', 'N/A')}")
            print(f"   Month remaining: {data.get('monthRemaining', 'N/A')}")
            return True
        else:
            print(f"❌ Rate limit check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error checking rate limit: {e}")
        return False

def test_leagues():
    """Test leagues endpoint"""
    print("\n🔍 Testing leagues endpoint...")
    
    try:
        response = requests.get(f"{API_FOOTBALL_BASE}/leagues?country=England&season=2024")
        if response.status_code == 200:
            data = response.json()
            leagues = data.get('response', [])
            print(f"✅ Found {len(leagues)} leagues for England 2024")
            for league in leagues[:3]:  # Show first 3
                print(f"   - {league.get('league', {}).get('name', 'Unknown')} (ID: {league.get('league', {}).get('id', 'N/A')})")
            return True
        else:
            print(f"❌ Leagues request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching leagues: {e}")
        return False

def test_unified_status():
    """Test unified service status"""
    print("\n🔍 Testing unified service status...")
    
    try:
        response = requests.get(f"{UNIFIED_BASE}/status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Unified service status: {data.get('status', 'unknown')}")
            quality = data.get('qualityReport', {})
            print(f"   Data quality: {quality.get('mergedDataQuality', 0) * 100:.1f}%")
            print(f"   Football-Data status: {quality.get('footballDataStatus', 'unknown')}")
            print(f"   API-Football status: {quality.get('apiFootballStatus', 'unknown')}")
            return True
        else:
            print(f"❌ Unified status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error checking unified status: {e}")
        return False

def test_unified_matches():
    """Test unified matches endpoint"""
    print("\n🔍 Testing unified matches endpoint...")
    
    try:
        response = requests.get(f"{UNIFIED_BASE}/matches?competition=PL&limit=5")
        if response.status_code == 200:
            data = response.json()
            matches = data.get('matches', [])
            print(f"✅ Found {len(matches)} unified matches for Premier League")
            sources = data.get('sources', [])
            print(f"   Data sources: {', '.join(sources)}")
            
            if matches:
                match = matches[0]
                print(f"   Sample match: {match.get('homeTeam', 'Unknown')} vs {match.get('awayTeam', 'Unknown')}")
                print(f"   Source: {match.get('source', 'unknown')}, Confidence: {match.get('confidence', 0)}")
            return True
        else:
            print(f"❌ Unified matches request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching unified matches: {e}")
        return False

def test_api_football_matches():
    """Test API-Football matches endpoint (if rate limit allows)"""
    print("\n🔍 Testing API-Football matches endpoint...")
    
    try:
        # Check rate limit first
        rate_response = requests.get(f"{API_FOOTBALL_BASE}/rate-limit")
        if rate_response.status_code == 200:
            rate_data = rate_response.json()
            minute_remaining = rate_data.get('minuteRemaining', 0)
            
            if minute_remaining > 0:
                response = requests.get(f"{API_FOOTBALL_BASE}/matches?league=39&season=2024")
                if response.status_code == 200:
                    data = response.json()
                    matches = data.get('response', [])
                    print(f"✅ Found {len(matches)} API-Football matches for Premier League")
                    if matches:
                        match = matches[0]
                        home_team = match.get('teams', {}).get('home', {}).get('name', 'Unknown')
                        away_team = match.get('teams', {}).get('away', {}).get('name', 'Unknown')
                        print(f"   Sample match: {home_team} vs {away_team}")
                    return True
                else:
                    print(f"❌ API-Football matches request failed: {response.status_code}")
                    return False
            else:
                print("⚠️  Rate limit reached, skipping API-Football matches test")
                return True
        else:
            print(f"❌ Rate limit check failed: {rate_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing API-Football matches: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting API-Football Integration Tests")
    print("=" * 50)
    print(f"📅 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Base URL: {BASE_URL}")
    print()
    
    tests = [
        ("API-Football Status", test_api_football_status),
        ("Rate Limit", test_rate_limit),
        ("Leagues", test_leagues),
        ("Unified Status", test_unified_status),
        ("Unified Matches", test_unified_matches),
        ("API-Football Matches", test_api_football_matches),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"❌ {test_name} test failed")
        except Exception as e:
            print(f"❌ {test_name} test error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API-Football integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")
    
    print(f"📅 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 