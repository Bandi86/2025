#!/usr/bin/env python3
"""
Simple Integration Test for TippMixMentor v2
Uses only standard library modules to test basic connectivity
"""

import urllib.request
import urllib.error
import json
import time
from datetime import datetime

# Configuration
SERVICES = {
    "backend": "http://localhost:3001",
    "agent_os": "http://localhost:8001", 
    "ml_service": "http://localhost:8000",
    "frontend": "http://localhost:3000"
}

def test_service_health(service_name, base_url, endpoint="/health"):
    """Test service health endpoint"""
    url = f"{base_url}{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            if response.status == 200:
                print(f"✅ {service_name}: Healthy")
                return True
            else:
                print(f"❌ {service_name}: Unhealthy (Status: {response.status})")
                return False
    except urllib.error.URLError as e:
        print(f"❌ {service_name}: Connection failed - {e.reason}")
        return False
    except Exception as e:
        print(f"❌ {service_name}: Error - {str(e)}")
        return False

def test_endpoint(service_name, url, method="GET", data=None):
    """Test a specific endpoint"""
    try:
        if data:
            data = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        else:
            req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status in [200, 201]:
                print(f"✅ {service_name}: Success")
                return True
            else:
                print(f"❌ {service_name}: Failed (Status: {response.status})")
                return False
    except urllib.error.URLError as e:
        print(f"❌ {service_name}: Connection failed - {e.reason}")
        return False
    except Exception as e:
        print(f"❌ {service_name}: Error - {str(e)}")
        return False

def main():
    """Run integration tests"""
    print("🚀 TippMixMentor v2 - Simple Integration Test")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    # Test service availability
    print("🔍 Testing Service Availability...")
    health_results = {}
    
    for service_name, base_url in SERVICES.items():
        health_results[service_name] = test_service_health(service_name, base_url)
    
    print()
    
    # Test specific endpoints if services are available
    if health_results.get("backend"):
        print("🔗 Testing Backend Endpoints...")
        test_endpoint("Backend ML Status", f"{SERVICES['backend']}/predictions/ml/status")
        test_endpoint("Backend Health", f"{SERVICES['backend']}/health")
    
    if health_results.get("agent_os"):
        print("\n🤖 Testing Agent OS Endpoints...")
        test_endpoint("Agent OS Health", f"{SERVICES['agent_os']}/health")
        test_endpoint("Agent OS Root", f"{SERVICES['agent_os']}/")
        
        # Test workflow templates
        test_endpoint("Workflow Templates", f"{SERVICES['agent_os']}/workflows/templates")
    
    if health_results.get("ml_service"):
        print("\n🧠 Testing ML Service Endpoints...")
        test_endpoint("ML Service Health", f"{SERVICES['ml_service']}/health")
        test_endpoint("ML Models Status", f"{SERVICES['ml_service']}/models/status")
    
    if health_results.get("frontend"):
        print("\n🌐 Testing Frontend...")
        test_endpoint("Frontend", f"{SERVICES['frontend']}/")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    available_services = sum(health_results.values())
    total_services = len(health_results)
    
    print(f"Available Services: {available_services}/{total_services}")
    
    for service_name, is_healthy in health_results.items():
        status = "✅ Available" if is_healthy else "❌ Unavailable"
        print(f"  {service_name}: {status}")
    
    if available_services == total_services:
        print("\n🎉 All services are running! Integration is working correctly.")
        print("\n📚 Next steps:")
        print("1. Visit http://localhost:3001/docs for Backend API documentation")
        print("2. Visit http://localhost:8001/docs for Agent OS API documentation")
        print("3. Visit http://localhost:8000/docs for ML Service API documentation")
        print("4. Visit http://localhost:3000 for the Frontend application")
    else:
        print(f"\n⚠️ {total_services - available_services} service(s) are not running.")
        print("Please start the services using: docker-compose up -d")

if __name__ == "__main__":
    main() 