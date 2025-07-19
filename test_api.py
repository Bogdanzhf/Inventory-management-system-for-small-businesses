import requests
import json

def test_register_endpoint():
    """Test the registration endpoint"""
    print("Testing /api/auth/register endpoint...")
    url = "http://localhost:5000/api/auth/register"
    data = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "Password123!"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_login_endpoint():
    """Test the login endpoint"""
    print("\nTesting /api/auth/login endpoint...")
    url = "http://localhost:5000/api/auth/login"
    data = {
        "email": "testuser@example.com",
        "password": "Password123!"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register_endpoint()
    test_login_endpoint() 