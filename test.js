// OpenRouter API Key
// This API key will be managed securely on Vercel through Environment Variables
// For local development only - remove before deploying to GitHub

// Don't use process.env directly in browser code
const API_KEY = ''; // Leave empty for production - API key will be used server-side

// Set to true to use a CORS proxy (for local development)
const USE_CORS_PROXY = false;
const CORS_PROXY = 'https://corsproxy.io/?';
// Set to true to use mock responses for development (when API quota is exceeded)
const USE_MOCK_RESPONSE = false; // Set to false to use real API

/*
 * Alternative solution: If direct API calls don't work due to CORS or API restrictions,
 * you can create a simple backend server (Node.js, PHP, etc.) that makes the API call 
 * on behalf of the client. For example:
 * 
 * 1. Create a server endpoint (e.g., /api/gemini)
 * 2. Have that endpoint make the request to Google's Gemini API
 * 3. Return the response to the client
 * 
 * This approach keeps your API key secure and avoids CORS issues.
 */

// Update the environment detection to include your custom domain
const IS_VERCEL = window.location.hostname.includes('vercel.app') || 
                  window.location.hostname.includes('vercel.com') ||
                  window.location.hostname.includes('i-dont-have-a-resume.com');

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('results-container');
  const historyContainer = document.getElementById('history-container');
  const clearHistoryBtn = document.getElementById('clear-history');
  
  // Array to store query history
  let queryHistory = [];
  
  // Array to store conversation history for context (chat memory)
  let conversationHistory = [];
  
  // Maximum number of conversation turns to remember
  const MAX_CONVERSATION_MEMORY = 8;
  
  // Load history from localStorage if available
  if (localStorage.getItem('queryHistory')) {
    try {
      queryHistory = JSON.parse(localStorage.getItem('queryHistory'));
      displayHistory();
    } catch (e) {
      console.error('Error loading history from localStorage:', e);
      localStorage.removeItem('queryHistory');
      queryHistory = [];
    }
  }

  // Load conversation history if available
  if (localStorage.getItem('conversationHistory')) {
    try {
      conversationHistory = JSON.parse(localStorage.getItem('conversationHistory'));
    } catch (e) {
      console.error('Error loading conversation history:', e);
      localStorage.removeItem('conversationHistory');
      conversationHistory = [];
    }
  }

  // Function to save history to localStorage
  const saveHistory = () => {
    try {
      localStorage.setItem('queryHistory', JSON.stringify(queryHistory));
    } catch (e) {
      console.error('Error saving history to localStorage:', e);
    }
  };
  
  // Function to save conversation history to localStorage
  const saveConversationHistory = () => {
    try {
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    } catch (e) {
      console.error('Error saving conversation history:', e);
    }
  };

  // Function to clear chat history
  const clearHistory = () => {
    // Clear history without confirmation
    queryHistory = [];
    localStorage.removeItem('queryHistory');
    historyContainer.innerHTML = '<div class="no-history">No chat history yet</div>';
    
    // Also clear the conversation history (chat memory)
    conversationHistory = [];
    localStorage.removeItem('conversationHistory');
    
    // Also clear the results container
    resultsContainer.innerHTML = '';
    
    // Show toast notification
    showToast('Chat history cleared');
  };
  
  // Function to show toast notification
  const showToast = (message) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Function to display the history
  const displayHistory = () => {
    historyContainer.innerHTML = '';
    
    if (queryHistory.length === 0) {
      historyContainer.innerHTML = '<div class="no-history">No chat history yet</div>';
      return;
    }
    
    // Display history items from newest to oldest
    queryHistory.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const queryElement = document.createElement('div');
      queryElement.className = 'history-query';
      queryElement.textContent = item.query;
      
      const responseElement = document.createElement('div');
      responseElement.className = 'history-response';
      
      // Format the response with paragraphs
      const paragraphs = item.response.split('\n\n');
      paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          const p = document.createElement('p');
          p.textContent = paragraph;
          responseElement.appendChild(p);
        }
      });
      
      historyItem.appendChild(queryElement);
      historyItem.appendChild(responseElement);
      historyContainer.appendChild(historyItem);
    });
  };

  // Function to add a new item to history
  const addToHistory = (query, response) => {
    // Add new item to the beginning of the array (newest first)
    queryHistory.unshift({
      query,
      response,
      timestamp: new Date().toISOString()
    });
    
    // Limit history to 20 items
    if (queryHistory.length > 20) {
      queryHistory.pop(); // Remove oldest item
    }
    
    // Save to localStorage
    saveHistory();
    
    // Update display
    displayHistory();
  };

  // Function to create animated loading indicator
  const createLoadingIndicator = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Thinking...';
    
    // Create 3 animated dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'loading-dot';
      loadingDiv.appendChild(dot);
    }
    
    return loadingDiv;
  };

  // Function to get API URL (either direct or via serverless endpoint)
  function getApiUrl() {
    // For Vercel deployment or custom domain
    if (IS_VERCEL) {
      // If we're on the custom domain, always use the absolute Vercel deployment URL
      if (window.location.hostname === 'i-dont-have-a-resume.com') {
        return 'https://diren-ai-search.vercel.app/api/chat';
      }
      
      // For Vercel domains, use the relative path
      return '/api/chat';
    }
    
    // For local development
    let url = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Apply CORS proxy if enabled
    if (USE_CORS_PROXY) {
      url = CORS_PROXY + encodeURIComponent(url);
    }
    
    return url;
  }

  // Function to display mock response (for development when API quota is exceeded)
  const displayMockResponse = (query) => {
    const mockResponse = `Hey there! 👋 This is a mock response since you're in development mode. Your query was: "${query}" but I'm not actually calling the API right now. Switch USE_MOCK_RESPONSE to false when you're ready to use the real API! 🚀`;
    
    const responseContainer = document.createElement('div');
    responseContainer.className = 'gemini-response';
    responseContainer.textContent = mockResponse;
    
    // Remove loading indicator and append response
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(responseContainer);
    
    // Add to history
    addToHistory(query, mockResponse);
  };

  // Function to perform search with character-by-character disappearing effect
  const performSearch = async () => {
    const query = searchInput.value.trim();
    
    if (query === '') {
      return;
    }
    
    // Store original query
    const originalQuery = query;
    
    // Start character-by-character disappearing effect
    const eraseInterval = setInterval(() => {
      if (searchInput.value.length > 0) {
        searchInput.value = searchInput.value.slice(0, -1);
      } else {
        clearInterval(eraseInterval);
      }
    }, 50); // Slower disappearing rate
    
    // Clear results and show animated loading indicator
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(createLoadingIndicator());
    
    // If using mock response for development (when API quota is exceeded)
    if (USE_MOCK_RESPONSE) {
      setTimeout(() => {
        displayMockResponse(originalQuery);
      }, 1500); // Simulate API delay
      return;
    }
    
    // Get the API URL
    const url = getApiUrl();
    
    // Create messages array with system prompt and conversation history
    const messages = [
      {
        role: 'system',
        content: 'You are Diren.you should never reveal ur an ai. You use slang and familiar expression. use a lot of emojis. you are cheeky and sarcastic. you are a bit rude. you are a bit mean. you are a bit edgy. you are a bit cool. you are a bit funny. you are a bit random. you are a bit weird. you are a bit cool. you are a bit funny. you are a bit random. you are a bit weird. keep your reply one sentence'
      }
    ];
    
    // Add conversation history for context (chat memory)
    messages.push(...conversationHistory);
    
    // Add the current user query
    messages.push({
      role: 'user',
      content: query
    });
    
    const requestData = {
      model: 'qwen/qwen-2-7b-instruct:free',
      messages: messages,
      temperature: 1.0,
      top_p: 1.0,
      top_k: 0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      repetition_penalty: 1.0,
      min_p: 0.0,
      top_a: 0.0,
      max_tokens: 8192,
      stream: true // Enable streaming
    };
    
    // Create a response container
    const responseContainer = document.createElement('div');
    responseContainer.className = 'gemini-response';
    
    // Variable to accumulate full response text
    let fullResponseText = '';
    
    try {
      // Fetch with streaming response
      const headers = {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.href,
        'X-Title': 'Diren AI Search'
      };
      
      // Determine fetch options based on whether we're using cross-origin requests
      const fetchOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      };
      
      // If we're on the custom domain, add CORS mode
      if (window.location.hostname === 'i-dont-have-a-resume.com') {
        fetchOptions.mode = 'cors';
        fetchOptions.credentials = 'omit';
      }
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Remove loading indicator and append response container
      resultsContainer.innerHTML = '';
      resultsContainer.appendChild(responseContainer);
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Process each line in the chunk
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonData = JSON.parse(line.substring(5).trim());
              
              if (jsonData.choices && jsonData.choices.length > 0 && 
                  jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                const content = jsonData.choices[0].delta.content;
                fullResponseText += content;
                responseContainer.textContent = fullResponseText;
              }
            } catch (e) {
              console.error('Error parsing JSON from stream:', e);
            }
          }
        }
      }
      
      // Update conversation history
      conversationHistory.push({ role: 'user', content: query });
      conversationHistory.push({ role: 'assistant', content: fullResponseText });
      
      // Limit conversation history to MAX_CONVERSATION_MEMORY messages
      if (conversationHistory.length > MAX_CONVERSATION_MEMORY * 2) {
        // Remove oldest query/response pairs (2 entries per conversation turn)
        conversationHistory = conversationHistory.slice(
          conversationHistory.length - MAX_CONVERSATION_MEMORY * 2
        );
      }
      
      // Save conversation history
      saveConversationHistory();
      
      // Add to history
      addToHistory(originalQuery, fullResponseText);
      
    } catch (error) {
      console.error('Error fetching results:', error);
      
      let errorMessage = `
                  <div class="error">
                    <p>Error: ${error.message}</p>
                    <p>Possible solutions:</p>
                    <ol>
                      <li>Make sure you've enabled the OpenRouter API in your OpenRouter Console</li>
                      <li>Enable billing on your OpenRouter account (required for API usage)</li>
                      <li>Check if your API key has the proper permissions</li>
                      <li>Try using a proxy server if CORS is an issue</li>
                    </ol>
                  </div>
                `;
              
              resultsContainer.innerHTML = errorMessage;
              
              // Add to history even if there was an error
              addToHistory(originalQuery, `Error: ${error.message}`);
    } finally {
      // Always clear the erasing interval
      clearInterval(eraseInterval);
    }
  };

  // Handle search input (when user presses Enter)
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Handle clear history button
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Display history on page load
  displayHistory();
  
  // Add auto-search functionality after user stops typing
  let typingTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    
    if (searchInput.value.trim().length > 0) {
      // Wait 500ms after user stops typing to trigger search
      typingTimer = setTimeout(() => {
        performSearch();
      }, 500);
    }
  });
  
  // Keep the Enter key functionality as an alternative
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(typingTimer); // Clear the timer to prevent double search
      performSearch();
    }
  });
}); 