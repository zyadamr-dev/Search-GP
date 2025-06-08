import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

export const getCroppedImage = (userId, imageUrl, text) => {
    return axios.post(
        process.env.OBJECT_DETECTION_ENDPOINT,
        { title: text, image: imageUrl },
        { headers: { 'x-user-id': userId } }
    ).then(response => {
        const croppedImage = response.data?.croppedImageUrl || imageUrl;
        return croppedImage;
    }).catch(err => {
        console.error("Error in cropped image", err);
        return imageUrl;
    });
};

