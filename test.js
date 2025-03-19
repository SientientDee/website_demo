// OpenRouter API Key
// const API_KEY = '';
const API_KEY = OPENROUTER_API_KEY;
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
  const resultsContainer = document.getElementById('results-container');
  const historyContainer = document.getElementById('history-container');
  const clearHistoryBtn = document.getElementById('clear-history');
  
  // Array to store query history
  let queryHistory = [];
  
  // Array to store conversation history for context (chat memory)
  let conversationHistory = [];
  
  // Maximum number of conversation turns to remember (8 as shown in screenshot)
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
    
    // Create an abort controller for the stream
    const controller = new AbortController();
    
    // Build the request for OpenRouter API (Qwen 2 7B Instruct)
    let url = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Apply CORS proxy if enabled
    if (USE_CORS_PROXY) {
      url = CORS_PROXY + encodeURIComponent(url);
    }
    
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
    
    // Keep reference to loading indicator
    const loadingIndicator = resultsContainer.querySelector('.loading');
    
    // Create a response container (but don't append it yet - wait for first response)
    const responseContainer = document.createElement('div');
    responseContainer.className = 'gemini-response';
    
    // Variable to track if we've received any content
    let hasReceivedContent = false;
    
    // Variable to accumulate full response text
    let fullResponseText = '';
    
    // Fetch results from OpenRouter API with streaming
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Diren AI Search'
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    })
      .then(response => {
        console.log('API Response status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error('API Error response:', text);
            if (text.includes("RESOURCE_EXHAUSTED") || text.includes("quota")) {
              throw new Error("API quota exceeded. Please try again later or upgrade your plan.");
            } else {
              throw new Error(`API Error (${response.status}): ${text}`);
            }
          });
        }
        
        // Get a reader to process the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // Function to process the stream chunks
        function processStream({ done, value }) {
          // Stream is done
          if (done) {
            console.log('Stream complete');
            
            // Update conversation history with this exchange
            conversationHistory.push({ role: 'user', content: query });
            conversationHistory.push({ role: 'assistant', content: fullResponseText });
            
            // Limit conversation history to MAX_CONVERSATION_MEMORY turns
            if (conversationHistory.length > MAX_CONVERSATION_MEMORY * 2) {
              conversationHistory = conversationHistory.slice(-MAX_CONVERSATION_MEMORY * 2);
            }
            
            // Save updated conversation history
            saveConversationHistory();
            
            // Add to display history
            addToHistory(originalQuery, fullResponseText);
            
            return;
          }
          
          // Process this chunk
          const chunk = decoder.decode(value, { stream: true });
          
          try {
            // Handle multiple chunks that may be in the response
            const lines = chunk.split('\n');
            let newContent = '';
            
            lines.forEach(line => {
              // Skip empty lines or "data: [DONE]"
              if (!line || line.trim() === '' || line.includes('[DONE]')) return;
              
              // Remove the "data: " prefix
              const jsonData = line.replace(/^data: /, '').trim();
              
              // Some lines might not be JSON
              if (!jsonData) return;
              
              try {
                const data = JSON.parse(jsonData);
                // Extract the content delta
                if (data.choices && data.choices[0]?.delta?.content) {
                  newContent += data.choices[0].delta.content;
                }
              } catch (e) {
                console.warn('Error parsing JSON from stream:', e, jsonData);
              }
            });
            
            // Append new content to the response container
            if (newContent) {
              // Handle paragraph breaks for display
              newContent = newContent.replace(/\n\n/g, '<br><br>');
              
              // If this is the first content, remove loading indicator and add response container
              if (!hasReceivedContent) {
                hasReceivedContent = true;
                // Remove the loading indicator if it exists
                if (loadingIndicator && loadingIndicator.parentNode) {
                  loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                // Now add the response container to the DOM
                resultsContainer.appendChild(responseContainer);
              }
              
              // Use innerHTML to render the HTML properly with line breaks
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = newContent;
              
              // For each text node in the temp div, append to the response container
              for (const node of tempDiv.childNodes) {
                responseContainer.appendChild(node.cloneNode(true));
              }
              
              // Accumulate for the complete response
              fullResponseText += newContent.replace(/<br><br>/g, '\n\n');
              
              // Scroll to the bottom of the results
              resultsContainer.scrollTop = resultsContainer.scrollHeight;
              
              // Log the new content for debugging
              console.log('New content received:', newContent);
            }
          } catch (e) {
            console.error('Error processing stream chunk:', e);
          }
          
          // Continue reading the stream
          return reader.read().then(processStream);
        }
        
        // Start processing the stream
        return reader.read().then(processStream);
      })
      .catch(error => {
        // Handle errors (unchanged from original code)
        console.error('Error fetching OpenRouter results:', error);
        
        let errorMessage = error.message;
        
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

  // Add debounce function for auto-submit
  let typingTimer;                // Timer identifier
  const doneTypingInterval = 500; // Time in ms (1 second)
  
  // Event listeners
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(typingTimer);
      performSearch();
    }
  });
  
  // On keyup, start the countdown
  searchInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    const query = searchInput.value.trim();
    
    // Only set the timer if there's actual content
    if (query.length > 0) {
      typingTimer = setTimeout(performSearch, doneTypingInterval);
    }
  });
  
  // On keydown, clear the countdown
  searchInput.addEventListener('keydown', () => {
    clearTimeout(typingTimer);
  });
  
  // Clear history event listener
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Focus search input on page load
  searchInput.focus();
});
