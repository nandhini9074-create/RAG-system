# RAG Backend System (FastAPI + Qdrant + Redis)

A high-performance **Retrieval-Augmented Generation (RAG)** backend built with FastAPI.

---

## Overview

This project is an advanced Retrieval-Augmented Generation (RAG) system that enables users to:

- Upload documents (PDF, DOCX, TXT)
- Perform intelligent semantic + keyword search
- Generate structured answers using LLMs (Grounded in context)
- Filter results by specific documents
- Optimize performance with multi-layer session caching

It combines vector search, keyword retrieval, and reranking to produce highly relevant answers, even for mixed-language (Tanglish) queries.

---

## Key Features

- **Hybrid Retrieval:** Dense Vector Search + Keyword Matching.
- **Cross-Encoder Reranking:** Deep validation of result relevance.
- **Multi-level Caching:** In-memory session cache with fuzzy query matching.
- **File-level Filtering:** Target specific uploaded documents for answers.
- **Parallel File Ingestion:** Concurrent processing of multiple document uploads.
- **Semantic Chunking:** Context-aware document splitting (500 tokens).
- **Structured LLM Output:** Clean JSON responses with source citations.
- **Tanglish Support:** Understands Tamil-English mixed queries (e.g., "Sollu", "Kudu").

---

## Why This Project

Traditional search systems fail to understand semantic meaning and context. This project solves that by combining:

- **Dense vector search:** Semantic understanding of query intent.
- **Sparse keyword search:** Exact term matching for technical jargon.
- **Cross-encoder reranking:** High-precision neural verification.
- **Caching:** Sub-millisecond response time for repeated queries.

**Result:** Faster and more accurate responses over large document collections.

---

## Performance

- **File ingestion (1000+ chunks):** ~1.3 seconds
- **Embedding Generation:** Batch processed at ~250 chunks/sec
- **Cache hit:** ~instant (< 10ms)
- **Hybrid retrieval:** Optimized for low latency (< 150ms)

---

## SystemFlow-Diagram

```mermaid
graph TD
    %% Entry
    Input((User Query)) --> PreProc[Query Normalization & Tanglish Cleaning]
    
    %% Semantic Layer
    PreProc --> Cache{Semantic Cache Check}
    Cache -- Hit --> Format[Format JSON Response]
    
    %% Retrieval Layer
    Cache -- Miss --> VectorGen[Vector Embedding Generation]
    VectorGen --> ParallelSearch[Parallel Multi-Collection Retrieval]
    ParallelSearch --> Dedup[Neural & Keyword Deduplication]
    
    %% Scoring Strategy
    subgraph Hybrid_Scoring_Engine [Hybrid Ranking Engine]
        Dedup --> InitialRank[Initial Rank: Vector 0.7 / Keyword 0.3]
        InitialRank --> Selection[Top-K Candidate Selection]
        Selection --> CrossRank[Cross-Encoder Neural Reranking]
        CrossRank --> FinalWeight[Final Weighted Merge: 0.6 / 0.2 / 0.2]
    end
    
    %% Quality Control
    FinalWeight --> RelGate{Relevance Threshold Gate}
    RelGate -- Rejected --> NullState[Generate 'Content Not Found']
    RelGate -- Approved --> ContextSynth[LLM Contextual Synthesis]
    
    %% Exit
    ContextSynth --> UpdateCache[Update Semantic Cache]
    NullState --> UpdateCache
    UpdateCache --> Output((Final Professional Analysis))

    style Cache fill:#f8fafc,stroke:#64748b,stroke-width:2px
    style RelGate fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style Hybrid_Scoring_Engine fill:#f1f5f9,stroke:#475569,stroke-dasharray: 5 5
```

---

## ArchitectureFlow-Diagram

```mermaid
graph TB
    subgraph Client_Experience [Presentation Layer: React]
        UI[Chat & Upload Interface]
        State[State Management / Typing Simulation]
    end

    subgraph Service_Orchestrator [Application Layer: FastAPI]
        API_G[REST API Gateway]
        Ingest_M[Ingestion Manager: Async Processing]
        RAG_E[RAG Engine: Hybrid Retrieval Logic]
    end

    subgraph Intelligence_Storage [Data & Knowledge Layer]
        direction LR
        RD[(Redis/In-Memory Cache)]
        QD[(Qdrant: Vector Database)]
    end

    subgraph Neural_Core [AI Models]
        EMB[[Embedding Model]]
        RER[[Cross-Encoder Reranker]]
        LLM[[Groq: Llama 3.1 8B]]
    end

    %% Interaction Flows
    UI <--> API_G
    API_G --> Ingest_M
    API_G --> RAG_E

    Ingest_M --> EMB
    Ingest_M --> QD

    RAG_E <--> RD
    RAG_E --> EMB
    RAG_E --> QD
    RAG_E --> RER
    RAG_E --> LLM

    style Client_Experience fill:#ffffff,stroke:#000,stroke-width:2px
    style Service_Orchestrator fill:#f8fafc,stroke:#334155,stroke-width:2px
    style Intelligence_Storage fill:#f1f5f9,stroke:#475569,stroke-dasharray: 5 5
```

---

## UserFlow-Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant F as React Frontend
    participant B as FastAPI Backend
    participant D as Qdrant/Cache

    Note over U, D: Knowledge Ingestion Phase
    U->>F: Uploads PDF/TXT/DOCX
    F->>B: POST /upload (Multipart)
    B->>B: Extract & Chunk Text
    B->>B: Generate Embeddings
    B->>D: Upsert Points & Metadata
    B-->>F: Ingestion Success Notification

    Note over U, D: Retrieval & Chat Phase
    U->>F: Submits Query (with Filter/TopK)
    F->>B: POST /query
    B->>D: Check Session Cache
    alt Cache Miss
        D-->>B: No Cache
        B->>D: Hybrid Search (Vector + Keyword)
        B->>B: Rerank Top Results
        B->>B: Apply Threshold (0.45)
        B->>B: LLM Grounded Generation
    else Cache Hit
        D-->>B: Return Cached Results
    end
    B-->>F: JSON (Response + Sources)
    
    Note over F: Typing Simulation Effect
    loop For each message
        F->>F: Update messages state (Smooth Delay)
    end
    F-->>U: Renders Professional Analysis
```

---

## Tech Stack

### Backend
- **FastAPI:** Async web framework
- **Qdrant:** Vector Database
- **Redis (In-Memory):** Session Caching
- **Sentence Transformers:** Local Embeddings
- **Cross Encoder:** Neural Reranking
- **Groq API:** Llama 3.1 8B Inference
- **PyMuPDF & python-docx:** Document Processing

### Frontend
- **React (Vite):** Frontend Library
- **Tailwind CSS:** Modern Styling
- **Axios:** API Integration
- **Lucide Icons:** Iconography

---

## Project Structure

```text
.
├── backend/
│   ├── api/                # API Endpoints (routes.py)
│   ├── services/           # Orchestration (rag_service.py)
│   ├── retrieval/          # Hybrid Engine (query_engine.py)
│   ├── vector_store/       # DB Management (qdrant_store.py)
│   ├── ingestion/          # Parsing (processor.py)
│   ├── embeddings/         # Local Models (model.py)
│   ├── utils/              # Config, Cache, Text Utils
│   └── main.py             # Entry Point
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components
│   │   └── App.jsx         # Main App logic
│   └── package.json        # Dependencies
└── README.md
```

---

## File Upload Flow

1. **Upload files** via `POST /upload`
2. **Extract text** from PDF, DOCX, or TXT
3. **Clean and preprocess** document content
4. **Chunk text** into overlapping 500-token segments
5. **Generate embeddings** using local neural models
6. **Store in Qdrant** with metadata (filename, ID)
7. **Store metadata** for advanced filtering

---

## Retrieval Pipeline

- **Query Normalization:** Handles Tanglish and typos.
- **Vector Search:** Dense retrieval for semantic concepts.
- **Keyword Search:** Sparse retrieval for exact matches.
- **Hybrid Merge:** Weighted combination of results.
- **Cross Encoder Reranking:** Secondary deep validation.
- **Threshold Filtering:** Removal of low-confidence results (< 0.45).

---

## Caching Strategy

- **Embedding Cache:** Avoids re-computing identical vectors.
- **Retrieval Cache:** Stores raw database results.
- **Response Cache:** Stores the final LLM-generated answers.
- **Session Caching:** Fuzzy matching for similar user queries.

---

## LLM Processing

Generates grounded, professional responses in structured JSON format:

```json
{
  "answers": [
    {
      "answer": "Detailed answer based on context...",
      "sources": [{"file_name": "...", "score": 0.95}]
    }
  ]
}
```

---

## API Endpoints

### POST /query
```json
{
  "query": "What is photosynthesis?",
  "collection_name": "optional",
  "num_answers": 3
}
```

### POST /upload
Accepts a list of files (`Multipart/form-data`) for background processing.

### GET /stats
Returns point counts and names for all active database collections.

### DELETE /collection/{name}
Permanently removes a collection from the database.

---

## How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Features

- **Multi-document retrieval:** Search across all collections simultaneously.
- **File filtering:** Lock search to specific documents.
- **Hybrid search:** Best-in-class retrieval precision.
- **Reranking:** Minimizes hallucinations.
- **Redis/Memory caching:** Extreme performance.
- **Tanglish Support:** Localized language understanding.
- **Live DB Insights:** Visual monitoring of your knowledge base.

---

# Frontend (React + Tailwind CSS)

A modern, responsive UI for interacting with the RAG backend.

---

## Frontend Structure

```text
frontend/
├── public/                 # Static assets (favicons, manifest)
├── src/
│   ├── assets/             # Global media and image assets
│   ├── components/         # Reusable UI building blocks
│   ├── App.jsx             # Root Component (Chat logic, File handling)
│   ├── App.css             # Component-level styling & Design tokens
│   ├── index.css           # Global Tailwind directives & resets
│   └── main.jsx            # Application entry & DOM mounting
├── package.json            # Scripts and dependencies
├── vite.config.js          # Vite build & proxy settings
└── index.html              # Entry HTML template
```

---

## UI Highlights

- **Clean minimal UI:** Professional indigo/slate aesthetic.
- **Fully responsive:** Works on mobile and desktop.
- **Smooth animations:** Includes typing simulations and progress bars.
- **No scrollbar UI:** Custom hidden scroll for a premium feel.
- **Hover Transitions:** Contextual actions (like Delete) appear on interaction.
