from qdrant_client import QdrantClient
import sys
import os

# Add backend to path to import settings
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from utils.config import settings

if settings.QDRANT_API_KEY:
    print(f"Connecting to Cloud Qdrant: {settings.QDRANT_URL}")
    client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
else:
    print("Connecting to local Qdrant")
    client = QdrantClient(path="backend/qdrant_db")

try:
    collections = client.get_collections().collections
    if not collections:
        print("No collections found.")
    for coll in collections:
        count = client.count(collection_name=coll.name).count
        print(f"Collection: {coll.name} | Points: {count}")
        points = client.scroll(collection_name=coll.name, limit=5)[0]
        for p in points:
            print(f"  Content snippet: {p.payload.get('content', '')[:100]}")
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")

