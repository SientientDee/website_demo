// Google Gemini API Key
const API_KEY = 'AIzaSyDTKe3EoS3KJR8XbcX9PuF8QGaTKL5WNU4';
// Set to true to use a CORS proxy (for local development)
const USE_CORS_PROXY = false;
const CORS_PROXY = 'https://corsproxy.io/?';
// Set to true to use mock responses for development (when API quota is exceeded)
const USE_MOCK_RESPONSE = false;

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
    historyContainer.innerHTML = '';
    
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
      return;
    }
    
    // Display history items from newest to oldest
    for (let i = queryHistory.length - 1; i >= 0; i--) {
      const item = queryHistory[i];
      
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
    }
  };

  // Function to add a new item to history
  const addToHistory = (query, response) => {
    queryHistory.push({
      query,
      response,
      timestamp: new Date().toISOString()
    });
    
    // Limit history to 20 items
    if (queryHistory.length > 20) {
      queryHistory.shift();
    }
    
    saveHistory();
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
    
    // Build the request for Gemini API
    let url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
    
    // Apply CORS proxy if enabled
    if (USE_CORS_PROXY) {
      url = CORS_PROXY + encodeURIComponent(url);
    }
    
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: query
            }
          ]
        }
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800
      }
    };
    
    // Fetch results from Gemini API
    fetch(`${url}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
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
        displayGeminiResults(data, originalQuery);
      })
      .catch(error => {
        console.error('Error fetching Gemini results:', error);
        
        let errorMessage = error.message;
        
        // If quota exceeded, show specific message
        if (error.message.includes("quota exceeded")) {
          errorMessage = `
            <div class="error">
              <p>${error.message}</p>
              <p>Google Gemini API has a limited free tier. You have reached the quota limit.</p>
              <p>Solutions:</p>
              <ol>
                <li>Wait until your quota resets (usually daily)</li>
                <li>Set up billing in Google Cloud Console and upgrade to a paid tier</li>
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
                <li>Make sure you've enabled the Gemini API in your Google Cloud Console</li>
                <li>Enable billing on your Google Cloud account (required for API usage)</li>
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

  // Function to display Gemini results with typewriter effect
  const displayGeminiResults = (data, query) => {
    resultsContainer.innerHTML = '';
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
      addToHistory(query, "No results found");
      return;
    }
    
    // Get the response text from the content parts
    const contentParts = data.candidates[0].content.parts;
    let responseText = '';
    
    for (const part of contentParts) {
      if (part.text) {
        responseText += part.text;
      }
    }
    
    // Create a formatted response container
    const responseContainer = document.createElement('div');
    responseContainer.className = 'gemini-response';
    
    // Format the response with paragraphs
    const paragraphs = responseText.split('\n\n');
    let currentParagraphIndex = 0;
    
    // Function to type out a paragraph
    const typeParagraph = (paragraph, index) => {
      if (!paragraph.trim()) return;
      
      const p = document.createElement('p');
      const span = document.createElement('span');
      span.className = 'typing';
      p.appendChild(span);
      responseContainer.appendChild(p);
      
      let currentCharIndex = 0;
      const chars = paragraph.split('');
      
      const typeChar = () => {
        if (currentCharIndex < chars.length) {
          span.textContent += chars[currentCharIndex];
          currentCharIndex++;
          setTimeout(typeChar, 20); // Adjust speed here (lower = faster)
        } else {
          // Move to next paragraph
          currentParagraphIndex++;
          if (currentParagraphIndex < paragraphs.length) {
            setTimeout(() => typeParagraph(paragraphs[currentParagraphIndex], currentParagraphIndex), 500);
          } else {
            // All paragraphs typed, add to history
            addToHistory(query, responseText);
          }
        }
      };
      
      typeChar();
    };
    
    // Start typing the first paragraph
    typeParagraph(paragraphs[0], 0);
  };

  // Function to display mock response for development
  const displayMockResponse = (query) => {
    const mockResponses = {
      default: "This is a mock response because the API quota has been exceeded. In a real implementation, this would be a response from the Gemini API. You can customize this response for development purposes.\n\nThe Gemini API has quota limits on the free tier. To use the actual API, you would need to:\n1. Wait for your quota to reset\n2. Set up billing in Google Cloud Console\n3. Use a different API key",
      "hello": "Hello there! I'm a simulated response from the Gemini AI assistant. How can I help you today?",
      "hi": "Hi! I'm a simulated Gemini AI response. What can I help you with today?",
      "what is ai": "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. AI encompasses various technologies including machine learning, natural language processing, computer vision, and more.\n\nThere are two main types of AI:\n- Narrow AI: Designed for specific tasks (like virtual assistants)\n- General AI: Hypothetical AI with human-like cognitive abilities\n\nThis is a simulated response since the API quota is exceeded.",
      "tell me a joke": "Why don't scientists trust atoms?\n\nBecause they make up everything!\n\n(This is a mock response since the Gemini API quota has been exceeded)",
      "what is gemini": "Gemini is Google's most capable AI model family. It's a multimodal AI system that can understand and combine different types of information like text, code, audio, image, and video.\n\nGemini comes in three sizes:\n- Gemini Ultra: The largest and most capable model\n- Gemini Pro: The best model for scaling across a wide range of tasks\n- Gemini Nano: The most efficient model for on-device tasks\n\nGemini represents a significant advancement in AI technology, particularly in its multimodal reasoning capabilities.",
      "who are you": "I'm simulating a response from Google's Gemini AI assistant. Gemini is a multimodal AI developed by Google that can understand and generate text, code, images, and more. This is a mock response since the API quota has been exceeded, but in a real implementation, you'd be interacting with Google's advanced large language model.",
      "what can you do": "As a Gemini AI assistant, I'm designed to:\n\n- Answer questions and provide information\n- Generate creative content like stories or poems\n- Help with writing tasks and communication\n- Assist with coding and technical problems\n- Analyze and explain complex topics\n- Help with learning and education\n\nNote: This is a mock response since the actual API quota has been exceeded."
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
