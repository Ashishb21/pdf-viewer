# 📄 Advanced PDF Viewer Server

A full-featured PDF and Word document viewer with server backend, built with Node.js and Express. Features perfect PDF rendering, Word document conversion, file upload, storage management, and a modern web interface.

## ✨ Features

### 📄 Document Support
- **PDF Documents**: Perfect rendering using PDF.js
- **Word Documents**: Convert .doc and .docx files to viewable format
- **Multiple File Upload**: Upload up to 5 files simultaneously
- **Drag & Drop Interface**: Modern file upload experience

### 🚀 Server Features
- **RESTful API**: Complete file management API
- **File Storage**: Secure server-side file storage
- **Rate Limiting**: Protection against abuse
- **Security Headers**: Helmet.js security middleware
- **File Validation**: Strict file type and size validation
- **Auto Cleanup**: Automatic removal of old files

### 🎯 Viewer Features
- **Zoom Controls**: 50% to 300% zoom levels
- **Page Navigation**: Previous/next and direct page jump
- **Fit Options**: Fit width and fit page modes
- **Keyboard Shortcuts**: Arrow keys for navigation, +/- for zoom
- **Download Support**: Download original files
- **Recent Files**: Track and reload recent documents

### 🔐 Security Features
- **File Type Validation**: Only PDF and Word documents allowed
- **Size Limits**: 50MB maximum file size
- **Rate Limiting**: Upload and request rate limiting
- **CORS Protection**: Configurable CORS settings
- **Helmet Security**: Security headers and CSP

## 🛠 Installation

### Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn package manager

### Quick Start

1. **Clone or download the project**
```bash
cd PdfViewer
```

2. **Make the startup script executable and run**
```bash
chmod +x start.sh
./start.sh
```

3. **Open your browser**
Navigate to: `http://localhost:3000`

### Manual Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment (optional)**
```bash
cp .env.example .env
# Edit .env file to customize settings
```

3. **Start the server**
```bash
# Production mode
npm start

# Development mode (with auto-restart)
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root to customize settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=52428800        # 50MB in bytes
MAX_FILES_PER_UPLOAD=5
UPLOAD_DIR=uploads

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_RATE_LIMIT_MAX=10

# File Cleanup Configuration
FILE_RETENTION_HOURS=24       # Files deleted after 24 hours
CLEANUP_INTERVAL_HOURS=1      # Cleanup runs every hour
```

## 📁 Project Structure

```
PdfViewer/
├── server.js              # Main server application
├── index.html             # Frontend application
├── package.json           # Node.js dependencies
├── start.sh              # Startup script
├── .env.example          # Environment configuration template
├── .gitignore            # Git ignore rules
├── uploads/              # File upload directory
│   └── .gitkeep
└── README.md             # This file
```

## 🌐 API Endpoints

### File Management

- `GET /api/status` - Server status and health check
- `POST /api/upload` - Upload files (multipart/form-data)
- `GET /api/files` - List all uploaded files
- `GET /api/files/:id` - Get file metadata
- `GET /api/files/:id/view` - Stream file for viewing
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Example API Usage

```javascript
// Upload files
const formData = new FormData();
formData.append('files', file);

const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
});

// Get file list
const files = await fetch('/api/files');
const result = await files.json();
```

## 🔒 Security Features

### File Validation
- Only PDF (.pdf) and Word (.doc, .docx) files accepted
- File size limited to 50MB per file
- Maximum 5 files per upload request
- Filename sanitization to prevent path traversal

### Rate Limiting
- 100 requests per 15 minutes per IP
- 10 file uploads per 15 minutes per IP
- Configurable limits via environment variables

### Security Headers
- Content Security Policy (CSP)
- Cross-Origin Embedder Policy
- X-Frame-Options protection
- XSS protection headers

### File Storage
- Unique UUID-based filenames
- Files stored outside web root
- Automatic cleanup of old files
- Secure file serving with proper headers

## 🚀 Deployment

### Production Deployment

1. **Install dependencies**
```bash
npm install --production
```

2. **Set environment variables**
```bash
export NODE_ENV=production
export PORT=3000
```

3. **Start with process manager**
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "pdf-viewer"

# Using systemd (Linux)
# Create a systemd service file
```

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t pdf-viewer .
docker run -p 3000:3000 -v ./uploads:/app/uploads pdf-viewer
```

## 🎮 Usage

### Basic Usage

1. **Start the server** using `./start.sh`
2. **Open browser** to `http://localhost:3000`
3. **Upload files** by dragging and dropping or clicking "Choose Files"
4. **View documents** with full zoom and navigation controls
5. **Access recent files** from the sidebar

### Keyboard Shortcuts

- `Arrow Keys` - Navigate pages (PDF only)
- `+` or `=` - Zoom in
- `-` - Zoom out
- `Space` - Next page
- `Shift + Space` - Previous page

### Features

- **Drag & Drop**: Drag files directly onto the upload area
- **Multi-file Upload**: Select multiple files at once
- **Recent Files**: Quick access to recently uploaded documents
- **Download**: Download original files anytime
- **Responsive**: Works on desktop and mobile devices

## 🧪 Testing

### Manual Testing

1. **Upload different file types**:
   - PDF documents
   - Word documents (.doc, .docx)
   - Try invalid file types (should be rejected)

2. **Test file limits**:
   - Upload files larger than 50MB (should be rejected)
   - Upload more than 5 files at once (should be rejected)

3. **Test viewer features**:
   - Zoom in/out
   - Page navigation
   - Fit width/page modes
   - Download functionality

### API Testing

Use curl or Postman to test API endpoints:

```bash
# Check server status
curl http://localhost:3000/api/status

# Upload a file
curl -X POST -F "files=@document.pdf" http://localhost:3000/api/upload

# List files
curl http://localhost:3000/api/files
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in `.env` file or environment variable
   - Kill process using the port: `lsof -ti:3000 | xargs kill`

2. **Permission denied on uploads directory**
   - Ensure uploads directory is writable: `chmod 755 uploads`

3. **Files not displaying**
   - Check browser console for errors
   - Verify file was uploaded successfully
   - Check server logs for errors

4. **Large files failing to upload**
   - Increase MAX_FILE_SIZE in .env
   - Check available disk space

### Logs and Debugging

- Server logs are printed to console
- Enable detailed logging by setting `LOG_LEVEL=debug` in .env
- Check uploaded files in the `uploads/` directory
- Use browser developer tools to debug frontend issues

## 📈 Performance

### Optimization Tips

1. **File Size**: Keep PDF files under 10MB for best performance
2. **Memory**: Server uses approximately 50MB + uploaded file sizes
3. **Cleanup**: Old files are automatically cleaned up every hour
4. **Caching**: Browser caches static assets automatically

### Scaling

For high-traffic deployments:
- Use a reverse proxy (nginx)
- Implement persistent database for file metadata
- Use cloud storage (AWS S3, Google Cloud Storage)
- Add load balancing for multiple server instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Look at server console logs
3. Check browser developer tools
4. Ensure all dependencies are installed correctly

---

**Built with ❤️ using Node.js, Express, PDF.js, and modern web technologies.**