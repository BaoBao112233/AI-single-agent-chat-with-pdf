import os
import sys
import json
import math
import uuid
from typing import List, Dict, Any, Tuple, Optional
from dotenv import load_dotenv
from openai import OpenAI
import fitz  # PyMuPDF
import pdfplumber
from pypdf import PdfReader


# ------------------------------
# Utility: env + paths
# ------------------------------
def setup_env() -> None:
    """Load environment variables from .env if available, and validate OPENAI_API_KEY."""
    try:
        if load_dotenv is not None:
            load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            print("[ERROR] OPENAI_API_KEY is missing. Create a `.env` file with OPENAI_API_KEY=sk-... or export it.")
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to set up environment variables: {e}")
        sys.exit(1)


def get_user_db_path(user_id: int, session_id: int, custom_path: Optional[str] = None) -> str:
    """Return path of user-specific JSON 'database'. Example: ./database/0/1/rag_vector_db.json"""
    try:
        if custom_path:
            return custom_path
        db_dir = os.path.join(os.getcwd(), "database", str(user_id), str(session_id))
        return os.path.join(db_dir, "rag_vector_db.json")
    except Exception as e:
        print(f"[ERROR] Failed to resolve user DB path: {e}")
        return f"database/{user_id}/{session_id}/rag_vector_db.json"


def get_db_path(custom_path: Optional[str] = None) -> str:
    """Return path of JSON 'database'. Defaults to ./rag_demo_db.json"""
    try:
        return custom_path or os.path.join(os.getcwd(), "rag_demo_db.json")
    except Exception as e:
        print(f"[ERROR] Failed to resolve DB path: {e}")
        return "rag_demo_db.json"


# ------------------------------
# PDF Extraction (with fallbacks)
# ------------------------------
def extract_text_pymupdf(pdf_path: str) -> str:
    """Try extracting text via PyMuPDF (fitz)."""
    if not fitz:
        raise RuntimeError("PyMuPDF (fitz) not available.")
    text = []
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                # Use "text" for plain text; `sort=True` can improve reading order in many docs
                text.append(page.get_text("text", sort=True))
        return "\n".join(text).strip()
    except Exception as e:
        raise RuntimeError(f"PyMuPDF extraction failed: {e}")


def extract_text_pdfplumber(pdf_path: str) -> str:
    """Fallback: extract text via pdfplumber."""
    if not pdfplumber:
        raise RuntimeError("pdfplumber not available.")
    text = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text.append(page_text)
        return "\n".join(text).strip()
    except Exception as e:
        raise RuntimeError(f"pdfplumber extraction failed: {e}")


def extract_text_pypdf(pdf_path: str) -> str:
    """Fallback: extract text via pypdf."""
    if not PdfReader:
        raise RuntimeError("pypdf not available.")
    text = []
    try:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text.append(page_text)
        return "\n".join(text).strip()
    except Exception as e:
        raise RuntimeError(f"pypdf extraction failed: {e}")


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Attempt to extract text from a PDF using:
      1) PyMuPDF (fitz), then 2) pdfplumber, then 3) pypdf.
    Returns raw text (possibly empty string if all methods fail).
    """
    # Validate file exists
    if not os.path.isfile(pdf_path):
        print(f"[ERROR] File not found: {pdf_path}")
        return ""

    # Attempt extraction in order, logging errors but not crashing
    errors = []
    for extractor in (extract_text_pymupdf, extract_text_pdfplumber, extract_text_pypdf):
        try:
            text = extractor(pdf_path)
            if text:
                print(f"[INFO] Extracted text via: {extractor.__name__}")
                return text
        except Exception as e:
            msg = f"{extractor.__name__} error: {e}"
            errors.append(msg)
            print(f"[WARN] {msg}")

    print("[ERROR] All PDF extraction methods failed. Returning empty text.")
    return ""


# ------------------------------
# Chunking
# ------------------------------
def chunk_text(text: str, max_chars: int = 1200, overlap: int = 150) -> List[str]:
    """
    Naive text chunking by character count with overlap.
    - This avoids extra dependencies and works fine for a demo RAG.
    """
    try:
        if not text:
            return []
        tokens = list(text)
        chunks = []
        start = 0
        n = len(tokens)
        while start < n:
            end = min(start + max_chars, n)
            chunks.append("".join(tokens[start:end]).strip())
            if end == n:
                break
            start = max(0, end - overlap)
        return [c for c in chunks if c]
    except Exception as e:
        print(f"[ERROR] Failed to chunk text: {e}")
        return []


# ------------------------------
# Embeddings + Similarity
# ------------------------------
def get_openai_client() -> OpenAI:
    """Create an OpenAI client (will read API key from env)."""
    try:
        client = OpenAI()
        return client
    except Exception as e:
        print(f"[ERROR] Failed to create OpenAI client: {e}")
        raise


def embed_texts(client: OpenAI, texts: List[str], model: str = "text-embedding-3-small") -> List[List[float]]:
    """
    Batch-embed a list of strings. Returns list of vectors.
    Uses a compact embedding model to keep latency/cost low for demo.
    """
    try:
        if not texts:
            return []
        resp = client.embeddings.create(model=model, input=texts)
        # Ensure order is preserved
        embeddings = [d.embedding for d in resp.data]
        return embeddings
    except Exception as e:
        print(f"[ERROR] Embedding failed: {e}")
        return []


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors, safely handling edge cases."""
    try:
        dot = 0.0
        na = 0.0
        nb = 0.0
        for x, y in zip(a, b):
            dot += x * y
            na += x * x
            nb += y * y
        if na == 0.0 or nb == 0.0:
            return 0.0
        return dot / (math.sqrt(na) * math.sqrt(nb))
    except Exception:
        return 0.0


# ------------------------------
# JSON "Database"
# ------------------------------
def load_db(db_path: str) -> Dict[str, Any]:
    """Load the JSON DB; if missing or invalid, return an empty schema."""
    try:
        if not os.path.exists(db_path):
            return {"documents": []}
        with open(db_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict) or "documents" not in data:
            return {"documents": []}
        return data
    except Exception as e:
        print(f"[WARN] Failed to load DB ({db_path}): {e}. Reinitializing.")
        return {"documents": []}


def save_db(db_path: str, data: Dict[str, Any]) -> None:
    """Persist the JSON DB with safe writing."""
    try:
        tmp = db_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, db_path)
        print(f"[INFO] Saved DB to {db_path}")
    except Exception as e:
        print(f"[ERROR] Failed to save DB: {e}")


def ingest_pdf_to_db(pdf_path: str, db_path: str, client: OpenAI) -> Optional[str]:
    """
    Extract text, chunk, embed, and store into the JSON DB.
    Returns the document_id on success, None on failure.
    """
    try:
        raw_text = extract_text_from_pdf(pdf_path)
        if not raw_text:
            print("[ERROR] No text extracted; skipping ingestion.")
            return None

        chunks = chunk_text(raw_text, max_chars=1200, overlap=150)
        if not chunks:
            print("[ERROR] No chunks produced; skipping ingestion.")
            return None

        vectors = embed_texts(client, chunks)
        if not vectors or len(vectors) != len(chunks):
            print("[ERROR] Embeddings failed or mismatch; skipping ingestion.")
            return None

        doc_id = str(uuid.uuid4())
        record = {
            "document_id": doc_id,
            "source_path": os.path.abspath(pdf_path),
            "name": os.path.basename(pdf_path),
            "chunks": [
                {"chunk_id": f"{doc_id}_{i}", "text": ch, "embedding": vec}
                for i, (ch, vec) in enumerate(zip(chunks, vectors))
            ],
        }

        db = load_db(db_path)
        db.setdefault("documents", []).append(record)
        save_db(db_path, db)
        print(f"[INFO] Ingested PDF -> doc_id: {doc_id}, chunks: {len(chunks)}")
        return doc_id
    except Exception as e:
        print(f"[ERROR] Ingestion failed: {e}")
        return None


def search_db(db_path: str, client: OpenAI, query: str, top_k: int = 5) -> List[Tuple[float, str, str]]:
    """
    Compute query embedding, rank all chunks by cosine similarity, and return top_k.
    Returns list of tuples: (score, text, source_path)
    """
    try:
        db = load_db(db_path)
        docs = db.get("documents", [])
        if not docs:
            print("[WARN] DB is empty. Ingest a PDF first.")
            return []

        # Embed query
        q_emb = embed_texts(client, [query])
        if not q_emb:
            print("[ERROR] Query embedding failed.")
            return []
        q = q_emb[0]

        # Rank all chunks
        results = []
        for doc in docs:
            source = doc.get("source_path", "unknown")
            for ch in doc.get("chunks", []):
                emb = ch.get("embedding", [])
                txt = ch.get("text", "")
                score = cosine_similarity(q, emb)
                results.append((score, txt, source))

        # Sort desc by similarity
        results.sort(key=lambda x: x[0], reverse=True)
        return results[: max(1, top_k)]
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []


# ------------------------------
# Tool (Function Tool for the Agent)
# ------------------------------
def retrieve(query: str, user_id: int = 0, session_id: int = 0, top_k: int = 5, db_path: Optional[str] = None) -> str:
    """
    Retrieve the most relevant snippets from the user-specific JSON DB.

    Args:
        query: User's question or search query string
        user_id: User ID to access correct database path
        session_id: Session ID to access correct database path
        top_k: Number of top chunks to return.
        db_path: Optional custom DB file path (defaults to ./database/{user_id}/{session_id}/rag_vector_db.json)

    Returns:
        A formatted string with top snippets and sources for the agent to use in its answer.
    """
    try:
        if not query or not isinstance(query, str):
            return "Query must be a non-empty string."
        client = get_openai_client()
        # Use user-specific database path
        path = get_user_db_path(user_id, session_id, db_path)
        hits = search_db(path, client, query, top_k=top_k)
        if not hits:
            return f"No results found in the knowledge base for user {user_id}, session {session_id}. Please upload a PDF document first."

        lines = []
        for i, (score, text, source) in enumerate(hits, 1):
            # Keep each snippet concise for prompt efficiency
            snippet = text.strip().replace("\n", " ")
            if len(snippet) > 800:
                snippet = snippet[:800] + "..."
            lines.append(f"[{i}] score={score:.4f} | source={source}\n{snippet}\n")

        return "\n".join(lines)
    except Exception as e:
        # Important: tools should never crash the agent loop; always return a graceful message.
        err = f"[retrieve tool error] {e}"
        print(f"[ERROR] {err}")
        return err
