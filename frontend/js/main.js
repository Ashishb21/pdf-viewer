/**
 * Main Application Entry Point
 * Initializes the PDF viewer application and coordinates all modules
 */
console.log('✓ Main module loaded');

// Global application state
window.pdfViewer = null;
window.chatManager = null;
window.searchManager = null;
window.debugManager = null;

/**
 * Initialize the PDF Viewer application
 */
async function initializePDFViewer() {
    try {
        console.log('Initializing PDF Viewer application...');
        
        // Initialize PDF viewer core
        window.pdfViewer = new PDFViewer();
        
        // Initialize debug manager
        window.debugManager = new DebugManager(window.pdfViewer);
        
        // Connect debug manager to PDF viewer
        window.pdfViewer.debugManager = window.debugManager;
        window.pdfViewer.toggleDebugText = () => window.debugManager.toggleDebugMode();
        
        // Initialize chat manager if not already initialized
        if (!window.chatManager) {
            window.chatManager = new ChatManager();
        }
        
        // Initialize search manager
        window.searchManager = new SearchManager(window.pdfViewer);
        
        console.log('PDF Viewer application initialized successfully');
        
        // Update UI to show ready state
        updateApplicationStatus('Ready');
        
    } catch (error) {
        console.error('Failed to initialize PDF Viewer:', error);
        showApplicationError('Failed to initialize PDF Viewer. Please refresh the page.');
    }
}

/**
 * Application initialization on page load
 */
window.addEventListener('load', async () => {
    console.log('Application starting...');
    
    try {
        // Initialize authentication first
        console.log('Checking authentication...');
        const authSuccess = await initializeAuth();
        
        if (authSuccess) {
            console.log('Authentication successful, initializing app components...');
            // Initialize PDF viewer after successful authentication
            await initializePDFViewer();
            console.log('Application fully initialized');
        } else {
            console.log('Authentication failed, should redirect to login');
        }
    } catch (error) {
        console.error('Application initialization failed:', error);
        showApplicationError('Application failed to start. Please refresh the page.');
    }
});

/**
 * Update application status
 */
function updateApplicationStatus(status) {
    const statusElement = document.getElementById('app-status');
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = 'app-status ready';
    }
    console.log(`Application status: ${status}`);
}

/**
 * Show application error
 */
function showApplicationError(message) {
    const statusElement = document.getElementById('app-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'app-status error';
    }
    
    // Also show in console
    console.error(`Application Error: ${message}`);
    
    // Optionally show alert
    if (message.includes('refresh')) {
        setTimeout(() => {
            if (confirm(message + '\n\nWould you like to refresh the page now?')) {
                window.location.reload();
            }
        }, 1000);
    }
}

/**
 * Handle global errors
 */
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    showApplicationError('An unexpected error occurred. Some features may not work properly.');
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showApplicationError('An unexpected error occurred. Some features may not work properly.');
});

/**
 * Application cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    // Clean up any ongoing operations
    if (window.speechSynthesis) {
        speechSynthesis.cancel();
    }
    
    // Clear any timeouts or intervals
    // This would be where you clean up any global timers
    
    console.log('Application shutting down...');
});

/**
 * Keyboard shortcuts for the entire application
 */
document.addEventListener('keydown', (event) => {
    // Global keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
            case 'f':
                // Focus search input
                event.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
                
            case 'n':
                // New chat
                if (event.shiftKey) {
                    event.preventDefault();
                    if (window.chatManager) {
                        window.chatManager.startNewChat();
                    }
                }
                break;
                
            case 'd':
                // Toggle debug mode
                if (event.shiftKey) {
                    event.preventDefault();
                    if (window.debugManager) {
                        window.debugManager.toggleDebugMode();
                    }
                }
                break;
        }
    }
    
    // Escape key - close all overlays
    if (event.key === 'Escape') {
        // Close context menus
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && contextMenu.style.display !== 'none') {
            contextMenu.style.display = 'none';
        }
        
        // Clear selections
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        
        // Close debug tooltip
        if (window.debugManager) {
            window.debugManager.hideDebugTooltip();
        }
    }
});

/**
 * Handle visibility changes (tab switching)
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - pause any ongoing operations
        if (window.speechSynthesis) {
            speechSynthesis.pause();
        }
        console.log('Application paused (tab hidden)');
    } else {
        // Page is visible - resume operations
        if (window.speechSynthesis && window.speechSynthesis.paused) {
            speechSynthesis.resume();
        }
        console.log('Application resumed (tab visible)');
    }
});

/**
 * Monitor connection status
 */
window.addEventListener('online', () => {
    updateApplicationStatus('Online - Ready');
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    updateApplicationStatus('Offline - Limited functionality');
    console.log('Connection lost - working offline');
});

/**
 * Development helpers (only in development mode)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development mode helpers
    window.dev = {
        // Get application state
        getState: () => ({
            pdfViewer: window.pdfViewer,
            chatManager: window.chatManager,
            searchManager: window.searchManager,
            debugManager: window.debugManager,
            authToken: authToken,
            currentUser: currentUser
        }),
        
        // Force debug mode
        enableDebug: () => {
            if (window.debugManager && !window.debugManager.isDebugMode) {
                window.debugManager.toggleDebugMode();
            }
        },
        
        // Clear all data
        clearData: () => {
            localStorage.clear();
            sessionStorage.clear();
            console.log('All local data cleared');
        },
        
        // Test functions
        test: {
            addTestMessage: (message = 'Test message') => {
                if (window.chatManager) {
                    window.chatManager.addUserMessage(message);
                    window.chatManager.addAIResponse('This is a test AI response.');
                }
            },
            
            simulateSearch: (term = 'test') => {
                if (window.searchManager) {
                    window.searchManager.searchInput.value = term;
                    window.searchManager.handleSearch();
                }
            }
        }
    };
    
    console.log('Development mode active. Use window.dev for debugging helpers.');
}

/**
 * Export main functions for testing
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePDFViewer,
        updateApplicationStatus,
        showApplicationError
    };
}

// Service worker registration (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}