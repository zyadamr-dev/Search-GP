import qdrant from "../configs/qdrant.js";
import dotenv from 'dotenv'
dotenv.config()

const COLLECTION_NAME = process.env.QDARNT_COLLECTION

export const searchQdrant = async (vector, options = {}) => {
    const searchResult = await qdrant.search(COLLECTION_NAME, {
        vector: vector,
        ...options
    });
    return searchResult;
};