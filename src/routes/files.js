import express from 'express'
import {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  deleteFile,
  getFileStats,
} from '../controllers/fileController.js'
import upload, { handleMulterError } from '../middleware/upload.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = express.Router()

/**
 * @route   POST /api/files
 * @desc    Upload a new file
 * @access  Admin
 */
router.post('/', protect, adminOnly, upload.single('file'), handleMulterError, uploadFile)

/**
 * @route   GET /api/files
 * @desc    Get paginated list of files
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 12)
 * @query   mimeType - Filter by MIME type (optional)
 * @query   search - Search in file names (optional)
 */
router.get('/', getFiles)

/**
 * @route   GET /api/files/stats
 * @desc    Get file statistics
 * @access  Admin
 */
router.get('/stats', protect, adminOnly, getFileStats)

/**
 * @route   GET /api/files/:id
 * @desc    Get file metadata by ID
 * @access  Public
 */
router.get('/:id', getFileById)

/**
 * @route   GET /api/files/:id/download
 * @desc    Download a file
 * @access  Public
 */
router.get('/:id/download', downloadFile)

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file
 * @access  Admin
 */
router.delete('/:id', protect, adminOnly, deleteFile)

export default router

