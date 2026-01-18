import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Verify credentials are loaded
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials in environment variables');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS for all API requests
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'umsafe-profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    // Only apply transformation to images, not PDFs or other files
    transformation: function(req, file) {
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        return [{ width: 500, height: 500, crop: 'limit' }];
      }
      return []; // No transformation for non-images
    }
  }
});

export { cloudinary, storage };
