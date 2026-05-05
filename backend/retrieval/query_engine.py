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
            
        # Parallel search across collections for speed
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_to_coll = {executor.submit(qdrant_store.search, coll, query_vector, query_text=query, limit=top_k): coll for coll in collections}
            for future in concurrent.futures.as_completed(future_to_coll):
                coll = future_to_coll[future]
                try:
                    results = future.result()
                    all_results.extend(results)
                except Exception as exc:
                    print(f"Collection {coll} generated an exception: {exc}")
            
        # Rerank results
        if not all_results:
            return []
            
        pairs = [[query, res["content"]] for res in all_results]
        scores = self.reranker.predict(pairs)
        
        # Combine results with scores and sort
        for i, res in enumerate(all_results):
            res["rerank_score"] = float(scores[i])
            
        reranked_results = sorted(all_results, key=lambda x: x["rerank_score"], reverse=True)
        return reranked_results[:top_k]

query_engine = QueryEngine()
