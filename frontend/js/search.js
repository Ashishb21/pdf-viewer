/**
 * Search Functionality
 * Handles text search within PDF documents
 */
console.log('✓ Search module loaded');

class SearchManager {
    constructor(pdfViewer) {
        this.pdfViewer = pdfViewer;
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        this.initializeElements();
        this.attachEventListeners();
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchPrev = document.getElementById('search-prev');
        this.searchNext = document.getElementById('search-next');
        this.searchResults = document.getElementById('search-results');
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.searchInput.addEventListener('input', debounce(() => this.handleSearch(), 300));
        this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        this.searchPrev.addEventListener('click', () => this.goToPreviousMatch());
        this.searchNext.addEventListener('click', () => this.goToNextMatch());
    }
    
    /**
     * Handle search input
     */
    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        
        if (searchTerm.length === 0) {
            this.clearSearchHighlights();
            this.searchMatches = [];
            this.currentSearchIndex = -1;
            this.updateSearchResults();
            return;
        }
        
        if (searchTerm.length < 2) return; // Wait for at least 2 characters
        
        this.performSearch(searchTerm);
    }
    
    /**
     * Handle search input keydown events
     */
    handleSearchKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (event.shiftKey) {
                this.goToPreviousMatch();
            } else {
                this.goToNextMatch();
            }
        } else if (event.key === 'Escape') {
            this.clearSearch();
        }
    }
    
    /**
     * Perform search across all text layers
     */
    performSearch(searchTerm) {
        this.clearSearchHighlights();
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        
        if (!this.pdfViewer.pdfDoc || !searchTerm) return;
        
        const textLayers = document.querySelectorAll('.textLayer');
        const searchTermLower = searchTerm.toLowerCase();
        
        textLayers.forEach((textLayer, pageIndex) => {
            const textSpans = textLayer.querySelectorAll('span');
            
            textSpans.forEach((span, spanIndex) => {
                const text = span.textContent.toLowerCase();
                const originalText = span.textContent;
                
                if (text.includes(searchTermLower)) {
                    // Find all occurrences in this span
                    let startIndex = 0;
                    let index;
                    
                    while ((index = text.indexOf(searchTermLower, startIndex)) !== -1) {
                        // Create highlight wrapper
                        const beforeText = originalText.substring(0, index);
                        const matchText = originalText.substring(index, index + searchTerm.length);
                        const afterText = originalText.substring(index + searchTerm.length);
                        
                        // Create new span structure with highlight
                        const newContent = document.createElement('div');
                        newContent.style.display = 'inline';
                        
                        if (beforeText) {
                            newContent.appendChild(document.createTextNode(beforeText));
                        }
                        
                        const highlightSpan = document.createElement('span');
                        highlightSpan.className = 'search-highlight';
                        highlightSpan.textContent = matchText;
                        highlightSpan.dataset.searchMatch = this.searchMatches.length;
                        newContent.appendChild(highlightSpan);
                        
                        if (afterText) {
                            newContent.appendChild(document.createTextNode(afterText));
                        }
                        
                        // Store match info
                        this.searchMatches.push({
                            element: highlightSpan,
                            pageIndex: pageIndex + 1,
                            spanIndex: spanIndex,
                            text: matchText
                        });
                        
                        // Replace span content
                        span.innerHTML = newContent.innerHTML;
                        
                        startIndex = index + 1;
                        break; // Handle one match per span for simplicity
                    }
                }
            });
        });
        
        if (this.searchMatches.length > 0) {
            this.currentSearchIndex = 0;
            this.highlightCurrentMatch();
        }
        
        this.updateSearchResults();
    }
    
    /**
     * Clear all search highlights
     */
    clearSearchHighlights() {
        const highlights = document.querySelectorAll('.search-highlight, .search-current');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize(); // Merge adjacent text nodes
        });
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.searchInput.value = '';
        this.clearSearchHighlights();
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        this.updateSearchResults();
    }
    
    /**
     * Go to next search match
     */
    goToNextMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchMatches.length;
        this.highlightCurrentMatch();
        this.scrollToCurrentMatch();
    }
    
    /**
     * Go to previous search match
     */
    goToPreviousMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentSearchIndex = this.currentSearchIndex <= 0 
            ? this.searchMatches.length - 1 
            : this.currentSearchIndex - 1;
        this.highlightCurrentMatch();
        this.scrollToCurrentMatch();
    }
    
    /**
     * Highlight current search match
     */
    highlightCurrentMatch() {
        // Remove current highlighting from all matches
        const currentHighlights = document.querySelectorAll('.search-current');
        currentHighlights.forEach(el => {
            el.classList.remove('search-current');
            el.classList.add('search-highlight');
        });
        
        if (this.currentSearchIndex >= 0 && this.currentSearchIndex < this.searchMatches.length) {
            const element = document.querySelector(`[data-search-match="${this.currentSearchIndex}"]`);
            
            if (element) {
                element.classList.remove('search-highlight');
                element.classList.add('search-current');
            }
        }
        
        this.updateSearchResults();
    }
    
    /**
     * Scroll to current search match
     */
    scrollToCurrentMatch() {
        if (this.currentSearchIndex >= 0 && this.currentSearchIndex < this.searchMatches.length) {
            const currentMatch = this.searchMatches[this.currentSearchIndex];
            const element = document.querySelector(`[data-search-match="${this.currentSearchIndex}"]`);
            
            if (element) {
                // Scroll to the page first
                this.pdfViewer.goToPage(currentMatch.pageIndex);
                
                // Then scroll to the specific element
                setTimeout(() => {
                    element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'center'
                    });
                }, 300);
            }
        }
    }
    
    /**
     * Update search results display
     */
    updateSearchResults() {
        if (this.searchMatches.length === 0) {
            this.searchResults.textContent = '';
            this.searchPrev.disabled = true;
            this.searchNext.disabled = true;
        } else {
            this.searchResults.textContent = `${this.currentSearchIndex + 1} of ${this.searchMatches.length}`;
            this.searchPrev.disabled = false;
            this.searchNext.disabled = false;
        }
    }
    
    /**
     * Get search statistics
     */
    getSearchStats() {
        return {
            totalMatches: this.searchMatches.length,
            currentMatch: this.currentSearchIndex + 1,
            searchTerm: this.searchInput.value.trim(),
            pagesWithMatches: [...new Set(this.searchMatches.map(match => match.pageIndex))]
        };
    }
    
    /**
     * Export search results
     */
    exportSearchResults() {
        if (this.searchMatches.length === 0) {
            alert('No search results to export.');
            return;
        }
        
        const searchTerm = this.searchInput.value.trim();
        const results = this.searchMatches.map((match, index) => ({
            index: index + 1,
            page: match.pageIndex,
            text: match.text,
            context: this.getMatchContext(match)
        }));
        
        const exportData = {
            searchTerm: searchTerm,
            totalMatches: this.searchMatches.length,
            results: results,
            exportedAt: new Date().toISOString()
        };
        
        // Download as JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${searchTerm}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Get context around a search match
     */
    getMatchContext(match, contextLength = 50) {
        try {
            const span = match.element.closest('span');
            if (!span) return match.text;
            
            const parentText = span.textContent;
            const matchStart = parentText.toLowerCase().indexOf(match.text.toLowerCase());
            
            if (matchStart === -1) return match.text;
            
            const start = Math.max(0, matchStart - contextLength);
            const end = Math.min(parentText.length, matchStart + match.text.length + contextLength);
            
            let context = parentText.substring(start, end);
            
            if (start > 0) context = '...' + context;
            if (end < parentText.length) context = context + '...';
            
            return context;
        } catch (error) {
            console.warn('Error getting match context:', error);
            return match.text;
        }
    }
}

// Add search functionality to PDF viewer
document.addEventListener('DOMContentLoaded', () => {
    // Wait for PDF viewer to be initialized
    const initSearch = () => {
        if (window.pdfViewer) {
            window.searchManager = new SearchManager(window.pdfViewer);
        } else {
            setTimeout(initSearch, 100);
        }
    };
    initSearch();
});