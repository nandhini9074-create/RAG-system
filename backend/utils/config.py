from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Production RAG API"
    QDRANT_URL: str = "https://5dcdd6e4-da27-4e5a-9c5b-ad7efec40f68.sa-east-1-0.aws.cloud.qdrant.io"
    QDRANT_API_KEY: Optional[str] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6MmFmNDI4MDYtNmQ0My00ZTg3LTg1NzAtOGY5NzNlMzgzOWZlIn0.PaBYN8DEZw88GRjw8HHHRjGtea0Va4hyGKrmzeXB8to"
    
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    RERANK_MODEL_NAME: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    
    GOOGLE_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-3.5-turbo"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    CHUNK_SIZE: int = 100
    CHUNK_OVERLAP: int = 10
    
    COLLECTION_TOPIC_THRESHOLD: float = 0.7
    
    class Config:
        env_file = ".env"

settings = Settings()
