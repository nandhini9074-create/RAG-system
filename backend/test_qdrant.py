from qdrant_client import QdrantClient
from utils.config import settings
import time

def test_qdrant():
    print(f"Connecting to: {settings.QDRANT_URL}")
    try:
        start_time = time.time()
        client = QdrantClient(
            url=settings.QDRANT_URL, 
            api_key=settings.QDRANT_API_KEY,
            timeout=10 # Set a short timeout for the test
        )
        collections = client.get_collections()
        print(f"Success! Found {len(collections.collections)} collections.")
        print(f"Time taken: {time.time() - start_time:.2f}s")
    except Exception as e:
        print(f"\n--- QDRANT CONNECTION ERROR ---")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")

if __name__ == "__main__":
    test_qdrant()
