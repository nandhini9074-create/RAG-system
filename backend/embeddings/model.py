from sentence_transformers import SentenceTransformer
from utils.config import settings
import numpy as np
from typing import List

class EmbeddingModel:
    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        
    def encode(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

    def encode_query(self, text: str) -> List[float]:
        return self.model.encode(text).tolist()

embedding_service = EmbeddingModel()
