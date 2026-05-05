import http.client
import json

conn = http.client.HTTPConnection("127.0.0.1", 8000)
headers = {'Content-type': 'application/json'}
data = {'query': 'What is RAG?'}
json_data = json.dumps(data)

conn.request("POST", "/query", json_data, headers)
response = conn.getresponse()
print(response.read().decode())
conn.close()
