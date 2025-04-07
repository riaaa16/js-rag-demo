import { Embeddings } from '@langchain/core/embeddings';
import { pipeline } from '@huggingface/transformers';

// Class using a HuggingFace model to create vectors
export class BertEmbeddings extends Embeddings { // Implement Langchain's Embeddings interface
  static instance = null;
  embedder = null;

  // Constructor
  constructor() {
    super(); // Call parent constructor
    if (BertEmbeddings.instance) return BertEmbeddings.instance; // Singleton pattern
    BertEmbeddings.instance = this;
  }

  // Initialize the embedder
  async initEmbedder() {
    if (!this.embedder) {
      console.log("Initializing embedder...");
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        dtype: 'fp16',
      });
    }
  }

  // To integrate with LangChain - embeds text
  async embedQuery(text) {
    await this.initEmbedder();
    if (!text || typeof text !== 'string') { // If the text is null or not a string, skip it
      console.warn(`⚠️ Invalid input to embedQuery: ${text}`);
      return [];
    }
    const result = await this.embedder(text, { pooling: 'mean', normalize: true });
    return result[0]; // 1D array
  }

  // Function LangChan expects - embeds documents
  async embedDocuments(documents) {
    await this.initEmbedder();
    return Promise.all(
      documents.map(doc => {
        if (!doc?.pageContent || typeof doc.pageContent !== 'string') { // If the text is null or not a string, skip it
          // console.warn(`⚠️ Skipping invalid doc:`, doc);
          return [];
        }
        return this.embedQuery(doc.pageContent);
      })
    );
  }
}

// Load a question-answering pipeline using BERT model
export async function loadQA() {
  // Load a BERT-model for QA
  const qaPipeline = await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad', {
    dtype: 'fp16' // Lower precision for faster calculations
  });
  return qaPipeline;
}