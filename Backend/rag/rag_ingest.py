import os
import glob
from typing import List
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv
from rag.config import VECTOR_STORE_PATH, KNOWLEDGE_DIR, EMBEDDING_MODEL

# Load environment variables
load_dotenv()

# Metadata Rules
METADATA_MAP = {
    "coping_strategies.md": {
        "source": "coping_strategies",
        "doc_type": "coping_strategy",
        "risk_level": "medium",
        "requires_disclaimer": True
    }
}

def ingest_documents():
    """
    Ingests documents from KNOWLEDGE_DIR, chunks them, and creates a FAISS vector store.
    """
    print("DEBUG: Script started")
    
    print(f"🔄 Starting ingestion from {KNOWLEDGE_DIR}...")
    
    documents = []
    
    # Load Text & Markdown Files
    for ext in ["**/*.txt", "**/*.md"]:
        for file_path in glob.glob(os.path.join(KNOWLEDGE_DIR, ext), recursive=True):
            print(f"  - Loading {file_path}")
            loader = TextLoader(file_path, encoding="utf-8")
            loaded_docs = loader.load()
            
            # Inject Metadata
            filename = os.path.basename(file_path)
            if filename in METADATA_MAP:
                print(f"    ℹ️ Applying metadata for {filename}")
                for doc in loaded_docs:
                    doc.metadata.update(METADATA_MAP[filename])
            
            documents.extend(loaded_docs)

    # Load PDF Files
    for file_path in glob.glob(os.path.join(KNOWLEDGE_DIR, "**/*.pdf"), recursive=True):
        print(f"  - Loading {file_path}")
        loader = PyPDFLoader(file_path)
        documents.extend(loader.load())

    if not documents:
        print("⚠️ No documents found to ingest.")
        return

    # Chunking
    print(f"✂️ Splitting {len(documents)} documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", "##", ".", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"✅ Created {len(chunks)} chunks.")
    
    if chunks:
        print(f"Example Chunk Metadata: {chunks[0].metadata}")

    # Embedding and Vector Store
    print(f"🧠 Generating embeddings using {EMBEDDING_MODEL}...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    # Save index
    vector_store.save_local(VECTOR_STORE_PATH)
    print(f"💾 Vector store saved to {VECTOR_STORE_PATH}")

if __name__ == "__main__":
    if not os.path.exists(KNOWLEDGE_DIR):
        os.makedirs(KNOWLEDGE_DIR)
        print(f"📁 Created knowledge directory: {KNOWLEDGE_DIR}")
        print("ℹ️ Please add .txt or .pdf files to this directory and run again.")
    else:
        ingest_documents()
