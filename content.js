// Add AI button next to "Ask a doubt" button
function addAIButton() {
  const askDoubtButton = document.querySelector('.coding_ask_doubt_button__FjwXJ');
  if (askDoubtButton && !document.querySelector('.ai-doubt-button')) {
    const aiButton = askDoubtButton.cloneNode(true);
    aiButton.classList.add('ai-doubt-button');
    const buttonText = aiButton.querySelector('span');
    buttonText.textContent = 'AI Doubt';
    
    // Update icon
    const svg = aiButton.querySelector('svg');
    svg.innerHTML = `<path d="M20 11.2c0-.1-.1-.2-.2-.2h-1.3c-.1-1.2-.5-2.3-1.1-3.3l.9-.9c.1-.1.1-.2 0-.3l-1.4-1.4c-.1-.1-.2-.1-.3 0l-.9.9c-1-.6-2.1-1-3.3-1.1V3.2c0-.1-.1-.2-.2-.2h-2c-.1 0-.2.1-.2.2v1.3c-1.2.1-2.3.5-3.3 1.1l-.9-.9c-.1-.1-.2-.1-.3 0L4.2 6.1c-.1.1-.1.2 0 .3l.9.9c-.6 1-1 2.1-1.1 3.3H2.7c-.1 0-.2.1-.2.2v2c0 .1.1.2.2.2h1.3c.1 1.2.5 2.3 1.1 3.3l-.9.9c-.1.1-.1.2 0 .3l1.4 1.4c.1.1.2.1.3 0l.9-.9c1 .6 2.1 1 3.3 1.1v1.3c0 .1.1.2.2.2h2c.1 0 .2-.1.2-.2v-1.3c1.2-.1 2.3-.5 3.3-1.1l.9.9c.1.1.2.1.3 0l1.4-1.4c.1-.1.1-.2 0-.3l-.9-.9c.6-1 1-2.1 1.1-3.3h1.3c.1 0 .2-.1.2-.2v-2zm-8 5.8c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
    <path d="M12 8.5c-.8 0-1.5.3-2.1.8l1.3 1.3c.2-.1.5-.2.8-.2 1.1 0 2 .9 2 2 0 .3-.1.6-.2.8l1.3 1.3c.5-.6.8-1.3.8-2.1 0-1.9-1.6-3.5-3.5-3.5z"/>
    <path d="M12 13.5c-.3 0-.6-.1-.8-.2l-1.3 1.3c.6.5 1.3.8 2.1.8 1.9 0 3.5-1.6 3.5-3.5 0-.8-.3-1.5-.8-2.1l-1.3 1.3c.1.2.2.5.2.8 0 1.1-.9 2-2 2z"/>`;
    
    aiButton.addEventListener('click', openAIChat);
    askDoubtButton.parentNode.insertBefore(aiButton, askDoubtButton.nextSibling);
  }
}

// Chat handling functions
class AIChat {
  constructor() {
    this.messages = [];
    this.problemContext = {};
    this.lastMessageTime = 0;
    this.minMessageInterval = 1000; // 1 second between messages
    this.isProcessing = false;
    this.historyLoaded = false;
  }

  async sendMessage(message, type = 'user') {
    if (this.isProcessing) {
      this.addMessage('Please wait while processing the previous request...', 'error');
      return;
    }

    const now = Date.now();
    if (now - this.lastMessageTime < this.minMessageInterval) {
      this.addMessage('Please wait a moment before sending another message.', 'error');
      return;
    }

    this.isProcessing = true;
    const loadingMessage = this.addMessage('Thinking...', 'loading');
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      this.addMessage('Please set your API key in the extension settings.', 'error');
      return;
    }

    // Add user message to chat
    this.addMessage(message, type);

    try {
      // Prepare context and prompt
      const prompt = this.preparePrompt(message, type);
      
      // Call Gemini API
      const response = await this.callGeminiAPI(prompt, apiKey);
      
      // Add AI response to chat
      this.addMessage(response, 'ai');
      
      // Save chat history immediately after adding each message
      await this.saveHistory();
    } catch (error) {
      console.error('AI Chat Error:', error);
      this.addMessage('Sorry, there was an error processing your request.', 'error');
    } finally {
      this.isProcessing = false;
      loadingMessage.remove();
    }
  }

  preparePrompt(message, type) {
    const { problemTitle, problemDescription, selectedLanguage } = this.problemContext;
    
    // Add programming-focused validation
    if (type === 'user' && !this.isProgrammingRelated(message)) {
      return `I am designed to help specifically with programming questions and coding problems. I cannot provide assistance with ${message}. 

Please ask me questions about:
- The current coding problem
- Programming concepts
- Code debugging
- Algorithm assistance
- Data structures
- Programming best practices`;
    }

    let prompt = '';
    if (type === 'hint') {
      prompt = `Give me a clear hint for solving this coding problem, without giving away the complete solution.

Problem: ${problemTitle}
Description: ${problemDescription}

Format your response with:
1. What approach to take
2. Which data structures to use
3. Key steps to consider`;
    } else if (type === 'solve') {
      prompt = `Give me a complete, working solution for this problem that I can directly copy and paste.

Problem: ${problemTitle}
Description: ${problemDescription}
Language: ${selectedLanguage}

Provide ONLY:
1. The complete code solution without explanations in between
2. After the code, briefly explain the time and space complexity

Format the response exactly like this:
\`\`\`${selectedLanguage}
// Your code here
\`\`\`

Time Complexity: O(?)
Space Complexity: O(?)`;
    } else {
      prompt = `Help me with this specific programming question. 

Problem: ${problemTitle}
Description: ${problemDescription}
Language: ${selectedLanguage}
Question: ${message}

Provide a direct, practical answer with code examples if relevant.`;
    }
    
    return prompt;
  }

  async callGeminiAPI(prompt, apiKey) {
    // Update API endpoint to include API key as URL parameter
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  addMessage(message, type, timestamp = new Date()) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    
    // Add timestamp display
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'message-timestamp';
    timeDisplay.textContent = this.formatTimestamp(timestamp);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Handle code blocks for AI responses
    if (type === 'ai') {
      const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let formattedMessage = message;
      let match;
      
      while ((match = codeRegex.exec(message)) !== null) {
        const language = match[1] || '';
        const code = match[2].trim();
        const codeBlock = `
          <div class="code-block">
            <div class="code-header">
              <span class="code-language">${language}</span>
              <button class="copy-button">Copy Code</button>
            </div>
            <pre><code class="${language}">${this.escapeHtml(code)}</code></pre>
          </div>
        `;
        formattedMessage = formattedMessage.replace(match[0], codeBlock);
      }
      contentDiv.innerHTML = formattedMessage;
      
      // Add copy functionality to all copy buttons
      contentDiv.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
          const codeBlock = button.closest('.code-block');
          const code = codeBlock.querySelector('code').textContent;
          navigator.clipboard.writeText(code);
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = 'Copy Code';
          }, 2000);
        });
      });
    } else {
      contentDiv.textContent = message;
    }
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDisplay);
    
    const messagesContainer = document.querySelector('.chat-messages');
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    this.messages.push({ message, type, timestamp: timestamp.toISOString() });
    
    return messageDiv;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async saveHistory() {
    const history = {
      problemTitle: this.problemContext.problemTitle,
      messages: this.messages
    };
    
    return new Promise((resolve) => {
      chrome.storage.local.get(['chatHistory'], (result) => {
        let chatHistory = result.chatHistory || [];
        // Remove existing history for this problem if it exists
        chatHistory = chatHistory.filter(h => h.problemTitle !== history.problemTitle);
        chatHistory.push(history);
        chrome.storage.local.set({ chatHistory }, resolve);
      });
    });
  }

  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['geminiApiKey'], (result) => {
        resolve(result.geminiApiKey);
      });
    });
  }

  // Add new helper method
  isProgrammingRelated(message) {
    const programmingKeywords = [
      'code', 'program', 'function', 'algorithm', 'debug', 'error',
      'variable', 'array', 'object', 'class', 'method', 'loop',
      'syntax', 'compile', 'runtime', 'api', 'database', 'framework',
      'library', 'bug', 'exception', 'interface', 'implementation',
      'optimization', 'complexity', 'data structure'
    ];

    message = message.toLowerCase();
    return programmingKeywords.some(keyword => message.includes(keyword)) ||
           message.includes('how to') || message.includes('why does') ||
           message.includes('what is') || message.includes('explain');
  }

  // Update loadHistory method
  async loadHistory() {
    if (!this.problemContext.problemTitle || this.historyLoaded) {
      return;
    }

    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['chatHistory'], resolve);
      });
      
      const chatHistory = result.chatHistory || [];
      const problemHistory = chatHistory.find(h => h.problemTitle === this.problemContext.problemTitle);
      
      if (problemHistory && problemHistory.messages) {
        // Clear existing messages first
        const messagesContainer = document.querySelector('.chat-messages');
        if (messagesContainer) {
          messagesContainer.innerHTML = '';
        }

        // Reset messages array
        this.messages = [];

        // Restore previous messages
        problemHistory.messages.forEach(msg => {
          this.addMessage(msg.message, msg.type, new Date(msg.timestamp));
        });
      }
      
      this.historyLoaded = true;
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  // Add helper method to format timestamps
  formatTimestamp(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    
    return `${date.toLocaleDateString()} ${timeStr}`;
  }
}

// Update openAIChat function
function openAIChat() {
  const problemTitle = document.querySelector('.problem_heading').textContent;
  const problemDescription = document.querySelector('.coding_desc__pltWY').textContent;
  const selectedLanguage = document.querySelector('.ant-select-selection-item').textContent;
  
  const chat = new AIChat();
  chat.problemContext = { problemTitle, problemDescription, selectedLanguage };
  
  // Create overlay first
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'ai-chat-popup';
  popup.innerHTML = `
    <div class="chat-header">
      <h3>AI Doubt Solver</h3>
      <button class="close-button">×</button>
    </div>
    <div class="chat-options">
      <button class="option-button hint-button">Get Hint</button>
      <button class="option-button solve-button">Solve in ${selectedLanguage}</button>
    </div>
    <div class="chat-messages"></div>
    <div class="chat-input">
      <textarea placeholder="Ask your doubt..." rows="3"></textarea>
      <button class="send-button">Send</button>
    </div>
  `;
  
  // Add both overlay and popup to body
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  // Update close button handler to remove both elements
  const closeButton = popup.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    chat.saveHistory();
    popup.remove();
    overlay.remove();
  });
  
  // Update escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeButton.click();
    }
  });
  
  const hintButton = popup.querySelector('.hint-button');
  hintButton.addEventListener('click', () => chat.sendMessage('', 'hint'));
  
  const solveButton = popup.querySelector('.solve-button');
  solveButton.addEventListener('click', () => chat.sendMessage('', 'solve'));
  
  const sendButton = popup.querySelector('.send-button');
  const textarea = popup.querySelector('textarea');
  
  sendButton.addEventListener('click', () => {
    const message = textarea.value.trim();
    if (message) {
      chat.sendMessage(message);
      textarea.value = '';
    }
  });
  
  textarea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });
  
  // Load history after setting problem context and creating UI
  chat.loadHistory().then(() => {
    // Only show welcome message if there's no history
    if (chat.messages.length === 0) {
      chat.addMessage(`**Welcome to AI Doubt Solver! 👋**

I'm here to help you with this coding problem. You can:
• Click "Get Hint" for guided assistance
• Click "Solve in ${selectedLanguage}" for solution approach
• Ask any specific questions about the problem

How can I help you today?`, 'ai');
    }
  });
}

// Add styles for code blocks
function injectStyles() {
  const styles = `
    .code-block {
      background: #f6f8fa;
      border-radius: 6px;
      margin: 10px 0;
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #e1e4e8;
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
    }

    .code-language {
      color: #24292e;
      font-size: 12px;
      font-weight: 600;
    }

    .copy-button {
      background: #fff;
      border: 1px solid #d1d5da;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }

    .copy-button:hover {
      background: #f3f4f6;
    }

    .code-block pre {
      margin: 0;
      padding: 12px;
      overflow-x: auto;
    }

    .code-block code {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.4;
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  addAIButton();
});

// Also handle dynamic page changes
const observer = new MutationObserver(addAIButton);
observer.observe(document.body, { childList: true, subtree: true });
