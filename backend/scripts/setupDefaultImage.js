import { uploadDefaultProfileImage } from '../utils/uploadDefaultImage.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Script to upload default profile image to Cloudinary
 * Run this once: node backend/scripts/setupDefaultImage.js
 */
const setup = async () => {
  try {
    console.log('Starting default image upload to Cloudinary...');
    const imageUrl = await uploadDefaultProfileImage();
    console.log('✅ Default profile image uploaded successfully!');
    console.log('URL:', imageUrl);
    console.log('\nYou can now use this URL as the default profile image.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to upload default image:', error);
    process.exit(1);
  }
};

setup();
