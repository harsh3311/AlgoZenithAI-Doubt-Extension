// Add Highlight.js CDN link dynamically
function loadHighlightJS() {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  script.async = true;
  document.head.appendChild(script);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css';
  document.head.appendChild(link);

  // Wait for Highlight.js to load before proceeding
  script.onload = () => {
      console.log('Highlight.js loaded');
  };
}

// Add AI button next to "Ask a doubt" button
function addAIButton() {
  const askDoubtButton = document.querySelector('.coding_ask_doubt_button__FjwXJ');
  if (askDoubtButton && !document.querySelector('.ai-doubt-button')) {
      const aiButton = askDoubtButton.cloneNode(true);
      aiButton.classList.add('ai-doubt-button');
      const buttonText = aiButton.querySelector('span');
      buttonText.textContent = 'AlgoZenithAI';
      
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
      this.minMessageInterval = 1000;
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
      this.lastMessageTime = now;
      const loadingMessage = this.addMessage('Thinking...', 'loading');
      const apiKey = await this.getApiKey();
      if (!apiKey) {
          this.addMessage('Please set your API key in the extension settings.', 'error');
          loadingMessage.remove();
          this.isProcessing = false;
          return;
      }

      this.addMessage(message, type);

      try {
          const prompt = this.preparePrompt(message, type);
          const response = await this.callGeminiAPI(prompt, apiKey);
          this.addMessage(response, 'ai');
          await this.saveHistory();
      } catch (error) {
          console.error('AI Chat Error:', error);
          this.addMessage('Sorry, there was an error processing your request: ' + error.message, 'error');
      } finally {
          this.isProcessing = false;
          loadingMessage.remove();
      }
  }

  preparePrompt(message, type) {
      const { problemTitle, problemDescription, selectedLanguage } = this.problemContext;
      
      if (type === 'user' && !this.isProgrammingRelated(message)) {
          return `I apologize, I am only specialized to answer programming-related questions. I cannot provide assistance with "${message}".

📌 I can help you with:
• Algorithm implementation
• Code debugging and optimization
• Data structure usage
• Programming concepts
• Best practices and design patterns

Please feel free to ask any programming-related questions!`;
      }

      let prompt = '';
      if (type === 'hint') {
          prompt = `As an expert programmer named AlgoZenithAI, provide a hint for solving this problem:

Problem: ${problemTitle}
Description: ${problemDescription}

Give a structured hint that includes:
1. Key insights about the problem
2. Suggested approach without full solution
3. Important edge cases to consider
4. Performance considerations`;
      } else if (type === 'solve') {
          prompt = `As an expert programmer named AlgoZenithAI, provide a solution for this problem:

Problem: ${problemTitle}
Description: ${problemDescription}
Language: ${selectedLanguage}

Provide:
1. A clear explanation of the approach
2. The complete solution in ${selectedLanguage}
3. Time and space complexity analysis
4. Key points about the implementation`;
      } else {
          prompt = `As an expert programmer named AlgoZenithAI, help with this programming question:

Problem: ${problemTitle}
Language: ${selectedLanguage}
Question: ${message}

Provide a clear, professional response with relevant code examples if needed.`;
      }
      
      return prompt;
  }

  async callGeminiAPI(prompt, apiKey) {
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
          throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
          throw new Error(data.error.message || 'API error occurred');
      }

      if (!data.candidates || !data.candidates.length || 
          !data.candidates[0].content || 
          !data.candidates[0].content.parts || 
          !data.candidates[0].content.parts[0].text) {
          throw new Error('Invalid API response format');
      }

      return data.candidates[0].content.parts[0].text.trim();
  }

  addMessage(message, type, timestamp = new Date()) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${type}-message`;
      
      const timeDisplay = document.createElement('div');
      timeDisplay.className = 'message-timestamp';
      timeDisplay.textContent = this.formatTimestamp(timestamp);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      
      if (type === 'ai') {
          let formattedMessage = message;
          formattedMessage = formattedMessage.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
              const language = lang || '';
              return `
                  <div class="code-block">
                      <div class="code-header">
                          <span class="code-language">${language}</span>
                          <button class="copy-button">Copy Code</button>
                      </div>
                      <pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>
                  </div>
              `;
          });
          formattedMessage = formattedMessage.replace(/`([^`]+)`/g, '<code>$1</code>');
          formattedMessage = formattedMessage.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          formattedMessage = formattedMessage.replace(/\*([^*]+)\*/g, '<em>$1</em>');
          formattedMessage = formattedMessage.replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>');
          formattedMessage = formattedMessage.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
          formattedMessage = formattedMessage.replace(/\n/g, '<br>');
          contentDiv.innerHTML = formattedMessage;
          
          // Check if hljs is available before using it
          if (typeof hljs !== 'undefined') {
              contentDiv.querySelectorAll('pre code').forEach(block => {
                  hljs.highlightElement(block);
              });
          }
          
          contentDiv.querySelectorAll('.copy-button').forEach(button => {
              button.addEventListener('click', () => {
                  const codeBlock = button.closest('.code-block');
                  const code = codeBlock.querySelector('code').textContent;
                  navigator.clipboard.writeText(code);
                  button.textContent = 'Copied!';
                  setTimeout(() => button.textContent = 'Copy Code', 2000);
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

  async loadHistory() {
      if (!this.problemContext.problemTitle || this.historyLoaded) return;

      try {
          const result = await new Promise(resolve => {
              chrome.storage.local.get(['chatHistory'], resolve);
          });
          
          const chatHistory = result.chatHistory || [];
          const problemHistory = chatHistory.find(h => h.problemTitle === this.problemContext.problemTitle);
          
          if (problemHistory && problemHistory.messages) {
              const messagesContainer = document.querySelector('.chat-messages');
              if (messagesContainer) messagesContainer.innerHTML = '';
              this.messages = [];
              problemHistory.messages.forEach(msg => {
                  this.addMessage(msg.message, msg.type, new Date(msg.timestamp));
              });
          }
          
          this.historyLoaded = true;
      } catch (error) {
          console.error('Error loading chat history:', error);
      }
  }

  formatTimestamp(date) {
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return isToday ? `Today at ${timeStr}` : `${date.toLocaleDateString()} ${timeStr}`;
  }
}

function openAIChat() {
  const problemTitle = document.querySelector('.problem_heading')?.textContent || 'Unknown Problem';
  const problemDescription = document.querySelector('.coding_desc__pltWY')?.textContent || 'No description available';
  const selectedLanguage = document.querySelector('.ant-select-selection-item')?.textContent || 'Unknown Language';
  
  const chat = new AIChat();
  chat.problemContext = { problemTitle, problemDescription, selectedLanguage };
  
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  
  const popup = document.createElement('div');
  popup.className = 'ai-chat-popup';
  popup.innerHTML = `
      <div class="chat-header">
          <h3>AlgoZenith AI</h3>
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
  
  document.body.appendChild(overlay);
  document.body.appendChild(popup);
  
  const closeButton = popup.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
      chat.saveHistory();
      popup.remove();
      overlay.remove();
  });
  
  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeButton.click();
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
  
  chat.loadHistory().then(() => {
      if (chat.messages.length === 0) {
          chat.addMessage(`Welcome to AlgoZenith AI! 👋

I'm here to help you with this coding problem. You can:
• Click "Get Hint" for guided assistance
• Click "Solve in ${selectedLanguage}" for solution approach
• Ask any specific questions about the problem

How can I help you today?`, 'ai');
      }
  });
}

function injectStyles() {
  const styles = `
      .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
      }

      .ai-chat-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 800px;
          height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 9999;
      }

      .chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e1e4e8;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
      }

      .chat-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1a1a1a;
      }

      .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0 8px;
      }

      .close-button:hover {
          color: #333;
      }

      .chat-options {
          padding: 12px 20px;
          border-bottom: 1px solid #e1e4e8;
          display: flex;
          gap: 12px;
      }

      .option-button {
          padding: 8px 16px;
          border: 1px solid #0066cc;
          border-radius: 6px;
          background: #fff;
          color: #0066cc;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
      }

      .option-button:hover {
          background: #0066cc;
          color: white;
      }

      .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #fff;
      }

      .chat-message {
          margin-bottom: 16px;
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 12px;
          position: relative;
      }

      .user-message {
          background: #e3f2fd;
          margin-left: auto;
          border-bottom-right-radius: 4px;
      }

      .ai-message {
          background: #f5f5f5;
          margin-right: auto;
          border-bottom-left-radius: 4px;
      }

      .error-message {
          background: #ffebee;
          color: #c62828;
          margin: 8px auto;
          text-align: center;
      }

      .loading-message {
          background: #fff3e0;
          color: #e65100;
          margin: 8px auto;
          text-align: center;
      }

      .message-timestamp {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
          text-align: right;
      }

      .chat-input {
          padding: 16px 20px;
          border-top: 1px solid #e1e4e8;
          display: flex;
          gap: 12px;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
      }

      .chat-input textarea {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 8px 12px;
          resize: none;
          font-size: 14px;
          line-height: 1.5;
      }

      .chat-input textarea:focus {
          outline: none;
          border-color: #0066cc;
      }

      .send-button {
          padding: 8px 20px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s ease;
      }

      .send-button:hover {
          background: #0052a3;
      }

      .chat-messages::-webkit-scrollbar {
          width: 8px;
      }

      .chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
      }

      .chat-messages::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #999;
      }

      .code-block {
          background: #f6f8fa;
          border-radius: 6px;
          margin: 12px 0;
          overflow: hidden;
      }
      
      .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f1f3f5;
          border-bottom: 1px solid #e1e4e8;
      }
      
      .code-language {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
      }
      
      .copy-button {
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
      }
      
      .copy-button:hover {
          background: #f1f1f1;
      }
      
      .code-block pre {
          margin: 0;
          padding: 12px;
          overflow-x: auto;
      }
      
      .code-block code {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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
  loadHighlightJS(); // Load Highlight.js
  injectStyles();
  addAIButton();
});

const observer = new MutationObserver(addAIButton);
observer.observe(document.body, { childList: true, subtree: true });