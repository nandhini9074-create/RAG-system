from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from typing import List, Optional
from services.rag_service import rag_service
from vector_store.qdrant_store import qdrant_store
from pydantic import BaseModel
import os
import shutil

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    collection_name: Optional[str] = None
    context_override: Optional[str] = None

class SuggestionRequest(BaseModel):
    query: str

@router.post("/upload")
async def upload_documents(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    # Save files to temp storage before passing to background task
    # This prevents 'File already closed' errors in background tasks
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_info = []
    for file in files:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_info.append({"path": file_path, "filename": file.filename})
    
    background_tasks.add_task(rag_service.process_uploads, file_info)
    return {"message": f"Processing {len(files)} files in the background."}

@router.post("/query")
async def query_rag(request: QueryRequest):
    result = rag_service.query(request.query, request.collection_name, request.context_override)
    return result

@router.post("/suggestions")
async def get_suggestions(request: SuggestionRequest):
    suggestions = rag_service.get_suggestions(request.query)
    return {"suggestions": suggestions}

@router.get("/collections")
async def list_collections():
    return {"collections": qdrant_store.list_collections()}

@router.get("/stats")
async def get_db_stats():
    return {"stats": qdrant_store.get_all_stats()}

@router.delete("/collection/{name}")
async def delete_collection(name: str):
    qdrant_store.delete_collection(name)
    return {"message": f"Collection {name} deleted."}
