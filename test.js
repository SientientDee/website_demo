﻿// OpenRouter API Key
const API_KEY = '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';
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

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchIcon = document.querySelector('.search-icon');
  const resultsContainer = document.getElementById('results-container');
  const historyContainer = document.getElementById('history-container');
  const clearHistoryBtn = document.getElementById('clear-history');
  
  // Array to store query history
  let queryHistory = [];
  
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

  // Function to save history to localStorage
  const saveHistory = () => {
    try {
      localStorage.setItem('queryHistory', JSON.stringify(queryHistory));
    } catch (e) {
      console.error('Error saving history to localStorage:', e);
    }
  };

  // Function to clear chat history
  const clearHistory = () => {
    // Clear history without confirmation
    queryHistory = [];
    localStorage.removeItem('queryHistory');
    historyContainer.innerHTML = '<div class="no-history">No chat history yet</div>';
    
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
    loadingDiv.textContent = 'Searching';
    
    // Create 3 animated dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'loading-dot';
      loadingDiv.appendChild(dot);
    }
    
    return loadingDiv;
  };

  // Function to perform search with character-by-character disappearing effect
  const performSearch = () => {
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
    
    // Build the request for OpenRouter API (Qwen 32B)
    let url = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Apply CORS proxy if enabled
    if (USE_CORS_PROXY) {
      url = CORS_PROXY + encodeURIComponent(url);
    }
    
    const requestData = {
      model: 'qwen/qwq-32b:free',
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 1,
      top_k: 40,
      top_p: 0.95,
      max_tokens: 8192
    };
    
    // Fetch results from OpenRouter API
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.href
      },
      body: JSON.stringify(requestData)
    })
      .then(response => {
        console.log('API Response status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error('API Error response:', text);
            // Check if error is due to quota exhaustion
            if (text.includes("RESOURCE_EXHAUSTED") || text.includes("quota")) {
              throw new Error("API quota exceeded. Please try again later or upgrade your plan.");
            } else {
              throw new Error(`API Error (${response.status}): ${text}`);
            }
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('API Response data:', data);
        displayGeminiResults(data, originalQuery);
      })
      .catch(error => {
        console.error('Error fetching OpenRouter results:', error);
        
        let errorMessage = error.message;
        
        // If quota exceeded, show specific message
        if (error.message.includes("quota exceeded")) {
          errorMessage = `
            <div class="error">
              <p>${error.message}</p>
              <p>OpenRouter API has a limited free tier. You have reached the quota limit.</p>
              <p>Solutions:</p>
              <ol>
                <li>Wait until your quota resets (usually daily)</li>
                <li>Set up billing in OpenRouter Console and upgrade to a paid tier</li>
                <li>Use a different API key</li>
              </ol>
            </div>
          `;
        } else {
          errorMessage = `
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
        }
        
        resultsContainer.innerHTML = errorMessage;
        
        // Add to history even if there was an error
        addToHistory(originalQuery, `Error: ${error.message}`);
      });
  };

  // Function to display API results with typewriter effect
  const displayGeminiResults = (data, query) => {
    resultsContainer.innerHTML = '';
    
    if (!data.choices || data.choices.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
      addToHistory(query, "No results found");
      return;
    }
    
    // Get the response text from the content
    const responseText = data.choices[0].message.content;
    
    // Create a formatted response container
    const responseContainer = document.createElement('div');
    responseContainer.className = 'gemini-response';
    resultsContainer.appendChild(responseContainer);
    
    // Format the text with paragraph breaks but keep it as a single typing animation
    const formattedText = responseText;
    
    // Prepare for typing animation
    let currentPosition = 0;
    const textLength = formattedText.length;
    
    // Create a span to hold the typed text
    const typingSpan = document.createElement('span');
    typingSpan.className = 'typing';
    responseContainer.appendChild(typingSpan);
    
    // Function to type characters one by one
    const typeNextChar = () => {
      if (currentPosition < textLength) {
        const char = formattedText[currentPosition];
        
        // Check if we need to create a paragraph break
        if (currentPosition > 0 && 
            formattedText[currentPosition-1] === '\n' && 
            char === '\n') {
          // Insert a paragraph break
          typingSpan.innerHTML += '<br><br>';
          currentPosition++; // Skip the second newline
        } else if (char === '\n') {
          // Just skip the newline character, we'll handle breaks separately
          currentPosition++;
          typeNextChar();
          return;
        } else {
          // Add the character
          typingSpan.textContent += char;
        }
        
        currentPosition++;
        setTimeout(typeNextChar, 20); // Adjust speed here (lower = faster)
      } else {
        // Typing completed, add to history
        addToHistory(query, responseText);
      }
    };
    
    // Start typing animation
    typeNextChar();
  };

  // Function to display mock response for development
  const displayMockResponse = (query) => {
    const mockResponses = {
      default: "This is a mock response because the API quota has been exceeded. In a real implementation, this would be a response from the OpenRouter API. You can customize this response for development purposes.\n\nThe OpenRouter API has quota limits on the free tier. To use the actual API, you would need to:\n1. Wait for your quota to reset\n2. Set up billing in OpenRouter Console\n3. Use a different API key",
      "hello": "Hello there! I'm a simulated response from the OpenRouter AI assistant. How can I help you today?",
      "hi": "Hi! I'm a simulated OpenRouter AI response. What can I help you with today?",
      "what is ai": "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. AI encompasses various technologies including machine learning, natural language processing, computer vision, and more.\n\nThere are two main types of AI:\n- Narrow AI: Designed for specific tasks (like virtual assistants)\n- General AI: Hypothetical AI with human-like cognitive abilities\n\nThis is a simulated response since the API quota is exceeded.",
      "tell me a joke": "Why don't scientists trust atoms?\n\nBecause they make up everything!\n\n(This is a mock response since the OpenRouter API quota has been exceeded)",
      "what is gemini": "Gemini is Google's most capable AI model family. It's a multimodal AI system that can understand and combine different types of information like text, code, audio, image, and video.\n\nGemini comes in three sizes:\n- Gemini Ultra: The largest and most capable model\n- Gemini Pro: The best model for scaling across a wide range of tasks\n- Gemini Nano: The most efficient model for on-device tasks\n\nGemini represents a significant advancement in AI technology, particularly in its multimodal reasoning capabilities.",
      "who are you": "I'm simulating a response from Google's OpenRouter AI assistant. OpenRouter is a multimodal AI developed by Google that can understand and generate text, code, images, and more. This is a mock response since the API quota has been exceeded, but in a real implementation, you'd be interacting with Google's advanced large language model.",
      "what can you do": "As a OpenRouter AI assistant, I'm designed to:\n\n- Answer questions and provide information\n- Generate creative content like stories or poems\n- Help with writing tasks and communication\n- Assist with coding and technical problems\n- Analyze and explain complex topics\n- Help with learning and education\n\nNote: This is a mock response since the actual API quota has been exceeded."
    };
    
    // Try to find the most relevant mock response by checking if query contains keywords
    let responseText = mockResponses.default;
    
    // Convert query to lowercase for case-insensitive matching
    const lowercaseQuery = query.toLowerCase();
    
    // Check for exact matches first
    if (mockResponses[lowercaseQuery]) {
      responseText = mockResponses[lowercaseQuery];
    } 
    // Then check for partial matches if no exact match found
    else {
      for (const key in mockResponses) {
        if (key !== 'default' && lowercaseQuery.includes(key)) {
          responseText = mockResponses[key];
          break;
        }
      }
    }
    
    // Display the mock response
    resultsContainer.innerHTML = '';
    
    // Create a formatted response container
    const responseContainer = document.createElement('div');
    responseContainer.className = 'gemini-response';
    
    // Format the response with paragraphs
    const paragraphs = responseText.split('\n\n');
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        const p = document.createElement('p');
        p.textContent = paragraph;
        responseContainer.appendChild(p);
      }
    });
    
    resultsContainer.appendChild(responseContainer);
    
    // Add to history
    addToHistory(query, responseText);
  };

  // Event listeners
  searchIcon.addEventListener('click', performSearch);
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Clear history event listener
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Focus search input on page load
  searchInput.focus();
});
