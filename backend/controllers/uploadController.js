import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Upload files to local uploads directory
 * POST /upload
 * 
 * Accepts multipart/form-data with files
 * Returns: { files: [{ url, filename, mimetype, size }, ...] }
 */
export const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Map uploaded files to response format
    const uploadedFiles = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      name: file.originalname,
      mimetype: file.mimetype,
      type: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
    }));

    console.log(`✅ Files uploaded successfully: ${uploadedFiles.length} file(s)`);
    
    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      error: 'File upload failed',
      detail: error.message,
    });
  }
};

/**
 * Upload files to Cloudinary (optional - for cloud storage)
 * POST /upload-cloudinary
 * 
 * Accepts multipart/form-data with files
 * Returns: { files: [{ url, filename, mimetype }, ...] }
 */
export const uploadFilesToCloudinary = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    console.log(`📦 Cloudinary upload successful for ${req.files.length} file(s)`);

    // multer-storage-cloudinary already uploaded files, convert response format
    const uploadedFiles = req.files.map((file) => {
      // CloudinaryStorage provides 'path' with the secure URL
      let url = file.path;
      
      console.log(`📄 Processing file: ${file.originalname}`);
      console.log(`   Mimetype: ${file.mimetype}`);
      console.log(`   Resource Type: ${file.resource_type}`);
      console.log(`   Original URL: ${url}`);
      
      // Ensure URL uses HTTPS for security (Cloudinary best practice)
      if (url && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }
      
      return {
        url: url, // Use the Cloudinary URL with HTTPS
        path: url,
        filename: file.originalname,
        name: file.originalname,
        mimetype: file.mimetype,
        type: file.mimetype,
        size: file.size,
        resource_type: file.resource_type,
      };
    });

    console.log(`✅ Files processed from Cloudinary:`, uploadedFiles);

    res.status(200).json({
      success: true,
      message: 'Files uploaded to Cloudinary successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    res.status(500).json({
      error: 'Cloudinary upload failed',
      detail: error.message,
    });
  }
};

/**
 * Delete uploaded file
 * DELETE /upload/:filename
 */
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ error: 'Filename required' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    console.log(`✅ File deleted: ${filename}`);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('❌ File deletion error:', error);
    res.status(500).json({
      error: 'File deletion failed',
      detail: error.message,
    });
  }
};
