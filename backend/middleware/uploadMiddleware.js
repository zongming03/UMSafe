import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { cloudinary } from '../config/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Configure Cloudinary storage for direct uploads
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype
    let resourceType = 'raw'; // Default to raw for documents
    let folder = 'umsafe-chat';
    let format = null;
    
    if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else {
      // PDFs and other documents use 'raw'
      resourceType = 'raw';
      folder = 'umsafe-attachments';
      
      // For PDFs, preserve the extension
      if (file.mimetype === 'application/pdf') {
        format = 'pdf';
      }
    }

    return {
      folder: folder,
      resource_type: resourceType,
      format: format, // Preserve format for PDFs
      public_id: file.originalname ? file.originalname.split('.')[0] + '-' + Date.now() : undefined,
      // Add flags to make PDFs downloadable and viewable
      flags: resourceType === 'raw' ? 'attachment' : undefined,
    };
  },
});

// File filter - allow common file types
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// Create multer instances
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max file size
    files: 10, // Max 10 files per request
  },
});

export const uploadToCloudinary = multer({
  storage: cloudinaryStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max file size
    files: 10, // Max 10 files per request
  },
});

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File size exceeds 50 MB limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maximum 10 files allowed per upload' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
};
