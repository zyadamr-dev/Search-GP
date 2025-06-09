import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

const qdrant = new QdrantClient({
  url: process.env.QDRANT_ENDPOINT,
  apiKey: process.env.QDRANT_KEY,
  timeout: 10000,
  checkCompatibility: false, 
});

export default qdrant;
