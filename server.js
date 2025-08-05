const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 uploads per windowMs
    message: 'Too many file uploads from this IP, please try again later.',
});

app.use(limiter);
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = path.extname(sanitizedName);
        const baseName = path.basename(sanitizedName, extension);
        cb(null, `${uniqueId}_${baseName}${extension}`);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 5 // Maximum 5 files per request
    }
});

// In-memory storage for file metadata (in production, use a database)
let fileDatabase = new Map();

// API Routes

// Get server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Upload files
app.post('/api/upload', uploadLimiter, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const fileId = uuidv4();
            const fileMetadata = {
                id: fileId,
                originalName: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                uploadDate: new Date().toISOString(),
                path: file.path
            };

            // Store metadata
            fileDatabase.set(fileId, fileMetadata);

            uploadedFiles.push({
                id: fileId,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                uploadDate: fileMetadata.uploadDate
            });
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload files'
        });
    }
});

// Get file list
app.get('/api/files', (req, res) => {
    try {
        const files = Array.from(fileDatabase.values()).map(file => ({
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            mimetype: file.mimetype,
            uploadDate: file.uploadDate
        }));

        res.json({
            success: true,
            files: files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch files'
        });
    }
});

// Get specific file metadata
app.get('/api/files/:id', (req, res) => {
    try {
        const fileId = req.params.id;
        const file = fileDatabase.get(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.json({
            success: true,
            file: {
                id: file.id,
                originalName: file.originalName,
                size: file.size,
                mimetype: file.mimetype,
                uploadDate: file.uploadDate
            }
        });
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch file'
        });
    }
});

// Download file
app.get('/api/files/:id/download', (req, res) => {
    try {
        const fileId = req.params.id;
        const file = fileDatabase.get(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk'
            });
        }

        res.download(file.path, file.originalName);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download file'
        });
    }
});

// Serve file for viewing
app.get('/api/files/:id/view', (req, res) => {
    try {
        const fileId = req.params.id;
        const file = fileDatabase.get(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk'
            });
        }

        const stat = fs.statSync(file.path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;
            const fileStream = fs.createReadStream(file.path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': file.mimetype,
            };
            res.writeHead(206, head);
            fileStream.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': file.mimetype,
            };
            res.writeHead(200, head);
            fs.createReadStream(file.path).pipe(res);
        }
    } catch (error) {
        console.error('View error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to serve file'
        });
    }
});

// Delete file
app.delete('/api/files/:id', (req, res) => {
    try {
        const fileId = req.params.id;
        const file = fileDatabase.get(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Delete file from disk
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Remove from database
        fileDatabase.delete(fileId);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete file'
        });
    }
});

// Cleanup old files (runs every hour)
const cleanupOldFiles = () => {
    try {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let deletedCount = 0;

        for (const [fileId, file] of fileDatabase.entries()) {
            const uploadTime = new Date(file.uploadDate).getTime();
            
            if (uploadTime < oneDayAgo) {
                // Delete file from disk
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                
                // Remove from database
                fileDatabase.delete(fileId);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} old files`);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 50MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum 5 files per upload.'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PDF Viewer Server running on port ${PORT}`);
    console.log(`📁 Upload directory: ${uploadsDir}`);
    console.log(`🌐 Access the application at: http://localhost:${PORT}`);
});

module.exports = app;