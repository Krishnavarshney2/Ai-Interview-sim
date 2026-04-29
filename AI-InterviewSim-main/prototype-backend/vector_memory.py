# vector_memory.py

from langchain_community.vectorstores.faiss import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
import faiss
import numpy as np

class VectorMemory:
    def __init__(self, model_name="all-MiniLM-L6-v2", similarity_threshold=0.75):
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.qa_pairs = []  # List of {"question": q, "answer": a}
        self.similarity_threshold = similarity_threshold
        
        # Initialize FAISS index for semantic similarity
        # Use L2 distance with embedding dimension
        self.embedding_dim = 384  # all-MiniLM-L6-v2 dimension
        self.index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product for cosine similarity
        self.documents = []  # Store original texts for retrieval
        self._is_initialized = False

    def add_qa(self, question, answer):
        """Add a Q&A pair and its embedding to the FAISS index."""
        self.qa_pairs.append({"question": question, "answer": answer})
        
        # Create embedding for the question
        embedding = self.embeddings.embed_query(question)
        
        # Normalize for cosine similarity
        embedding = np.array([embedding], dtype=np.float32)
        faiss.normalize_L2(embedding)
        
        # Add to FAISS index
        self.index.add(embedding)
        self.documents.append(question)
        self._is_initialized = True

    def is_duplicate_topic(self, new_question):
        """Check if a similar question has already been asked using FAISS semantic search."""
        if not self._is_initialized or len(self.qa_pairs) == 0:
            return False
            
        # Embed the new question
        new_embedding = self.embeddings.embed_query(new_question)
        new_embedding = np.array([new_embedding], dtype=np.float32)
        faiss.normalize_L2(new_embedding)
        
        # Search for most similar questions
        k = min(3, len(self.qa_pairs))  # Check top 3 most similar
        similarities, indices = self.index.search(new_embedding, k)
        
        # Check if any similarity exceeds threshold
        for i, sim in enumerate(similarities[0]):
            if sim >= self.similarity_threshold:
                return True  # Considered duplicate
                
        return False

    def get_similar_questions(self, question, top_k=3):
        """Retrieve the most similar past questions using FAISS."""
        if not self._is_initialized or len(self.qa_pairs) == 0:
            return []
            
        # Embed the question
        query_embedding = self.embeddings.embed_query(question)
        query_embedding = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(query_embedding)
        
        # Search
        k = min(top_k, len(self.qa_pairs))
        similarities, indices = self.index.search(query_embedding, k)
        
        # Return results with similarity scores
        results = []
        for i, (sim, idx) in enumerate(zip(similarities[0], indices[0])):
            if idx < len(self.qa_pairs):
                results.append({
                    "question": self.qa_pairs[idx]["question"],
                    "answer": self.qa_pairs[idx]["answer"],
                    "similarity": float(sim)
                })
        
        return results

    def _extract_keywords(self, text):
        """Legacy keyword extraction (kept for backward compatibility)."""
        words = text.lower().split()
        return set(
            word.strip(".,!?()[]\"'") for word in words
            if len(word) > 3 and word not in self.stopwords
        )
