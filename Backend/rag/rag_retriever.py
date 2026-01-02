import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from rag.config import VECTOR_STORE_PATH, EMBEDDING_MODEL

class RagRetriever:
    def __init__(self):
        self.vector_store = None
        self.embeddings = None
        self._load_index()

    def _load_index(self):
        # Using HuggingFace Embeddings (Local)
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
            print(f"✅ Embeddings model loaded: {EMBEDDING_MODEL}")
        except Exception as e:
            print(f"❌ Failed to load embeddings model: {e}")
            return
        
        if os.path.exists(VECTOR_STORE_PATH):
            try:
                self.vector_store = FAISS.load_local(
                    VECTOR_STORE_PATH, 
                    self.embeddings,
                    allow_dangerous_deserialization=True # Required for local files
                )
                print("✅ RAG Vector Store loaded.")
            except Exception as e:
                print(f"❌ Failed to load vector store: {e}")
        else:
            print(f"⚠️ Vector store not found at {VECTOR_STORE_PATH}. Run rag_ingest.py first.")

    def retrieve(self, query: str, k: int = 4) -> list:
        if not self.vector_store:
            return []
        
        try:
            docs = self.vector_store.similarity_search(query, k=k)
            return docs
        except Exception as e:
            print(f"❌ Retrieval error: {e}")
            return []

# Singleton instance
rag_retriever = RagRetriever()
