/**
 * Debug Functionality
 * Handles debug mode for text layer visualization and troubleshooting
 */
console.log('✓ Debug module loaded');

class DebugManager {
    constructor(pdfViewer) {
        this.pdfViewer = pdfViewer;
        this.isDebugMode = false;
        this.tooltip = null;
    }
    
    /**
     * Toggle debug mode on/off
     */
    toggleDebugMode() {
        const textLayers = document.querySelectorAll('.textLayer');
        this.isDebugMode = textLayers.length > 0 && textLayers[0]?.classList.contains('debug-mode');
        
        console.log(`Debug mode toggle: currently ${this.isDebugMode ? 'ON' : 'OFF'}, switching to ${this.isDebugMode ? 'OFF' : 'ON'}`);
        console.log(`Found ${textLayers.length} text layers`);
        
        if (this.isDebugMode) {
            this.hideDebugMode(textLayers);
        } else {
            this.showDebugMode(textLayers);
        }
        
        // Update button text and style
        const debugBtn = this.pdfViewer.debugTextBtn;
        debugBtn.textContent = this.isDebugMode ? '🔍 Debug Text' : '❌ Hide Debug';
        debugBtn.style.background = this.isDebugMode ? 
            'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 
            'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
    }
    
    /**
     * Show debug mode
     */
    showDebugMode(textLayers) {
        // Remove any existing debug info panel
        const existingPanel = document.getElementById('debug-info-panel');
        if (existingPanel) existingPanel.remove();
        
        // Create debug info panel
        this.createDebugInfoPanel();
        
        textLayers.forEach((layer, layerIndex) => {
            layer.classList.add('debug-mode');
            
            // Get all text elements in this layer
            const textElements = layer.querySelectorAll('span, div, > *');
            console.log(`Layer ${layerIndex + 1}: Found ${textElements.length} text elements`);
            
            textElements.forEach((element, elementIndex) => {
                // Apply enhanced debug styles with positioning info
                element.style.color = 'rgba(0, 0, 255, 0.9)';
                element.style.background = 'rgba(255, 255, 0, 0.4)';
                element.style.border = '2px solid #ff0000';
                element.style.outline = '1px solid rgba(0, 0, 255, 0.6)';
                element.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.8), inset 0 0 3px rgba(0, 0, 255, 0.3)';
                element.style.zIndex = '1000';
                element.style.overflow = 'visible';
                element.style.fontWeight = 'bold';
                element.style.whiteSpace = 'nowrap';
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'crosshair';
                
                // Add position data attributes for tooltip
                const rect = element.getBoundingClientRect();
                element.setAttribute('data-debug-page', layerIndex + 1);
                element.setAttribute('data-debug-element', elementIndex + 1);
                element.setAttribute('data-debug-text', element.textContent.substring(0, 30));
                element.setAttribute('data-debug-left', element.style.left || '0px');
                element.setAttribute('data-debug-top', element.style.top || '0px');
                element.setAttribute('data-debug-font-size', element.style.fontSize || 'auto');
                element.setAttribute('data-debug-rect', `${rect.left.toFixed(1)},${rect.top.toFixed(1)},${rect.width.toFixed(1)},${rect.height.toFixed(1)}`);
                
                // Add hover tooltip functionality
                element.addEventListener('mouseenter', (e) => this.showDebugTooltip(e));
                element.addEventListener('mouseleave', () => this.hideDebugTooltip());
                element.addEventListener('click', (e) => this.logElementDebugInfo(e));
                
                // Log detailed info for first few elements
                if (elementIndex < 3 && layerIndex === 0) {
                    console.log(`Debug element P${layerIndex + 1}E${elementIndex + 1}:`, {
                        text: element.textContent?.substring(0, 30) + '...',
                        cssLeft: element.style.left,
                        cssTop: element.style.top,
                        fontSize: element.style.fontSize,
                        transform: element.style.transform,
                        screenRect: rect,
                        zIndex: element.style.zIndex
                    });
                }
                
                // Add visual element number overlay
                this.addElementNumberOverlay(element, layerIndex + 1, elementIndex + 1);
            });
        });
        
        this.isDebugMode = true;
        console.log('Enhanced debug mode enabled with detailed positioning info');
    }
    
    /**
     * Hide debug mode
     */
    hideDebugMode(textLayers) {
        // Remove debug info panel
        const debugPanel = document.getElementById('debug-info-panel');
        if (debugPanel) debugPanel.remove();
        
        // Remove tooltip if visible
        this.hideDebugTooltip();
        
        textLayers.forEach(layer => {
            layer.classList.remove('debug-mode');
            
            const textElements = layer.querySelectorAll('span, div, > *');
            textElements.forEach(element => {
                // Remove debug styles - back to normal (transparent)
                element.style.color = 'transparent';
                element.style.background = '';
                element.style.border = '';
                element.style.outline = '';
                element.style.boxShadow = '';
                element.style.zIndex = '';
                element.style.overflow = '';
                element.style.fontWeight = '';
                element.style.cursor = '';
                
                // Remove debug data attributes
                element.removeAttribute('data-debug-page');
                element.removeAttribute('data-debug-element');
                element.removeAttribute('data-debug-text');
                element.removeAttribute('data-debug-left');
                element.removeAttribute('data-debug-top');
                element.removeAttribute('data-debug-font-size');
                element.removeAttribute('data-debug-rect');
                
                // Remove event listeners by cloning and replacing element
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                
                // Remove element number overlay
                const overlay = newElement.querySelector('.element-number-overlay');
                if (overlay) overlay.remove();
            });
        });
        
        this.isDebugMode = false;
        console.log('Debug mode disabled');
    }
    
    /**
     * Create debug information panel
     */
    createDebugInfoPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-info-panel';
        panel.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; z-index: 10000; max-width: 300px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                <h4 style="margin: 0 0 10px 0; color: #ffff00;">🐛 DEBUG MODE</h4>
                <div><strong>Current Zoom:</strong> ${(this.pdfViewer.scale * 100).toFixed(0)}% (${this.pdfViewer.zoomSelect.value})</div>
                <div><strong>Text Elements:</strong> <span id="debug-element-count">Counting...</span></div>
                <div><strong>Instructions:</strong></div>
                <ul style="margin: 5px 0; padding-left: 15px; font-size: 11px;">
                    <li>Hover over red boxes to see position details</li>
                    <li>Click boxes to log detailed info to console</li>
                    <li>Blue numbers show element IDs (Page.Element)</li>
                    <li>Yellow background = text bounding box</li>
                    <li>Red border = clickable text area</li>
                </ul>
                <div style="margin-top: 10px; font-size: 10px; color: #ccc;">Tooltip: <span id="debug-tooltip-info">Hover over text</span></div>
                <div style="margin-top: 10px;">
                    <button id="debug-export-btn" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; font-size: 10px; cursor: pointer;">Export Debug Data</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Count and display total elements
        setTimeout(() => {
            const totalElements = document.querySelectorAll('.textLayer [data-debug-element]').length;
            const elementCount = document.getElementById('debug-element-count');
            if (elementCount) elementCount.textContent = totalElements;
        }, 100);
        
        // Add export button functionality
        const exportBtn = document.getElementById('debug-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportDebugData());
        }
    }
    
    /**
     * Add element number overlay
     */
    addElementNumberOverlay(element, pageNum, elementNum) {
        const overlay = document.createElement('div');
        overlay.className = 'element-number-overlay';
        overlay.textContent = `${pageNum}.${elementNum}`;
        overlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            background: rgba(0, 0, 255, 0.8);
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 1px 3px;
            border-radius: 2px;
            z-index: 1001;
            pointer-events: none;
            font-family: monospace;
            line-height: 1;
        `;
        element.style.position = 'relative';
        element.appendChild(overlay);
    }
    
    /**
     * Show debug tooltip
     */
    showDebugTooltip(event) {
        const element = event.target;
        const tooltip = this.getOrCreateTooltip();
        
        const page = element.getAttribute('data-debug-page');
        const elementNum = element.getAttribute('data-debug-element');
        const text = element.getAttribute('data-debug-text');
        const left = element.getAttribute('data-debug-left');
        const top = element.getAttribute('data-debug-top');
        const fontSize = element.getAttribute('data-debug-font-size');
        const rect = element.getAttribute('data-debug-rect');
        
        tooltip.innerHTML = `
            <div style="font-weight: bold; color: #ffff00;">Element P${page}E${elementNum}</div>
            <div><strong>Text:</strong> "${text}"</div>
            <div><strong>CSS Position:</strong> ${left}, ${top}</div>
            <div><strong>Font Size:</strong> ${fontSize}</div>
            <div><strong>Screen Rect:</strong> ${rect}</div>
            <div><strong>Transform:</strong> ${element.style.transform || 'none'}</div>
            <div style="font-size: 10px; color: #ccc; margin-top: 5px;">Click to log full details</div>
        `;
        
        // Position tooltip near cursor
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        tooltip.style.left = (mouseX + 10) + 'px';
        tooltip.style.top = (mouseY - 10) + 'px';
        tooltip.style.display = 'block';
        
        // Update panel tooltip info
        const tooltipInfo = document.getElementById('debug-tooltip-info');
        if (tooltipInfo) tooltipInfo.textContent = `P${page}E${elementNum}: "${text.substring(0, 15)}..."`;
    }
    
    /**
     * Hide debug tooltip
     */
    hideDebugTooltip() {
        const tooltip = document.getElementById('debug-tooltip');
        if (tooltip) tooltip.style.display = 'none';
        
        const tooltipInfo = document.getElementById('debug-tooltip-info');
        if (tooltipInfo) tooltipInfo.textContent = 'Hover over text';
    }
    
    /**
     * Get or create tooltip element
     */
    getOrCreateTooltip() {
        let tooltip = document.getElementById('debug-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'debug-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 11px;
                z-index: 10001;
                pointer-events: none;
                max-width: 250px;
                border: 1px solid #444;
                box-shadow: 0 4px 15px rgba(0,0,0,0.7);
                display: none;
            `;
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }
    
    /**
     * Log element debug information
     */
    logElementDebugInfo(event) {
        const element = event.target;
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        console.group('🐛 Element Debug Info - Click Details');
        console.log('Element:', element);
        console.log('Page/Element:', `${element.getAttribute('data-debug-page')}.${element.getAttribute('data-debug-element')}`);
        console.log('Text Content:', element.textContent);
        console.log('CSS Styles:', {
            left: element.style.left,
            top: element.style.top,
            fontSize: element.style.fontSize,
            transform: element.style.transform,
            zIndex: element.style.zIndex,
            position: element.style.position
        });
        console.log('Computed Styles:', {
            left: computedStyle.left,
            top: computedStyle.top,
            fontSize: computedStyle.fontSize,
            transform: computedStyle.transform,
            fontFamily: computedStyle.fontFamily
        });
        console.log('Bounding Rect:', rect);
        console.log('Parent Container:', element.parentElement);
        console.groupEnd();
        
        // Briefly flash the element
        const originalBorder = element.style.border;
        element.style.border = '4px solid lime';
        setTimeout(() => {
            element.style.border = originalBorder;
        }, 500);
    }
    
    /**
     * Export debug data
     */
    exportDebugData() {
        const debugElements = document.querySelectorAll('[data-debug-element]');
        const debugData = {
            exportedAt: new Date().toISOString(),
            pdfInfo: {
                fileName: this.pdfViewer.currentFile?.name || 'Unknown',
                totalPages: this.pdfViewer.pdfDoc?.numPages || 0,
                currentZoom: this.pdfViewer.scale,
                zoomMode: this.pdfViewer.zoomSelect.value
            },
            elements: []
        };
        
        debugElements.forEach(element => {
            debugData.elements.push({
                page: element.getAttribute('data-debug-page'),
                elementId: element.getAttribute('data-debug-element'),
                text: element.textContent,
                position: {
                    left: element.getAttribute('data-debug-left'),
                    top: element.getAttribute('data-debug-top'),
                    fontSize: element.getAttribute('data-debug-font-size'),
                    transform: element.style.transform || 'none'
                },
                boundingRect: element.getAttribute('data-debug-rect'),
                styles: {
                    fontFamily: element.style.fontFamily,
                    color: element.style.color,
                    background: element.style.background
                }
            });
        });
        
        // Download debug data as JSON
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Debug data exported:', debugData);
    }
    
    /**
     * Get debug statistics
     */
    getDebugStats() {
        const debugElements = document.querySelectorAll('[data-debug-element]');
        const pageCount = new Set([...debugElements].map(el => el.getAttribute('data-debug-page'))).size;
        
        return {
            totalElements: debugElements.length,
            totalPages: pageCount,
            isDebugMode: this.isDebugMode,
            averageElementsPerPage: Math.round(debugElements.length / pageCount) || 0
        };
    }
}

// Export for use with PDF viewer
window.DebugManager = DebugManager;