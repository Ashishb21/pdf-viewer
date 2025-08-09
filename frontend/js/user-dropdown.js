/**
 * User Dropdown Menu Functionality
 * Handles user profile dropdown, settings, and menu interactions
 */
console.log('✓ User Dropdown module loaded');

class UserDropdown {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.isDarkMode = this.loadDarkModePreference();
        this.initializeDarkMode();
        console.log('User Dropdown initialized');
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.dropdown = document.getElementById('user-dropdown');
        this.trigger = document.getElementById('user-profile-trigger');
        this.menu = document.getElementById('dropdown-menu');
        this.collapse = document.getElementById('dropdown-collapse');
        this.items = document.getElementById('dropdown-items');
        this.userNameDisplay = document.getElementById('user-name-dropdown');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        
        // Check critical elements
        if (!this.dropdown || !this.trigger) {
            console.warn('User dropdown elements not found');
        }
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.trigger) return;
        
        // Toggle dropdown on trigger click
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        
        // Handle "Show more" collapse/expand
        if (this.collapse) {
            this.collapse.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleExpanded();
            });
        }
        
        // Handle menu item clicks
        if (this.items) {
            this.items.addEventListener('click', (e) => {
                const item = e.target.closest('.dropdown-item');
                if (item) {
                    const action = item.getAttribute('data-action');
                    this.handleMenuAction(action);
                }
            });
        }
        
        // Handle dark mode toggle
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', () => {
                this.toggleDarkMode();
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdown?.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }
    
    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (!this.dropdown) return;
        
        if (this.dropdown.classList.contains('open')) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    /**
     * Open dropdown
     */
    openDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.add('open');
        
        // Auto-expand items initially
        setTimeout(() => {
            if (this.items) {
                this.items.classList.add('expanded');
            }
        }, 100);
    }
    
    /**
     * Close dropdown
     */
    closeDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.remove('open');
        if (this.items) {
            this.items.classList.remove('expanded');
        }
    }
    
    /**
     * Toggle expanded/collapsed state
     */
    toggleExpanded() {
        if (!this.items || !this.collapse) return;
        
        const isExpanded = this.items.classList.contains('expanded');
        
        if (isExpanded) {
            this.items.classList.remove('expanded');
            this.collapse.textContent = '▶ Show more';
        } else {
            this.items.classList.add('expanded');
            this.collapse.textContent = '▼ Show more';
        }
    }
    
    /**
     * Handle menu item actions
     */
    handleMenuAction(action) {
        console.log(`Menu action: ${action}`);
        
        switch (action) {
            case 'settings':
                this.openSettings();
                break;
            case 'pricing':
                this.openPricing();
                break;
            case 'history':
                this.openHistory();
                break;
            case 'dark-mode':
                // Toggle is handled by the checkbox change event
                break;
            case 'logout':
                this.handleLogout();
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
        
        // Close dropdown after action (except for dark mode toggle)
        if (action !== 'dark-mode') {
            setTimeout(() => this.closeDropdown(), 150);
        }
    }
    
    /**
     * Open settings modal/page
     */
    openSettings() {
        // Placeholder for settings functionality
        alert('Settings functionality would open here');
    }
    
    /**
     * Open pricing modal/page
     */
    openPricing() {
        // Placeholder for pricing functionality
        alert('Pricing information would open here');
    }
    
    /**
     * Open history modal/page
     */
    openHistory() {
        // Placeholder for history functionality
        alert('History functionality would open here');
    }
    
    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Call the existing logout function from auth.js
            if (typeof redirectToLogin === 'function') {
                redirectToLogin();
            } else {
                // Fallback logout
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_data');
                window.location.href = '/';
            }
        }
    }
    
    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.applyDarkMode();
        this.saveDarkModePreference();
    }
    
    /**
     * Initialize dark mode based on saved preference
     */
    initializeDarkMode() {
        if (this.darkModeToggle) {
            this.darkModeToggle.checked = this.isDarkMode;
        }
        this.applyDarkMode();
    }
    
    /**
     * Apply dark mode styles
     */
    applyDarkMode() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    /**
     * Load dark mode preference from localStorage
     */
    loadDarkModePreference() {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    }
    
    /**
     * Save dark mode preference to localStorage
     */
    saveDarkModePreference() {
        localStorage.setItem('darkMode', this.isDarkMode.toString());
    }
    
    /**
     * Update user name in dropdown
     */
    updateUserName(name) {
        if (this.userNameDisplay) {
            this.userNameDisplay.textContent = name;
        }
    }
    
    /**
     * Update user avatar
     */
    updateUserAvatar(avatarUrl) {
        const avatarImg = document.getElementById('user-avatar-img');
        if (avatarImg && avatarUrl) {
            avatarImg.src = avatarUrl;
        }
    }
}

// Initialize user dropdown when DOM is ready
let userDropdownManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        userDropdownManager = new UserDropdown();
    });
} else {
    userDropdownManager = new UserDropdown();
}

// Export for use in other modules
window.userDropdownManager = userDropdownManager;