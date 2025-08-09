/**
 * PDF Viewer Core Functionality
 * Handles PDF loading, rendering, navigation, zoom, and text selection
 */
console.log('✓ PDF Viewer module loaded');

class PDFViewer {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.scale = 1.0;
        this.rendering = false;
        this.currentFile = null;
        this.lastSelectedText = null;
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        
        try {
            this.initializeElements();
            this.attachEventListeners();
            this.setupPDFJS();
            console.log('PDF Viewer initialized');
        } catch (error) {
            console.error('PDF Viewer initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Critical elements (must exist)
        this.fileInput = document.getElementById('file-input');
        this.viewer = document.getElementById('viewer');
        
        // Optional elements (may not exist)
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.zoomOutBtn = document.getElementById('zoom-out');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomSelect = document.getElementById('zoom-select');
        this.downloadBtn = document.getElementById('download-btn');
        this.selectAllBtn = document.getElementById('select-all-btn');
        this.askAiBtn = document.getElementById('ask-ai-btn');
        this.debugTextBtn = document.getElementById('debug-text-btn');
        this.pageInput = document.getElementById('page-input');
        this.totalPages = document.getElementById('total-pages');
        this.dropZone = document.getElementById('drop-zone');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');
        this.selectionInfo = document.getElementById('selection-info');
        this.selectionCount = document.getElementById('selection-count');
        this.contextMenu = document.getElementById('context-menu');
        this.searchInput = document.getElementById('search-input');
        this.searchPrev = document.getElementById('search-prev');
        this.searchNext = document.getElementById('search-next');
        this.searchResults = document.getElementById('search-results');
        
        // Validate critical elements
        if (!this.fileInput) {
            console.error('file-input element not found!');
            throw new Error('PDF Viewer: file-input element is required');
        }
        
        if (!this.viewer) {
            console.error('viewer element not found!');
            throw new Error('PDF Viewer: viewer element is required');
        }
        
    }
    
    /**
     * Setup PDF.js worker
     */
    setupPDFJS() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // File input - required
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Navigation buttons
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousPage());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextPage());
        
        // Zoom controls
        if (this.zoomOutBtn) this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        if (this.zoomInBtn) this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (this.zoomSelect) this.zoomSelect.addEventListener('change', (e) => this.handleZoomChange(e));
        
        // Action buttons
        if (this.downloadBtn) this.downloadBtn.addEventListener('click', () => downloadFile(this.currentFile));
        if (this.selectAllBtn) this.selectAllBtn.addEventListener('click', () => this.selectAllText());
        if (this.askAiBtn) this.askAiBtn.addEventListener('click', () => this.askAI());
        if (this.debugTextBtn) this.debugTextBtn.addEventListener('click', () => this.toggleDebugText());
        if (this.pageInput) this.pageInput.addEventListener('change', (e) => this.goToPage(parseInt(e.target.value)));
        
        // Drag and drop events
        if (this.dropZone) {
            this.dropZone.addEventListener('click', () => this.fileInput?.click());
            this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        // Prevent default drag behaviors on the document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
        
        // Text selection events
        document.addEventListener('selectionchange', () => this.handleSelectionChange());
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Context menu events
        if (this.contextMenu) {
            this.contextMenu.addEventListener('click', (e) => this.handleContextMenuClick(e));
        }
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.handleSearch());
            this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        }
        if (this.searchPrev) this.searchPrev.addEventListener('click', () => this.goToPreviousMatch());
        if (this.searchNext) this.searchNext.addEventListener('click', () => this.goToNextMatch());
        
    }
    
    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }
    
    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }
    
    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    /**
     * Handle file selection
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    /**
     * Process selected PDF file
     */
    async processFile(file) {
        if (!file || file.type !== 'application/pdf') {
            showError(this.error, this.loading, 'Please select a valid PDF file.');
            return;
        }
        
        try {
            this.currentFile = file;
            this.updateFileInfo(file);
            showLoading(this.loading);
            this.hideDropZone();
            
            const arrayBuffer = await file.arrayBuffer();
            await this.loadPDF(arrayBuffer);
        } catch (error) {
            console.error('Error loading PDF:', error);
            showError(this.error, this.loading, 'Failed to load PDF file.');
        }
    }
    
    /**
     * Update file information display
     */
    updateFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileInfo.style.display = 'block';
        this.downloadBtn.disabled = false;
        this.selectAllBtn.disabled = false;
        this.askAiBtn.disabled = false;
        this.debugTextBtn.disabled = false;
    }
    
    /**
     * Hide drop zone
     */
    hideDropZone() {
        this.dropZone.style.display = 'none';
    }
    
    /**
     * Show drop zone
     */
    showDropZone() {
        this.dropZone.style.display = 'block';
    }
    
    /**
     * Load PDF document
     */
    async loadPDF(data) {
        try {
            this.pdfDoc = await pdfjsLib.getDocument(data).promise;
            this.totalPages.textContent = this.pdfDoc.numPages;
            this.currentPage = 1;
            this.pageInput.value = 1;
            this.pageInput.max = this.pdfDoc.numPages;
            
            this.updateNavigationButtons();
            await this.renderAllPages();
            hideLoading(this.loading);
        } catch (error) {
            console.error('Error loading PDF:', error);
            showError(this.error, this.loading, 'Failed to load PDF document.');
        }
    }
    
    /**
     * Render all pages of the PDF
     */
    async renderAllPages() {
        if (!this.pdfDoc) return;
        
        this.viewer.innerHTML = '';
        
        for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'page-container';
            pageContainer.id = `page-${pageNum}`;
            
            const canvas = document.createElement('canvas');
            canvas.className = 'page-canvas';
            pageContainer.appendChild(canvas);
            
            // Create text layer for text selection
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'textLayer';
            textLayerDiv.id = `text-layer-${pageNum}`;
            pageContainer.appendChild(textLayerDiv);
            
            this.viewer.appendChild(pageContainer);
            
            await this.renderPage(pageNum, canvas, textLayerDiv);
        }
    }
    
    /**
     * Render a single page
     */
    async renderPage(pageNum, canvas, textLayerDiv = null) {
        if (this.rendering) return;
        
        try {
            this.rendering = true;
            const page = await this.pdfDoc.getPage(pageNum);
            
            let viewport = page.getViewport({ scale: this.scale });
            
            // Handle fit-width and fit-page
            if (this.zoomSelect.value === 'fit-width') {
                const containerWidth = this.viewer.clientWidth - 40; // Account for margins
                const scale = containerWidth / viewport.width;
                viewport = page.getViewport({ scale });
            } else if (this.zoomSelect.value === 'fit-page') {
                const containerWidth = this.viewer.clientWidth - 40;
                const containerHeight = this.viewer.clientHeight - 40;
                const scaleX = containerWidth / viewport.width;
                const scaleY = containerHeight / viewport.height;
                const scale = Math.min(scaleX, scaleY);
                viewport = page.getViewport({ scale });
            }
            
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Render text layer for selection
            if (textLayerDiv) {
                await this.renderTextLayer(page, textLayerDiv, viewport, pageNum);
            }
        } catch (error) {
            console.error(`Error rendering page ${pageNum}:`, error);
        } finally {
            this.rendering = false;
        }
    }
    
    /**
     * Render text layer for text selection
     */
    async renderTextLayer(page, textLayerDiv, viewport, pageNum) {
        try {
            const textContent = await page.getTextContent();
            console.log(`Creating text layer for page ${pageNum} with ${textContent.items.length} text items`);
            
            // Try to use PDF.js built-in TextLayer if available, otherwise use our custom implementation
            if (window.pdfjsLib.TextLayer && typeof window.pdfjsLib.TextLayer.render === 'function') {
                textLayerDiv.innerHTML = '';
                textLayerDiv.className = 'textLayer';
                textLayerDiv.style.position = 'absolute';
                textLayerDiv.style.left = '0px';
                textLayerDiv.style.top = '0px';
                textLayerDiv.style.width = viewport.width + 'px';
                textLayerDiv.style.height = viewport.height + 'px';
                textLayerDiv.style.pointerEvents = 'auto';
                textLayerDiv.style.zIndex = '2';
                
                const textLayerTask = window.pdfjsLib.TextLayer.render({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    enhanceTextSelection: true
                });
                
                await textLayerTask.promise;
                console.log(`PDF.js TextLayer rendered for page ${pageNum}`);
            } else {
                // Fallback to our custom implementation
                textLayerDiv.className = 'textLayer';
                this.createTextLayer(textContent, textLayerDiv, viewport);
                console.log(`Custom TextLayer rendered for page ${pageNum}`);
            }
        } catch (textError) {
            console.warn(`Text layer creation failed for page ${pageNum}:`, textError);
            // Last resort: try our custom implementation
            try {
                const textContent = await page.getTextContent();
                textLayerDiv.className = 'textLayer';
                this.createTextLayer(textContent, textLayerDiv, viewport);
            } catch (fallbackError) {
                console.error(`All text layer creation methods failed for page ${pageNum}:`, fallbackError);
            }
        }
    }
    
    /**
     * Re-render all pages (used for zoom changes)
     */
    async rerenderAllPages() {
        if (!this.pdfDoc) return;
        
        for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
            const canvas = document.querySelector(`#page-${pageNum} canvas`);
            const textLayerDiv = document.querySelector(`#text-layer-${pageNum}`);
            if (canvas) {
                await this.renderPage(pageNum, canvas, textLayerDiv);
            }
        }
    }
    
    /**
     * Create custom text layer for text selection
     */
    createTextLayer(textContent, container, viewport) {
        if (!textContent || !textContent.items) return;
        
        // Clear existing text layer
        container.innerHTML = '';
        
        // Set container styles for text selection
        container.style.position = 'absolute';
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.width = viewport.width + 'px';
        container.style.height = viewport.height + 'px';
        container.style.overflow = 'hidden';
        container.style.pointerEvents = 'auto';
        container.style.userSelect = 'text';
        container.style.webkitUserSelect = 'text';
        container.style.mozUserSelect = 'text';
        container.style.msUserSelect = 'text';
        container.style.zIndex = '2';
        
        // Create text spans using improved coordinate system for different zoom levels
        const textItems = textContent.items;
        let textElementCount = 0;
        
        for (let i = 0; i < textItems.length; i++) {
            const textItem = textItems[i];
            if (!textItem.str || textItem.str.trim() === '') continue;
            
            try {
                const span = document.createElement('span');
                span.textContent = textItem.str;
                span.dir = textItem.dir || 'ltr';
                
                // Use PDF.js Util.transform for accurate positioning
                const transform = pdfjsLib.Util.transform(viewport.transform, textItem.transform);
                
                // Calculate position and font size
                let left = transform[4];
                let top = transform[5];
                const fontHeight = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
                const angle = Math.atan2(transform[1], transform[0]);
                
                // Apply styles
                const style = span.style;
                style.position = 'absolute';
                style.left = left + 'px';
                style.top = top + 'px';
                style.fontSize = fontHeight + 'px';
                style.fontFamily = textItem.fontName || 'sans-serif';
                style.color = 'transparent';
                style.background = 'transparent';
                style.cursor = 'text';
                style.whiteSpace = 'pre';
                style.transformOrigin = '0% 0%';
                style.pointerEvents = 'auto';
                style.userSelect = 'text';
                style.webkitUserSelect = 'text';
                style.mozUserSelect = 'text';
                style.msUserSelect = 'text';
                
                // Apply rotation if text is rotated
                if (Math.abs(angle) > 0.01) {
                    style.transform = `rotate(${angle}rad)`;
                }
                
                // Add width and height for better selection
                if (textItem.width && textItem.height) {
                    const scaledWidth = Math.abs(transform[0] * textItem.width + transform[2] * textItem.height);
                    const scaledHeight = Math.abs(transform[1] * textItem.width + transform[3] * textItem.height);
                    style.width = scaledWidth + 'px';
                    style.height = scaledHeight + 'px';
                }
                
                container.appendChild(span);
                textElementCount++;
            } catch (error) {
                console.warn('Error creating text element:', error, textItem);
            }
        }
        
        console.log(`Text layer created with ${textElementCount} selectable text elements`);
    }
    
    /**
     * Select all text in the document
     */
    selectAllText() {
        const textLayers = document.querySelectorAll('.text-layer, .textLayer');
        if (textLayers.length === 0) {
            console.log('No text layers found for selection');
            return;
        }
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        // Create a range that spans all text layers
        const range = document.createRange();
        const firstTextLayer = textLayers[0];
        const lastTextLayer = textLayers[textLayers.length - 1];
        
        if (firstTextLayer.firstChild && lastTextLayer.lastChild) {
            try {
                range.setStartBefore(firstTextLayer.firstChild);
                range.setEndAfter(lastTextLayer.lastChild);
                selection.addRange(range);
                console.log(`Selected all text across ${textLayers.length} pages`);
            } catch (error) {
                console.warn('Error selecting all text:', error);
            }
        }
    }
    
    /**
     * Get currently selected text
     */
    getSelectedText() {
        const selection = window.getSelection();
        return selection.toString().trim();
    }
    
    /**
     * Handle text selection change
     */
    handleSelectionChange() {
        setTimeout(() => {
            const selectedText = this.getSelectedText();
            
            if (selectedText.length > 0) {
                this.lastSelectedText = selectedText;
                this.selectionCount.textContent = selectedText.length;
                this.selectionInfo.style.display = 'block';
            } else {
                this.selectionCount.textContent = '0';
                this.selectionInfo.style.display = 'none';
                this.hideContextMenu();
            }
        }, 50);
    }
    
    /**
     * Handle mouse up event for context menu
     */
    handleMouseUp(event) {
        if (event.button !== 0) return;
        
        const sidePanel = document.querySelector('.side-panel');
        if (sidePanel && sidePanel.contains(event.target)) {
            return;
        }
        
        setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = this.getSelectedText();
            
            if (selectedText.length > 0 && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
                this.showContextMenu(event.clientX, event.clientY);
            } else {
                this.hideContextMenu();
            }
        }, 50);
    }
    
    /**
     * Show context menu
     */
    showContextMenu(x, y) {
        this.contextMenu.style.display = 'block';
        
        const rect = this.contextMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let menuX = x;
        let menuY = y + 10;
        
        if (menuX + rect.width > windowWidth) {
            menuX = windowWidth - rect.width - 10;
        }
        
        if (menuY + rect.height > windowHeight) {
            menuY = y - rect.height - 10;
        }
        
        this.contextMenu.style.left = menuX + 'px';
        this.contextMenu.style.top = menuY + 'px';
    }
    
    /**
     * Hide context menu
     */
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }
    
    /**
     * Handle context menu clicks
     */
    handleContextMenuClick(event) {
        const item = event.target.closest('.context-menu-item');
        if (!item) return;
        
        const action = item.dataset.action;
        const selectedText = this.getSelectedText();
        
        this.hideContextMenu();
        
        switch (action) {
            case 'explain':
                this.explainText(selectedText);
                break;
            case 'chat':
                this.chatWithText(selectedText);
                break;
            case 'quiz':
                this.createQuiz(selectedText);
                break;
            case 'flashcards':
                this.createFlashcards(selectedText);
                break;
            case 'read-aloud':
                readAloud(selectedText);
                break;
        }
    }
    
    /**
     * Handle document clicks
     */
    handleDocumentClick(event) {
        if (!this.contextMenu.contains(event.target)) {
            this.hideContextMenu();
        }
        
        const sidePanel = document.querySelector('.side-panel');
        if (sidePanel && sidePanel.contains(event.target)) {
            return;
        }
    }
    
    /**
     * Navigation and zoom methods
     */
    previousPage() {
        if (this.currentPage <= 1) return;
        this.currentPage--;
        this.pageInput.value = this.currentPage;
        this.updateNavigationButtons();
        this.scrollToPage(this.currentPage);
    }
    
    nextPage() {
        if (!this.pdfDoc || this.currentPage >= this.pdfDoc.numPages) return;
        this.currentPage++;
        this.pageInput.value = this.currentPage;
        this.updateNavigationButtons();
        this.scrollToPage(this.currentPage);
    }
    
    goToPage(pageNum) {
        if (!this.pdfDoc || pageNum < 1 || pageNum > this.pdfDoc.numPages) return;
        this.currentPage = pageNum;
        this.updateNavigationButtons();
        this.scrollToPage(this.currentPage);
    }
    
    scrollToPage(pageNum) {
        const pageElement = document.getElementById(`page-${pageNum}`);
        if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    zoomIn() {
        const currentIndex = Array.from(this.zoomSelect.options).findIndex(option => option.selected);
        if (currentIndex < this.zoomSelect.options.length - 3) {
            this.zoomSelect.selectedIndex = currentIndex + 1;
            this.handleZoomChange({ target: this.zoomSelect });
        }
    }
    
    zoomOut() {
        const currentIndex = Array.from(this.zoomSelect.options).findIndex(option => option.selected);
        if (currentIndex > 0) {
            this.zoomSelect.selectedIndex = currentIndex - 1;
            this.handleZoomChange({ target: this.zoomSelect });
        }
    }
    
    async handleZoomChange(event) {
        const value = event.target.value;
        if (value === 'fit-width' || value === 'fit-page') {
            this.scale = 1.0;
        } else {
            this.scale = parseFloat(value);
        }
        await this.rerenderAllPages();
    }
    
    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentPage <= 1;
        this.nextBtn.disabled = !this.pdfDoc || this.currentPage >= this.pdfDoc.numPages;
    }
    
    /**
     * Keyboard shortcuts
     */
    handleKeydown(event) {
        if (event.ctrlKey && event.key === 'a' && this.pdfDoc) {
            event.preventDefault();
            this.selectAllText();
            return;
        }
        
        if (!this.pdfDoc) return;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                this.previousPage();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                this.nextPage();
                break;
            case '+':
            case '=':
                event.preventDefault();
                this.zoomIn();
                break;
            case '-':
                event.preventDefault();
                this.zoomOut();
                break;
        }
    }
    
    /**
     * Placeholder methods for context menu actions
     */
    explainText(text) {
        if (!text) return;
        const explanation = prompt('Explain this text:\n\n"' + text.substring(0, 100) + (text.length > 100 ? '...' : '') + '"\n\nWhat would you like me to explain about this text?');
        if (explanation) {
            alert('Explanation request - AI integration coming soon!');
        }
    }
    
    chatWithText(text) {
        if (!text) return;
        const question = prompt('Chat about this text:\n\n"' + text.substring(0, 100) + (text.length > 100 ? '...' : '') + '"\n\nWhat would you like to discuss?');
        if (question) {
            alert('Chat request - AI integration coming soon!');
        }
    }
    
    createQuiz(text) {
        if (!text) return;
        alert('Quiz creation - Feature coming soon!');
    }
    
    createFlashcards(text) {
        if (!text) return;
        alert('Flashcard creation - Feature coming soon!');
    }
    
    /**
     * Ask AI about selected text
     */
    async askAI() {
        const selectedText = this.getSelectedText();
        
        if (!selectedText) {
            alert('Please select some text first before asking AI.');
            return;
        }
        
        const question = prompt('What would you like to ask about the selected text?');
        if (!question) return;
        
        try {
            this.askAiBtn.disabled = true;
            this.askAiBtn.textContent = '🤖 Processing...';
            
            const result = await callAPI('/pdf/ask', 'POST', {
                question: question,
                context: selectedText
            }, 3);
            
            if (result && window.chatManager) {
                window.chatManager.addAIResponse(result.answer);
                await updateCreditStatus();
            }
        } catch (error) {
            console.error('Error calling AI:', error);
            alert('Error communicating with AI service: ' + error.message);
        } finally {
            this.askAiBtn.disabled = false;
            this.askAiBtn.textContent = '🤖 Ask AI';
        }
    }
}