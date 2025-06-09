import axios from "axios";
import dotenv from 'dotenv';
import sharp from "sharp";
import * as libs from '../libs/index.js';

dotenv.config();

const SearchController = {

  searchByImage: async (req, res, next) => {
    try {
      if (!req.file) return next();

      const userId = req.headers['x-user-id'];
      const page = parseInt(req.query.page || "1");
      const perPage = parseInt(req.query.perPage || "250");
      const allowedTypes = ["png", "jpg", "jpeg"];
      const fileType = req.file.mimetype.split('/')[1].toLowerCase();
      let embedding = req.body.embedding || null
      const { price = null, color = null, category = null } = req.query;

      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ message: "Uploaded file must be an image (png, jpg, jpeg)" });
      }

      const filter = { should: [] };
      if (price) {
        filter.should.push({
          key: 'price',
          range: { gte: parseFloat(price) }
        });
      }
      if (color) {
        filter.should.push({
          key: 'color',
          match: { value: color }
        });
      }
      if (category) {
        filter.should.push({
          key: 'category',
          match: { value: category }
        })
      }

      const limitMb = parseFloat(process.env.IMAGE_SIZE_LIMIT || "5");
      const MB = 1024 * 1024;
      if (req.file.size / MB >= limitMb) {
        req.file.buffer = await sharp(req.file.buffer)
          .resize({ width: 1024 })
          .jpeg({ quality: 70 })
          .toBuffer();
      }

      let imageUrl;
      if (!embedding) {
        const result = await libs.streamUpload(req);
        imageUrl = result.url;

        const clipResponse = await axios.post(process.env.CLIP_IMAGE_ENDPOINT, {
          images: [imageUrl]
        });

        embedding = clipResponse.data.embeddings;
      }

      const results = await libs.searchQdrant(embedding, {
        limit: perPage,
        offset: page,
        filter,
        with_vector: true
      });

      await axios.post(process.env.HISTORY_ENDPOINT, {
        image: imageUrl
      }, {
        headers: { 'x-user-id': userId }
      });

      const response = libs.formatQdrantResults(results)

      return res.json({
        results: response
      });

    } catch (error) {
      console.error("Search by image error:", error?.response?.data || error);
      return res.status(500).json({ message: "Failed to process image with CLIP." });
    }
  },

  searchByText: async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ message: "Text is required" });

      const userId = req.headers['x-user-id'];
      const page = parseInt(req.query.page || "1");
      const perPage = parseInt(req.query.perPage || "250");
      const { price = null, color = null, category = null } = req.query;
      let embedding = req.body.embedding || null

      const filter = { should: [] };
      if (price) {
        filter.should.push({
          key: 'price',
          range: { gte: parseFloat(price) }
        });
      }
      if (color) {
        filter.should.push({
          key: 'color',
          match: { value: color }
        });
      }
      if (category) {
        filter.should.push({
          key: 'category',
          match: { value: category }
        })
      }

      if (!embedding) {
        const clipResponse = await axios.post(process.env.CLIP_TEXT_ENDPOINT, { text: text });

        embedding = clipResponse.data.embeddings;
      }

      const offset = (page - 1) * perPage;
      const results = await libs.searchQdrant(embedding, { limit: perPage, offset, filter, with_vector: true });

      await axios.post(process.env.HISTORY_ENDPOINT, { text: text }, { headers: { 'x-user-id': userId } });
      const response = libs.formatQdrantResults(results)

      res.json({
        results: response
      });

    } catch (error) {
      console.error("Search by text error:", error);
      res.status(500).json({ message: "Failed to process text search." });
    }
  },

  searchByImageAndText: async (req, res) => {
    try {
      const { text } = req.body;
      if (!req.file) return res.status(400).json({ message: "Image file is required" });

      const userId = req.headers['x-user-id'];
      const page = parseInt(req.query.page || "1");
      const perPage = parseInt(req.query.perPage || "250");
      const { price = null, color = null, category = null } = req.query;
      let embedding = req.body.embedding || null

      const filter = { should: [] };
      if (price) {
        filter.should.push({
          key: 'price',
          range: { gte: parseFloat(price) }
        });
      }
      if (color) {
        filter.should.push({
          key: 'color',
          match: { value: color }
        });
      }
      if (category) {
        filter.should.push({
          key: 'category',
          match: { value: category }
        })
      }

      const limitMb = parseFloat(process.env.IMAGE_SIZE_LIMIT || "5");
      const MB = 1024 * 1024
      if (req.file.size / MB >= limitMb) {
        req.file.buffer = await sharp(req.file.buffer)
          .resize({ width: 1024 })
          .jpeg({ quality: 70 })
          .toBuffer();

        console.log(`Image has been compressed to ${req.file.size / MB}`)
      }

      let imageUrl;
      if (!embedding) {
        const result = await libs.streamUpload(req);
        imageUrl = result.url;

        const croppedImage = await libs.getCroppedImage(userId, imageUrl, text)

        const clipResponse = await axios.post(
          process.env.CLIP_COMBINED_ENDPOINT,
          { text: text, images: [croppedImage] }
        );

        embedding = clipResponse.data.embeddings;
      }

      const offset = (page - 1) * perPage;
      const results = await libs.searchQdrant(embedding, { limit: perPage, offset, filter, with_vector: true });

      const response = libs.formatQdrantResults(results)


      await axios.post(
        process.env.HISTORY_ENDPOINT,
        { image: imageUrl, text: text },
        { headers: { 'x-user-id': userId } }
      );

      res.json({ results: response });

    } catch (error) {
      console.error("Search by image and text error:", error);
      res.status(500).json({ message: "Failed to process combined image and text search." });
    }
  },

  findSimilarById: async (req, res) => {
    try {
      const id = +req.params.id;
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID parameter" });

      const page = parseInt(req.query.page || "1");
      const perPage = parseInt(req.query.perPage || "250");
      const { price = null, color = null, category = null } = req.query;

      const filter = { should: [] };
      if (price) {
        filter.should.push({
          key: 'price',
          range: { gte: parseFloat(price) }
        });
      }
      if (color) {
        filter.should.push({
          key: 'color',
          match: { value: color }
        });
      }
      if (category) {
        filter.should.push({
          key: 'category',
          match: { value: category }
        })
      }

      const [point] = await libs.qdrant.retrieve(process.env.QDRANT_COLLECTION, {
        ids: [id],
        with_vector: true,
      });

      if (!point) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const vector = point.vector;

      if (!vector) {
        return res.status(404).json({ message: 'Vector not found for this ID' });
      }

      const offset = (page - 1) * perPage;
      const results = await libs.qdrant.search(process.env.QDRANT_COLLECTION, {
        vector,
        with_vector: true,
        limit: perPage,
        offset,
        filter,
      });

      const response = libs.formatQdrantResults(results)

      res.json({ results: response });
    } catch (error) {
      console.error("Find similar by ID error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default SearchController;
