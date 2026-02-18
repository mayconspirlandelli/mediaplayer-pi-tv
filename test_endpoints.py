import requests

BASE_URL = "http://localhost:8000/api/player"

def test_endpoint(path):
    try:
        r = requests.get(f"{BASE_URL}{path}")
        print(f"GET {path}: {r.status_code}")
        if r.status_code == 200:
            print(f"Response: {r.json()}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    print("Testing Player Endpoints...")
    test_endpoint("/active-content")
    test_endpoint("/active-content/region/1")
    test_endpoint("/active-content/region/2")
    test_endpoint("/active-content/region/4")
