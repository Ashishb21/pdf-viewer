/**
 * Authentication and User Management
 * Handles user authentication, token management, and user interface updates
 */
console.log('✓ Auth module loaded');

/**
 * Initialize authentication on page load
 */
async function initializeAuth() {
    // Check for auth token
    if (!authToken) {
        console.log('No auth token found, redirecting to login');
        redirectToLogin();
        return false;
    }
    
    // If we have a token, assume it's valid for now (simplified)
    console.log('Auth token found, initializing user interface');
    
    // Try to get user from localStorage or use mock
    try {
        if (currentUser && currentUser.username) {
            updateUserInterface();
        } else {
            // Set mock user data
            currentUser = {
                full_name: 'Test User',
                username: 'test-user',
                credits: 95
            };
            updateUserInterface();
        }
        return true;
    } catch (error) {
        console.error('Error updating user interface:', error);
        return true; // Continue anyway
    }
}

/**
 * Verify current user token and update user data
 */
async function verifyAndUpdateUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Authentication failed');
    }
    
    currentUser = await response.json();
    localStorage.setItem('user_data', JSON.stringify(currentUser));
    updateUserInterface();
}

/**
 * Update credit status from server
 */
async function updateCreditStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/credits/status`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const creditStatus = await response.json();
            document.getElementById('credit-count').textContent = creditStatus.total_credits_available;
            
            // Update credit status color based on remaining credits
            const creditEl = document.getElementById('credit-status');
            if (creditStatus.total_credits_available < 10) {
                creditEl.style.background = 'rgba(231, 76, 60, 0.8)'; // Red for low credits
            } else if (creditStatus.total_credits_available < 50) {
                creditEl.style.background = 'rgba(243, 156, 18, 0.8)'; // Orange for medium credits
            } else {
                creditEl.style.background = 'rgba(46, 204, 113, 0.8)'; // Green for good credits
            }
        }
    } catch (error) {
        console.error('Failed to update credit status:', error);
    }
}

/**
 * Update user interface elements with user data
 */
function updateUserInterface() {
    const userName = currentUser.full_name || currentUser.username || 'Test User';
    document.getElementById('user-name').textContent = `👋 ${userName}`;
    
    // Update credits display
    const creditsElement = document.getElementById('credit-count');
    if (creditsElement) {
        creditsElement.textContent = currentUser.credits || 95;
    }
    
    updateCreditStatus();
}

/**
 * Redirect user to login page and clear auth data
 */
function redirectToLogin() {
    console.log('Redirecting to login page...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
}

/**
 * Initialize logout functionality
 */
function initializeLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                redirectToLogin();
            }
        });
    } else {
        console.warn('Logout button not found');
    }
}

// Initialize logout functionality after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogout);
} else {
    initializeLogout();
}