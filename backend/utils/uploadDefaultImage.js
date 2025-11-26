import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure cloudinary is configured
dotenv.config({ path: path.join(__dirname, '../.env') });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload default profile image to Cloudinary
 * This should be run once to upload the default image
 */
export const uploadDefaultProfileImage = async () => {
  try {
    const imagePath = path.join(__dirname, '../public/images/UMlogo.png');
    
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'umsafe-defaults',
      public_id: 'default-profile',
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: 'limit' }
      ]
    });

    console.log('[uploadDefaultImage] Default profile image uploaded to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('[uploadDefaultImage] Error uploading default image:', error);
    throw error;
  }
};

/**
 * Get the default profile image URL from Cloudinary
 * If not uploaded, upload it first
 */
export const getDefaultProfileImageUrl = async () => {
  try {
    // Try to get existing image info
    const result = await cloudinary.api.resource('umsafe-defaults/default-profile');
    return result.secure_url;
  } catch (error) {
    // If image doesn't exist, upload it
    if (error.error?.http_code === 404) {
      console.log('[getDefaultProfileImageUrl] Default image not found, uploading...');
      return await uploadDefaultProfileImage();
    }
    throw error;
  }
};
