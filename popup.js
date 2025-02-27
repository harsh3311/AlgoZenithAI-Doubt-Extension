document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const editButton = document.getElementById('editButton');
  const statusDiv = document.getElementById('status');

  // Load saved API key
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = '.......................................';
    } else {
      // Show initial message for first-time users
      statusDiv.textContent = 'Press Edit Icon to enter API key';
      statusDiv.className = 'status';
    }
  });

  // Toggle edit mode
  editButton.addEventListener('click', () => {
    if (apiKeyInput.disabled) {
      // Enable editing
      apiKeyInput.disabled = false;
      apiKeyInput.value = '';
      apiKeyInput.focus();
      editButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      `;
      // Show message when in edit mode
      statusDiv.textContent = 'Press Enter to Save the API key';
      statusDiv.className = 'status';
    } else {
      // Save API key
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        validateAndSaveApiKey(apiKey);
      }
    }
  });

  // Add event listener for Enter key
  apiKeyInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !apiKeyInput.disabled) {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        validateAndSaveApiKey(apiKey);
      }
    }
  });

  async function validateAndSaveApiKey(apiKey) {
    try {
      statusDiv.textContent = 'Validating API key...';
      statusDiv.className = 'status';
      
      // Add loading state to button
      editButton.disabled = true;
      
      // Basic format validation
      if (!apiKey.match(/^AIza[0-9A-Za-z-_]{35}$/)) {
        throw new Error('Invalid API key format');
      }

      // Test the API with a simple content generation request
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Hello" }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API validation failed');
      }

      // If we get here, the API key is valid
      await chrome.storage.local.set({ geminiApiKey: apiKey });
      
      apiKeyInput.disabled = true;
      apiKeyInput.value = '.......................................';
      editButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      statusDiv.textContent = 'API key saved successfully!';
      statusDiv.className = 'status success';
    } catch (error) {
      console.error('API Key validation error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Invalid API key. Please try again.';
      if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'API key does not have permission to access Gemini.';
      }
      
      statusDiv.textContent = errorMessage;
      statusDiv.className = 'status error';
      
      // Reset input for retry
      apiKeyInput.disabled = false;
      apiKeyInput.value = '';
      apiKeyInput.focus();
    } finally {
      editButton.disabled = false;
    }
  }
}); 