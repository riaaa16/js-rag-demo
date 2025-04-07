// RAG Demo with LangChain and HuggingFace BERT Model - with file output
import { config } from 'dotenv';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import fs from 'fs/promises';
import { BertEmbeddings, loadQA } from './utils/huggingFaceModels.js'; // Imports embedding and QA Bert Models

// Load environment variables
config();

// Create a log file for output
async function logToFile(content) {
  await fs.appendFile('rag-output.txt', content + '\n');
  console.log(content);
}

// Main function to demonstrate RAG
async function runRAGDemo() {
  // Reset the log file
  await fs.writeFile('rag-output.txt', '');
  
  await logToFile('🚀 Starting RAG Demo with LangChain and BERT Model');
  
  try {
    
    // Step 1: Load documents
    await logToFile('\n📚 Loading documents...');
    const loader = new DirectoryLoader('./documents', {
      '.txt': (path) => new TextLoader(path)
    });
    
    const docs = await loader.load();
    await logToFile(`Loaded ${docs.length} documents.`);
    
    // Step 2: Split documents into chunks
    await logToFile('\n✂️ Splitting documents into chunks...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100
    });
    
    const splitDocs = await textSplitter.splitDocuments(docs);
    await logToFile(`Created ${splitDocs.length} chunks.`);
    
    // Check document validity
    for (let i = 0; i < splitDocs.length; i++) {
      if (typeof splitDocs[i].pageContent !== 'string') {
        await logToFile(`Document at index ${i} has invalid pageContent type: ${typeof splitDocs[i].pageContent}`);
        splitDocs[i].pageContent = String(splitDocs[i].pageContent || '');
      }
    }
    
    // Step 3: Embed documents & create vector store
    await logToFile('\nCreating vector store with local embeddings...');
    const embedder = new BertEmbeddings(); // Create instance of class

    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embedder);
    
    await logToFile('Vector store created successfully.');
    
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
    await logToFile(`Error in RAG demo: ${error.message}`);
    await logToFile(error.stack);
  }
}

// Process a single query using the vector store
async function processQuery(query, vectorStore) {
  await logToFile(`\n❓ Question: ${query}`);
  await logToFile('Retrieving relevant documents...');
  
  try {
    // Get similar documents
    const relevantDocs = await vectorStore.similaritySearch(query, 2);
    await logToFile(`Found ${relevantDocs.length} relevant documents.`);
    
    // Extract context
    const context = relevantDocs.map((doc, i) => {
      return `Document ${i+1}:\n${doc.pageContent}`;
    }).join('\n\n');
    
    // Generate response
    await logToFile('Generating answer using context...');

    // Using BERT-model to respond
    const qaPipeline = await loadQA();
    const response = await qaPipeline(query, context);
    
    await logToFile('\n🔍 Answer:');
    await logToFile(response.answer);
    
  } catch (error) {
    await logToFile(`Error processing query: ${error.message}`);
    await logToFile(error.stack);
  }
}

// Run the demo
runRAGDemo()
  .then(() => logToFile('\nRAG demo completed.'))
  .catch(error => logToFile(`Fatal error in RAG demo: ${error.message}`));
