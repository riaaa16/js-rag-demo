// RAG Demo with LangChain and HuggingFace BERT Model
import { config } from 'dotenv';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { BertEmbeddings, loadQA } from './utils/huggingFaceModels.js'; // Imports embedding and QA Bert Models

// Load environment variables
config();

// Main function to demonstrate RAG
async function runRAGDemo() {
  console.log('🚀 RAG Demo with LangChain and HuggingFace BERT Model');
  
  try {   

    // Step 1: Load documents
    console.log('\n📚 Loading documents...');
    const loader = new DirectoryLoader('./documents', {
      '.txt': (path) => new TextLoader(path)
    });
    
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents.`);
    
    // Step 2: Split documents into chunks
    console.log('\n✂️ Splitting documents into chunks...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100
    });
    
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Created ${splitDocs.length} chunks.`);
    
    // Check document validity
    for (let i = 0; i < splitDocs.length; i++) {
      if (typeof splitDocs[i].pageContent !== 'string') {
        console.error(`Document at index ${i} has invalid pageContent type: ${typeof splitDocs[i].pageContent}`);
        splitDocs[i].pageContent = String(splitDocs[i].pageContent || '');
      }
    }
    
    // Step 3: Embed documents & create vector store
    const embedder = new BertEmbeddings(); // Create instance of class

    console.log('\nCreating vector store with local embeddings...');
    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embedder); // Pass documents to instance

    console.log('Vector store created successfully!');
    
    // Handle queries directly without complex chains
    const queries = [
      'What is RAG and what are its key components?',
      'What are vector databases and how do they work?',
      'How does embedding generation work in RAG systems?'
    ];
    
    for (const query of queries) {
      await processQuery(query, vectorStore);
    }
    
  } catch (error) {
    console.error('Error in RAG demo:', error);
  }
}

// Process a single query using the vector store
async function processQuery(query, vectorStore) {
  console.log(`\n❓ Question: ${query}`);
  console.log('Retrieving relevant documents...');
  
  try {
    // Get similar documents
    const relevantDocs = await vectorStore.similaritySearch(query, 2); // Retrieve 2 documents
    console.log(`Found ${relevantDocs.length} relevant documents.`);
    
    // Extract context
    const context = relevantDocs.map((doc, i) => {
      return `Document ${i+1}:\n${doc.pageContent}`;
    }).join('\n\n');

    // Generate response
    console.log('Generating answer using context...');
    const qaPipeline = await loadQA();
    const response = await qaPipeline(query, context);

    console.log('\n🔍 Answer:');
    console.log(response.answer);
    
  } catch (error) {
    console.error('Error processing query:', error);
  }
}

// Run the demo
runRAGDemo()
  .then(() => console.log('\nRAG demo completed.'))
  .catch(error => console.error('Fatal error in RAG demo:', error));
