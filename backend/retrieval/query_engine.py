import concurrent.futures
from typing import List, Dict, Any
from vector_store.qdrant_store import qdrant_store
from embeddings.model import embedding_service
from sentence_transformers import CrossEncoder
from utils.config import settings

class QueryEngine:
    def __init__(self):
        self.reranker = CrossEncoder(settings.RERANK_MODEL_NAME)

    def retrieve_context(self, query: str, collections: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        query_vector = embedding_service.encode_query(query)
        all_results = []
        
        if not collections:
            collections = qdrant_store.list_collections()
            
        # Search across collections
        for coll in collections:
            res = qdrant_store.search(coll, query_vector, query_text=query, limit=top_k)
            res_scored = [{**r, "rerank_score": float(s)} for r, s in zip(res, self.reranker.predict([[query, x["content"]] for x in res]))]
            print(f"Collection: {coll} | Results: {res_scored}")
            all_results += res_scored
            
        if not all_results: return []
            
        return sorted(all_results, key=lambda x: x["rerank_score"], reverse=True)[:top_k]

query_engine = QueryEngine()
