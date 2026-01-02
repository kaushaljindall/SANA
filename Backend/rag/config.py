import os

# RAG Configuration
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# FAISS Index Path
VECTOR_STORE_PATH = os.path.join(os.path.dirname(__file__), "vector_store")
# Raw Knowledge Base Path
KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_data")

# Safety Settings
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
