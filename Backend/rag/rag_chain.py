import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from rag.rag_retriever import rag_retriever

# Safety Disclaimers
DISCLAIMERS = """
Disclaimer: I am an AI assistant, not a doctor. If you are in crisis, please call emergency services immediately.
"""

RAG_SYSTEM_PROMPT = """You are SANA, a mental health AI assistant. 
You must answer the user's question based ONLY on the following context.
Do not use outside knowledge. 
If the answer is not in the context, say: "I want to be careful here. Let’s talk to a professional."
Do not diagnose or prescribe.
Maintain a calm, supportive, and empathetic tone.

Context:
{context}
"""

class RagChain:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("❌ GROQ_API_KEY missing for RAG Chain.")
            self.llm = None
            return

        self.llm = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            groq_api_key=api_key,
            temperature=0.3
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", RAG_SYSTEM_PROMPT),
            ("human", "{question}")
        ])
        
        self.chain = (
            {"context": lambda x: x["context"], "question": lambda x: x["question"]}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

    def format_docs(self, docs):
        return "\n\n".join(doc.page_content for doc in docs)

    async def generate_response(self, query: str):
        if not self.llm or not rag_retriever.vector_store:
            return None
        
        # 1. Retrieve
        docs = rag_retriever.retrieve(query)
        if not docs:
            # If no docs found (maybe index empty), return safe fallback specific to RAG failure
            return "I want to be careful here. I don't have enough verified information to answer that safely. Let's talk to a professional."

        # 2. Generate
        context_str = self.format_docs(docs)
        
        try:
            response_text = await self.chain.ainvoke({
                "context": context_str,
                "question": query
            })
            
            # Additional safety check on output length or content could go here
            return response_text
        except Exception as e:
            print(f"❌ RAG Chain Error: {e}")
            return "I'm having trouble retrieving the right information. Please consult a professional."

rag_chain = RagChain()
