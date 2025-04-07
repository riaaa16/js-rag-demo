// RAG Demo with LangChain and HuggingFace BERT Model
import { config } from 'dotenv';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { BertEmbeddings, loadQA } from './utils/huggingFaceModels.js'; // Imports embedding and QA Bert Models

// Load environment variables
config();

async function runBasicRAG() {
  console.log('Starting Basic RAG Demo');
  
  try {
    
    // Step 1: Load documents
    console.log('\nLoading documents...');
    const loader = new DirectoryLoader('./documents', {
      '.txt': (path) => new TextLoader(path)
    });
    
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents.`);
    
    // Step 2: Split documents
    console.log('\nSplitting documents...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100
    });
    
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Created ${splitDocs.length} chunks.`);
    
    // Step 3: Embed documents & create vector store
    const embedder = new BertEmbeddings(); // Create instance of class

    console.log('\nCreating vector store with local embeddings...');
    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embedder);
    
    console.log('Vector store created successfully!');
    
    // Step 4: Perform similarity search
    console.log('\nPerforming similarity search...');
    const query = "What is RAG and what are its components?";
    const results = await vectorStore.similaritySearch(query, 2);
    
    console.log(`Found ${results.length} relevant documents for the query: "${query}"`);
    console.log('\nRelevant documents:');
    results.forEach((doc, i) => {
      console.log(`\nDocument ${i+1}:`);
      console.log(`${doc.pageContent.substring(0, 150)}...`);
    });
    
    // Step 5: Generate response with context
    console.log('\nGenerating answer using retrieved documents...');
    
    const context = results.map(doc => doc.pageContent).join('\n\n');

    // Using BERT-model to respond
    const qaPipeline = await loadQA();
    const response = await qaPipeline(query, context);

    
    console.log('\nAnswer:');
    console.log(response.answer);
    
  } catch (error) {
    console.error('Error in RAG demo:', error);
  }
}

// Run the demo
runBasicRAG()
  .then(() => console.log('\nBasic RAG demo completed.'))
  .catch(err => console.error('Unhandled error:', err));
