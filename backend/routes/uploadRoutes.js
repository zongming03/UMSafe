import express from 'express';
import { uploadFiles, uploadFilesToCloudinary, deleteFile } from '../controllers/uploadController.js';
import { upload, uploadToCloudinary, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * POST /upload
 * Upload files to local uploads directory
 * 
 * Body: multipart/form-data with files
 * Returns: { success, message, files: [{ url, filename, mimetype, size }, ...] }
 */
router.post('/', upload.array('files', 10), handleUploadError, uploadFiles);

/**
 * POST /upload/cloudinary
 * Upload files to Cloudinary cloud storage (uses multer-storage-cloudinary)
 * 
 * Body: multipart/form-data with files
 * Returns: { success, message, files: [{ url, filename, mimetype }, ...] }
 */
router.post('/cloudinary', uploadToCloudinary.array('files', 10), handleUploadError, uploadFilesToCloudinary);

/**
 * DELETE /upload/:filename
 * Delete a previously uploaded file
 * 
 * Params: filename - name of file to delete
 * Returns: { message: 'File deleted successfully' }
 */
router.delete('/:filename', deleteFile);

export default router;
