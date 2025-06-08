import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_ENDPOINT,
  apiKey: process.env.QDRANT_KEY,
  // timeout: 10000,
  // checkCompatibility: false, 
});

export default qdrant;
