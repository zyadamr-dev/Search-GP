import cloudinary from "../configs/cloudinary.js";
import streamifier from 'streamifier';

export const streamUpload = (req) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'uploads' },
            (error, result) => result ? resolve(result) : reject(error)
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
};