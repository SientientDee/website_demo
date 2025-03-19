// Vercel serverless function to handle OpenRouter API requests
// This keeps your API key secure on the server side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenRouter API key not configured on the server'
      });
    }
    
    // Forward the request to the OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers['referer'] || 'https://yourdomain.com',
        'X-Title': 'Diren AI Search'
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return res.status(response.status).json({
        error: errorData || 'Error from OpenRouter API',
        status: response.status
      });
    }
    
    // For streaming responses, we need to handle differently
    if (req.body.stream) {
      // Set appropriate headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Get the readable stream from the response
      const reader = response.body.getReader();
      
      // Stream the data back to the client
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          res.end();
          break;
        }
        
        // Forward the chunk to the client
        const chunk = new TextDecoder().decode(value);
        res.write(chunk);
      }
      
      return;
    } else {
      // For non-streaming responses, just return the JSON
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return res.status(500).json({
      error: 'Error processing your request',
      details: error.message
    });
  }
} 