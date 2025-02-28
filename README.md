# AlgoZenithAI Doubt Extension

A Chrome Extension designed to assist programmers by integrating an AI-powered coding assistant directly into coding platforms like MAANG.in. Powered by the Gemini API, this extension provides hints, solutions, and answers to programming-related questions, enhancing the problem-solving experience.

## Features
- **AI-Powered Assistance**: Leverage the Gemini API to get hints, full solutions, or answers to specific coding questions.
- **Context-Aware Responses**: Automatically fetches problem titles, descriptions, and selected programming languages from the page for tailored assistance.
- **Interactive Chat Interface**: A sleek popup with options to request hints, solutions, or ask custom questions.
- **Code Highlighting**: Integrates Highlight.js for syntax highlighting of code snippets in responses.
- **Persistent Chat History**: Saves your conversation history per problem using Chrome's local storage.
- **Customizable API Key**: Securely manage your Gemini API key through an intuitive popup interface.
- **Responsive Design**: A modern, user-friendly UI with smooth animations and scrollable chat.

## Author
Harsh Bhardwaj  
- [GitHub Profile](https://github.com/harsh3311)  
- [Project Repository](https://github.com/harsh3311/AlgoZenithAI-Doubt-Extension)

## Requirements

### Knowledge
- HTML
- CSS
- JavaScript
- Chrome Extension API
- Basic understanding of APIs (e.g., Gemini API)

### Tools
- Google Chrome Browser
- Any IDE or Text Editor (e.g., VS Code)
- A valid Gemini API key ( obtainable from Google's API Console)

## Setup Instructions

### For Developers
1. **Clone the Repository**:  
   ```bash
   git clone https://github.com/harsh3311/AlgoZenithAI-Doubt-Extension.git
   ```
   Alternatively, download and unzip the project from the repository.

2. **Open Chrome**: Launch Google Chrome.

3. **Access Extensions**: Navigate to `chrome://extensions/` in a new tab.

4. **Enable Developer Mode**: Toggle "Developer Mode" on in the top-right corner.

5. **Load the Extension**:  
   - Click "Load Unpacked."  
   - Select the unzipped project folder and click "OK."

6. **Start Development**: The extension is now loaded! Reload it after each code change (`Ctrl+R` or click the refresh icon on the extensions page) to see updates.

7. **Set API Key**:  
   - Click the extension icon in the Chrome toolbar.  
   - Enter your Gemini API key in the popup and save it.

### For End Users
1. **Install the Extension**: (Note: If not yet published to the Chrome Web Store, follow the developer steps above.)
2. **Configure API Key**:  
   - Click the AlgoZenithAI icon in the Chrome toolbar.  
   - Enter your Gemini API key and press "Enter" to save.
3. **Use on MAANG.in**:  
   - Visit a problem page on `*.maang.in`.  
   - Click the "AlgoZenithAI" button next to the "Ask a Doubt" button to open the chat interface.  
   - Ask questions, request hints, or get solutions!

## Usage
- **On a Problem Page**: The extension detects the problem title, description, and language automatically via DOM parsing.
- **Chat Options**:  
  - **Get Hint**: Receive structured guidance without revealing the full solution.  
  - **Solve in [Language]**: Get a complete solution with explanation and complexity analysis.  
  - **Custom Questions**: Type your doubt in the textarea and hit "Send" or press "Enter."
- **Code Copying**: Click "Copy Code" on any code block to copy it to your clipboard.

## Technical Details
- **Manifest Version**: 3
- **Permissions**: `storage`, `activeTab`, `scripting`, `tabs`
- **Host Permissions**: `*://*.maang.in/*`
- **Dependencies**:  
  - Highlight.js (loaded via CDN for syntax highlighting)  
  - Gemini API (v1beta) for AI responses

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.
