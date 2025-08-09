/**
 * Chat Functionality
 * Handles AI chat interactions, message display, and chat management
 */
console.log('✓ Chat module loaded');

class ChatManager {
    constructor() {
        try {
            this.initializeElements();
            this.attachEventListeners();
            this.initializeEmptyState();
            console.log('Chat Manager initialized');
        } catch (error) {
            console.error('Chat Manager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.emptyChat = document.getElementById('empty-chat');
        this.newChatBtn = document.getElementById('new-chat-btn');
        
        // Check critical elements
        if (!this.chatMessages || !this.chatInput || !this.sendBtn) {
            throw new Error('Critical chat elements not found in DOM');
        }
        
    }
    
    /**
     * Attach event listeners for chat functionality
     */
    attachEventListeners() {
        if (this.chatInput) {
            this.chatInput.addEventListener('input', () => this.handleChatInputChange());
            this.chatInput.addEventListener('keydown', (e) => this.handleChatKeydown(e));
        }
        
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.startNewChat());
        }
        
    }
    
    /**
     * Initialize empty chat state
     */
    initializeEmptyState() {
        if (this.chatMessages && this.chatMessages.children.length === 0) {
            this.showEmptyState();
        }
    }
    
    /**
     * Handle chat input changes
     */
    handleChatInputChange() {
        const hasContent = this.chatInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasContent;
        
        // Auto-resize textarea
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }
    
    /**
     * Handle chat input keydown events
     */
    handleChatKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!this.sendBtn.disabled) {
                this.sendMessage();
            }
        }
    }
    
    /**
     * Send a message to the AI
     */
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Hide empty chat state
        this.hideEmptyState();
        
        // Add user message
        this.addUserMessage(message);
        
        // Clear input and disable send button
        this.chatInput.value = '';
        this.handleChatInputChange();
        this.sendBtn.disabled = true;
        this.sendBtn.innerHTML = '<span>⏳</span>';
        
        try {
            let result;
            
            // Determine the type of request based on message content
            if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('analyze')) {
                // Use analyze endpoint
                const selectedText = window.pdfViewer ? window.pdfViewer.lastSelectedText || message : message;
                result = await callAPI('/pdf/analyze', 'POST', {
                    text: selectedText,
                    question: message
                }, 2); // 2 credits for analysis
            } else if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
                // Use summarize endpoint
                const selectedText = window.pdfViewer ? window.pdfViewer.lastSelectedText || message : message;
                result = await callAPI('/pdf/summarize', 'POST', {
                    text: selectedText,
                    summary_type: 'brief'
                }, 4); // 4 credits for summarization
            } else {
                // Use general Q&A endpoint
                const context = window.pdfViewer ? window.pdfViewer.lastSelectedText || '' : '';
                result = await callAPI('/pdf/ask', 'POST', {
                    question: message,
                    context: context
                }, 3); // 3 credits for Q&A
            }
            
            if (result) {
                // Add appropriate response based on endpoint
                if (result.analysis) {
                    this.addAIResponse(result.analysis);
                } else if (result.summary) {
                    this.addAIResponse(result.summary);
                } else if (result.answer) {
                    this.addAIResponse(result.answer);
                } else {
                    this.addAIResponse("I received your message but couldn't process it properly. Please try again.");
                }
                
                // Update credits display
                await updateCreditStatus();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addAIResponse('Sorry, I encountered an error while processing your request. Please check your connection and try again.');
        } finally {
            // Re-enable send button
            this.sendBtn.disabled = false;
            this.sendBtn.innerHTML = '<span>➤</span>';
        }
    }
    
    /**
     * Add user message to chat
     */
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `<div class="user-message">${escapeHtml(message)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    /**
     * Add AI response to chat
     */
    addAIResponse(response) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `
            <div class="ai-response">${escapeHtml(response)}</div>
            <div class="message-actions">
                <button class="action-btn" onclick="this.copyResponse(this)">📋 Copy</button>
                <button class="action-btn" onclick="this.rateResponse(this, 'good')">👍 Good</button>
                <button class="action-btn" onclick="this.rateResponse(this, 'bad')">👎 Bad</button>
                <button class="action-btn" onclick="this.readResponse(this)">🔊 Read</button>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add event listeners for action buttons
        this.attachMessageActionListeners(messageDiv);
    }
    
    /**
     * Attach event listeners to message action buttons
     */
    attachMessageActionListeners(messageDiv) {
        const copyBtn = messageDiv.querySelector('.action-btn[onclick*="copyResponse"]');
        const goodBtn = messageDiv.querySelector('.action-btn[onclick*="good"]');
        const badBtn = messageDiv.querySelector('.action-btn[onclick*="bad"]');
        const readBtn = messageDiv.querySelector('.action-btn[onclick*="readResponse"]');
        
        if (copyBtn) {
            copyBtn.onclick = () => this.copyResponse(copyBtn);
        }
        if (goodBtn) {
            goodBtn.onclick = () => this.rateResponse(goodBtn, 'good');
        }
        if (badBtn) {
            badBtn.onclick = () => this.rateResponse(badBtn, 'bad');
        }
        if (readBtn) {
            readBtn.onclick = () => this.readResponse(readBtn);
        }
    }
    
    /**
     * Copy AI response to clipboard
     */
    async copyResponse(button) {
        const messageDiv = button.closest('.message');
        const responseText = messageDiv.querySelector('.ai-response').textContent;
        
        try {
            await copyToClipboard(responseText);
            button.textContent = '✅ Copied';
            setTimeout(() => {
                button.textContent = '📋 Copy';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy response:', error);
            button.textContent = '❌ Failed';
            setTimeout(() => {
                button.textContent = '📋 Copy';
            }, 2000);
        }
    }
    
    /**
     * Rate AI response
     */
    rateResponse(button, rating) {
        // Visual feedback
        if (rating === 'good') {
            button.textContent = '✅ Rated';
            button.style.background = 'rgba(46, 204, 113, 0.2)';
        } else {
            button.textContent = '❌ Rated';
            button.style.background = 'rgba(231, 76, 60, 0.2)';
        }
        
        // Disable both rating buttons in this message
        const messageDiv = button.closest('.message');
        const ratingButtons = messageDiv.querySelectorAll('.action-btn[onclick*="rateResponse"]');
        ratingButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        });
        
        // TODO: Send rating to backend
        console.log(`Response rated: ${rating}`);
    }
    
    /**
     * Read AI response aloud
     */
    readResponse(button) {
        const messageDiv = button.closest('.message');
        const responseText = messageDiv.querySelector('.ai-response').textContent;
        
        button.textContent = '🔊 Playing';
        button.disabled = true;
        
        readAloud(responseText);
        
        // Reset button after a delay
        setTimeout(() => {
            button.textContent = '🔊 Read';
            button.disabled = false;
        }, 2000);
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        scrollToBottom(this.chatMessages);
    }
    
    /**
     * Start a new chat session
     */
    startNewChat() {
        // Clear all messages
        this.chatMessages.innerHTML = '';
        
        // Show empty chat state
        this.showEmptyState();
        
        // Clear input
        this.chatInput.value = '';
        this.handleChatInputChange();
        this.chatInput.focus();
        
        console.log('Started new chat');
    }
    
    /**
     * Show empty chat state
     */
    showEmptyState() {
        const emptyChat = document.createElement('div');
        emptyChat.className = 'empty-chat';
        emptyChat.id = 'empty-chat';
        emptyChat.innerHTML = `
            <div class="empty-chat-icon">🤖</div>
            <h4>Ask me anything about the PDF!</h4>
            <p>Select text and ask questions, or type your query below.</p>
        `;
        this.chatMessages.appendChild(emptyChat);
        this.emptyChat = emptyChat;
    }
    
    /**
     * Hide empty chat state
     */
    hideEmptyState() {
        if (this.emptyChat) {
            this.emptyChat.style.display = 'none';
        }
    }
    
    /**
     * Update chat input with selected text
     */
    updateWithSelectedText(selectedText) {
        if (!selectedText || selectedText.length === 0) return;
        
        const truncatedText = selectedText.length > 100 ? 
            selectedText.substring(0, 100) + '...' : selectedText;
        this.chatInput.value = `Explain: "${truncatedText}"`;
        this.handleChatInputChange();
    }
    
    /**
     * Generate mock response for testing
     */
    generateMockResponse(message) {
        if (message.toLowerCase().includes('explain')) {
            return `I understand you'd like me to explain something from the document. This is a mock response - in a real implementation, this would analyze the selected text and provide a detailed explanation based on the PDF content.`;
        } else if (message.toLowerCase().includes('summarize')) {
            return `Here's a mock summary: This would provide a concise summary of the selected content or the entire document, highlighting the key points and main arguments.`;
        } else {
            return `Thank you for your question: "${message}". This is a mock AI response. In a real implementation, I would analyze your query against the PDF content and provide relevant, accurate information.`;
        }
    }
    
    /**
     * Handle file context for chat
     */
    setFileContext(fileName) {
        // Update chat interface to show current file context
        const contextInfo = document.createElement('div');
        contextInfo.className = 'chat-context';
        contextInfo.innerHTML = `
            <div class="context-info">
                <span>📄 Chatting about: ${fileName}</span>
            </div>
        `;
        
        // Insert at the top of chat messages
        if (this.chatMessages.firstChild) {
            this.chatMessages.insertBefore(contextInfo, this.chatMessages.firstChild);
        } else {
            this.chatMessages.appendChild(contextInfo);
        }
    }
    
    /**
     * Clear file context
     */
    clearFileContext() {
        const contextInfo = this.chatMessages.querySelector('.chat-context');
        if (contextInfo) {
            contextInfo.remove();
        }
    }
}

// Initialize chat manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});