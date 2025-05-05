import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_health():
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check Response:", response.json())
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_crawl():
    data = {
        "url": "https://antsq.com",
        "max_concurrent": 3
    }
    response = requests.post(f"{BASE_URL}/crawl", json=data)
    print("Crawl Response:", json.dumps(response.json(), indent=2))
    assert response.status_code in [200, 201]
    assert response.json()["success"] == True
    return response.json()["data"]["table_name"]

def test_chat(table_name):
    data = {
        "table_name": table_name,
        "question": "What is AntsQ?",
        "model_type": "Groq",
        "is_voice": False
    }
    response = requests.post(f"{BASE_URL}/chat", json=data)
    print("Chat Response:", json.dumps(response.json(), indent=2))
    assert response.status_code == 200
    assert response.json()["success"] == True
    assert "answer" in response.json()["data"]

if __name__ == "__main__":
    print("Testing API endpoints...")
    test_health()
    
    print("\nTesting crawl endpoint...")
    table_name = test_crawl()
    
    print("\nTesting chat endpoint...")
    test_chat(table_name)
    
    print("\nAll tests passed!")
