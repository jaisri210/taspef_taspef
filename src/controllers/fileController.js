import File from '../models/File.js'
import fs from 'fs'
import { ensureOnDisk } from '../utils/uploadStore.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Upload a new file
 * @route POST /api/files
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
      })
    }

    const { filename, originalname, mimetype, size, path: filePath } = req.file

    // Create file document
    const file = await File.create({
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      url: `/api/files/${filename}/download`,
      path: filePath,
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
    })

    res.status(201).json({
      success: true,
      file: {
        _id: file._id,
        originalName: file.originalName,
        url: file.url,
        size: file.size,
        mimeType: file.mimeType,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to upload file',
        details: error.message,
      },
    })
  }
}

/**
 * Get paginated list of files
 * @route GET /api/files?page=1&limit=12
 */
export const getFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Optional filters
    const filter = {}
    if (req.query.mimeType) {
      filter.mimeType = req.query.mimeType
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search }
    }

    // Get total count
    const totalItems = await File.countDocuments(filter)
    const totalPages = Math.ceil(totalItems / limit)

    // Get paginated files
    const files = await File.find(filter)
      .select('-path -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Transform response
    const data = files.map(file => ({
      _id: file._id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      uploadedAt: file.createdAt,
      downloads: file.downloads,
      description: file.description,
      tags: file.tags,
    }))

    res.json({
      data,
      page,
      limit,
      totalItems,
      totalPages,
    })
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch files',
        details: error.message,
      },
    })
  }
}

/**
 * Get single file metadata
 * @route GET /api/files/:id
 */
export const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).select('-path -__v')

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      })
    }

    res.json({
      success: true,
      file: {
        _id: file._id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        uploadedAt: file.createdAt,
        downloads: file.downloads,
        description: file.description,
        tags: file.tags,
      },
    })
  } catch (error) {
    console.error('Get file error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch file',
        details: error.message,
      },
    })
  }
}

/**
 * Download a file
 * @route GET /api/files/:id/download
 */
export const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      })
    }

    // Check if file exists on disk (restoring it from the Mongo backup if a
    // redeploy wiped the disk)
    if (!(await ensureOnDisk(file.filename))) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found on server',
        },
      })
    }

    // Increment download count
    await file.incrementDownloads()

    // Set headers
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`)
    res.setHeader('Content-Length', file.size)

    // Stream file
    const fileStream = fs.createReadStream(file.path)
    fileStream.pipe(res)

    fileStream.on('error', (error) => {
      console.error('File stream error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'STREAM_ERROR',
            message: 'Error streaming file',
          },
        })
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to download file',
          details: error.message,
        },
      })
    }
  }
}

/**
 * Delete a file
 * @route DELETE /api/files/:id
 */
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      })
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete file',
        details: error.message,
      },
    })
  }
}

/**
 * Get file statistics
 * @route GET /api/files/stats
 */
export const getFileStats = async (req, res) => {
  try {
    const stats = await File.getStatistics()
    const filesByType = await File.getFilesByType()

    res.json({
      success: true,
      stats: {
        ...stats,
        filesByType,
      },
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch statistics',
        details: error.message,
      },
    })
  }
}

