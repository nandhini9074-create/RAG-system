from qdrant_client import QdrantClient
from qdrant_client.http import models
from utils.config import settings
from typing import List, Dict, Any, Optional
import uuid

class QdrantStore:
    def __init__(self):
        if not settings.QDRANT_API_KEY:
            self.client = QdrantClient(path="qdrant_db")
        else:
            self.client = QdrantClient(
                url=settings.QDRANT_URL, 
                api_key=settings.QDRANT_API_KEY
            )
        self.vector_size = 384  # Size for all-MiniLM-L6-v2

    def create_collection(self, collection_name: str):
        if not self.client.collection_exists(collection_name):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=self.vector_size, distance=models.Distance.COSINE),
            )

    def list_collections(self) -> List[str]:
        collections = self.client.get_collections().collections
        return [c.name for c in collections]

    def delete_collection(self, collection_name: str):
        self.client.delete_collection(collection_name=collection_name)

    def upsert_chunks(self, collection_name: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        self.create_collection(collection_name)
        
        points = []
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            points.append(models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "content": chunk["content"],
                    **chunk["metadata"]
                }
            ))
        
        self.client.upsert(
            collection_name=collection_name,
            points=points
        )

    def search(self, collection_name: str, query_vector: List[float], query_text: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        # Using search method for compatibility
        response = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit
        )
        return [{**hit.payload, "score": hit.score} for hit in response]

    def get_all_stats(self) -> List[Dict[str, Any]]:
        collections = self.client.get_collections().collections
        stats = []
        for coll in collections:
            count_result = self.client.count(collection_name=coll.name)
            stats.append({
                "name": coll.name,
                "count": count_result.count,
            })
        return stats

qdrant_store = QdrantStore()
