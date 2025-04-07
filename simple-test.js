// Simple diagnostic test for BERT Model embeddings and RAG
import { config } from 'dotenv';
import { BertEmbeddings, loadQA } from './utils/huggingFaceModels.js'; // Imports embedding and QA Bert Models

// Load environment variables
config();

async function testBERT() {
  try {
    console.log('Starting BERT test...');
    const embedder = new BertEmbeddings(); // Create instance of class
    
    // Test embeddings
    console.log('Testing embeddings...');
    const testText = 'This is a test sentence for embeddings.';
    try {
      const embedding = await embedder.embedQuery(testText);
      console.log(`Successfully generated embedding with ${embedding.data.length} dimensions`);
    } catch (error) {
      console.error('Error generating embeddings:', error);
    }
    
    // Test chat completions
    console.log('\nTesting BERT chat completions...');
    
    try {
      // Test BERT Model for QA
      const qaPipeline = await loadQA();
      const response = await qaPipeline(
        "What is RAG in the context of AI?",
        "RAG stands for Retrieval-Augmented Generation. It is an AI framework that combines information retrieval with generative AI to produce more accurate and contextually relevant responses. In RAG systems, an AI model first retrieves relevant information from a knowledge base, then uses that retrieved information to generate more informed and accurate responses."
      );

      console.log('Chat completion result:');
      console.log(response.answer);
    } catch (error) {
      console.error('Error generating chat completion:', error);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run test
testBERT()
  .then(() => console.log('\nTest completed.'))
  .catch(err => console.error('Unhandled error:', err));
