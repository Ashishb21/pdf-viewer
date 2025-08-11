/**
 * Utility Functions
 * Common helper functions and API utilities
 */
console.log('✓ Utils module loaded');

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Global variables
let authToken = localStorage.getItem('access_token');
let currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');

// Speech synthesis tracking
let currentSpeechButton = null;
let isSpeaking = false;

/**
 * Generic API call helper function
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Request payload data
 * @param {number} requiresCredits - Number of credits required for this operation
 * @returns {Promise} API response data or null
 */
async function callAPI(endpoint, method = 'GET', data = null, requiresCredits = 0) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (response.status === 401) {
        redirectToLogin();
        return null;
    }
    
    if (response.status === 402) {
        alert('Insufficient credits! Please upgrade your subscription to continue.');
        return null;
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    
    // Update credits after successful API call that uses credits
    if (response.ok && requiresCredits > 0) {
        setTimeout(updateCreditStatus, 500);
    }
    
    return response.json();
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Smooth scroll to bottom of element
 * @param {HTMLElement} element - Element to scroll
 */
function scrollToBottom(element) {
    setTimeout(() => {
        element.scrollTop = element.scrollHeight;
    }, 100);
}

/**
 * Show loading state for an element
 * @param {HTMLElement} element - Element to show loading state
 */
function showLoading(element) {
    if (element) {
        element.style.display = 'block';
    }
}

/**
 * Hide loading state for an element
 * @param {HTMLElement} element - Element to hide loading state
 */
function hideLoading(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Show error message
 * @param {HTMLElement} errorElement - Error display element
 * @param {HTMLElement} loadingElement - Loading element to hide
 * @param {string} message - Error message to display
 */
function showError(errorElement, loadingElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Text-to-speech functionality with play/stop control
 * @param {string} text - Text to read aloud
 * @param {HTMLElement} button - The button that triggered this action
 */
function readAloud(text, button) {
    if (!text) return;
    
    // Check if Web Speech API is supported
    if (!('speechSynthesis' in window)) {
        alert('Text-to-speech is not supported in your browser.');
        return;
    }
    
    // If currently speaking, stop the speech
    if (isSpeaking) {
        stopSpeech();
        return;
    }
    
    console.log('Reading aloud:', text);
    
    // Stop any ongoing speech
    speechSynthesis.cancel();
    
    // Set current button and speaking state
    currentSpeechButton = button;
    isSpeaking = true;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Handle speech events
    utterance.onstart = () => {
        if (currentSpeechButton) {
            currentSpeechButton.textContent = '⏹️ Stop';
            currentSpeechButton.disabled = false;
        }
    };
    
    utterance.onend = () => {
        resetSpeechButton();
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        resetSpeechButton();
    };
    
    speechSynthesis.speak(utterance);
}

/**
 * Stop current speech synthesis
 */
function stopSpeech() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    resetSpeechButton();
}

/**
 * Reset speech button to default state
 */
function resetSpeechButton() {
    if (currentSpeechButton) {
        currentSpeechButton.textContent = '🔊 Read';
        currentSpeechButton.disabled = false;
    }
    currentSpeechButton = null;
    isSpeaking = false;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}

/**
 * Download file from blob
 * @param {File} file - File to download
 */
function downloadFile(file) {
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}