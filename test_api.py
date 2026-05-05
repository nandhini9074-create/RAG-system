import requests
import json
import sys

print("Starting test...")
sys.stdout.flush()

url = "http://127.0.0.1:8000/query"
payload = {"query": "What is Economics?"}
headers = {"Content-Type": "application/json"}

try:
    print(f"Sending request to {url}...")
    sys.stdout.flush()
    response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
    print("Response received:")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
sys.stdout.flush()
