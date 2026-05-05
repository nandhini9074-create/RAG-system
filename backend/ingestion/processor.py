import fitz  # PyMuPDF
import docx
import re
from typing import List, Dict, Any
from utils.config import settings

class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    @staticmethod
    def clean_text(text: str) -> str:
        # Basic cleaning: remove extra whitespaces, normalize line breaks
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text

    @staticmethod
    def chunk_text(text: str, chunk_size: int = settings.CHUNK_SIZE, overlap: int = settings.CHUNK_OVERLAP) -> List[str]:
        chunks = []
        words = text.split()
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        return chunks

    def process_file(self, file_path: str, file_name: str) -> List[Dict[str, Any]]:
        ext = file_name.split('.')[-1].lower()
        if ext == 'pdf':
            text = self.extract_text_from_pdf(file_path)
        elif ext == 'docx':
            text = self.extract_text_from_docx(file_path)
        elif ext == 'txt':
            text = self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        cleaned_text = self.clean_text(text)
        chunks = self.chunk_text(cleaned_text)
        
        processed_chunks = []
        for idx, chunk in enumerate(chunks):
            processed_chunks.append({
                "content": chunk,
                "metadata": {
                    "file_name": file_name,
                    "chunk_id": idx,
                    "type": ext
                }
            })
        return processed_chunks

document_processor = DocumentProcessor()
