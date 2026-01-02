import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from rag.config import VECTOR_STORE_PATH, EMBEDDING_MODEL

def visualize_rag_space():
    # 1. Load Vector Store
    print("Loading vector store...")
    try:
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        vector_store = FAISS.load_local(
            VECTOR_STORE_PATH, 
            embeddings,
            allow_dangerous_deserialization=True
        )
    except Exception as e:
        print(f"❌ Could not load vector store: {e}")
        return

    # 2. Extract Vectors
    # FAISS index access
    index = vector_store.index
    n_vectors = index.ntotal
    print(f"Found {n_vectors} chunks in knowledge base.")

    if n_vectors < 2:
        print("Not enough vectors to visualize.")
        return

    # Reconstruct vectors from index
    # Note: This requires the index to support reconstruction (FAISS default Flat index does)
    vectors = []
    for i in range(n_vectors):
        vectors.append(index.reconstruct(i))
    
    vectors = np.array(vectors) # Shape: (n_samples, n_features)

    # 3. PCA Reduction to 2D
    print("Computing 2D projection...")
    pca = PCA(n_components=2)
    vectors_2d = pca.fit_transform(vectors)

    # 4. Plot
    plt.figure(figsize=(10, 8))
    plt.scatter(vectors_2d[:, 0], vectors_2d[:, 1], c='blue', alpha=0.6, edgecolors='k')
    
    # Optional: Annotate a few points if possible (cannot easily get doc content back from raw index without store.docstore mapping)
    # But we can try to get docstore entries
    
    plt.title(f"RAG Knowledge Space (PCA Projection)\n{n_vectors} Document Chunks")
    plt.xlabel("Component 1")
    plt.ylabel("Component 2")
    plt.grid(True, linestyle='--', alpha=0.3)
    
    output_path = os.path.join(os.path.dirname(__file__), "embeddings_map.png")
    plt.savefig(output_path, dpi=300)
    print(f"✅ Visualization saved to: {output_path}")

if __name__ == "__main__":
    visualize_rag_space()
