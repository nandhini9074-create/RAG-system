import os
import shutil
import time
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from openai import OpenAI
from ingestion.processor import document_processor
from embeddings.model import embedding_service
from vector_store.qdrant_store import qdrant_store
from retrieval.query_engine import query_engine
from utils.config import settings
import numpy as np

class RAGService:
    async def process_uploads(self, file_info: List[Dict[str, str]]):
        results = []
        
        for info in file_info:
            file_path = info["path"]
            filename = info["filename"]
            
            try:
                print(f"--- Processing {filename} ---")
                # 1. Process document
                chunks = document_processor.process_file(file_path, filename)
                print(f"Generated {len(chunks)} chunks")
                
                # 2. Generate embeddings
                texts = [c["content"] for c in chunks]
                embeddings = embedding_service.encode(texts)
                print(f"Generated {len(embeddings)} embeddings")
                
                # 3. Determine collection
                collection_name = self.determine_collection(filename, embeddings)
                print(f"Collection target: {collection_name}")
                
                # 4. Upsert to Qdrant
                qdrant_store.upsert_chunks(collection_name, chunks, embeddings)
                print(f"Successfully upserted to {collection_name}")
                
                results.append({"filename": filename, "collection": collection_name, "chunks": len(chunks)})
                
                # Clean up temp file
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"Removed temp file {file_path}")
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
            
        return results

    def determine_collection(self, filename: str, embeddings: List[List[float]]) -> str:
        # Strategy: Use the filename prefix (before first underscore/hyphen) or just a 'general' collection
        # A more advanced version would use clustering against existing collection centroids
        base_name = filename.split('.')[0].split('_')[0].split('-')[0].lower()
        if not base_name:
            base_name = "general"
        return base_name

    def query(self, query_text: str, collection_name: Optional[str] = None, context_override: Optional[str] = None):
        if context_override:
            # Use specific context provided by user (fast path)
            context = context_override
            context_chunks = [] 
        else:
            # Traditional RAG path
            collections = [collection_name] if collection_name else qdrant_store.list_collections()
            context_chunks = query_engine.retrieve_context(query_text, collections)
            
            if not context_chunks:
                return {
                    "answer": "I couldn't find any relevant information in the documents.",
                    "sources": []
                }
            context = "\n\n".join([c['content'] for c in context_chunks])
        
        answer = self.generate_answer(query_text, context)
        
        return {
            "answer": answer,
            "sources": context_chunks
        }

    def get_suggestions(self, query_text: str):
        # Only do the retrieval/reranking part (very fast)
        return query_engine.retrieve_context(query_text, [])

    def generate_answer(self, query: str, context: str) -> str:
        # Use Google Gemini if key is provided
        if settings.GOOGLE_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                prompt = f"""
                You are a helpful assistant. Use the following pieces of retrieved context to answer the question.
                If you don't know the answer, just say that you don't know, don't try to make up an answer.
                Keep the answer very concise and relevant.

                Context:
                {context}

                Question: {query}
                """
                
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
                return "I'm sorry, I couldn't generate an answer due to safety filters."
            except Exception as e:
                print(f"Gemini Error: {e}")
                return f"AI Error: Gemini is currently unavailable. Please check your API key. (Retrieved context: {context[:100]}...)"
            
    
        else:
            # Fallback logic
            return f"THIS IS A TEST - RAG SERVICE UPDATED: {context.split('.')[0]}."

rag_service = RAGService()
