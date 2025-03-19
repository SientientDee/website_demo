# Diren AI Search

A web application that integrates with OpenRouter API to provide a conversational search experience with a playful AI assistant named Diren.

## Features

- Chat-based interface with a sassy AI assistant
- Streaming responses for real-time feedback
- Local chat history storage
- Responsive design for mobile and desktop
- Support for both development and production environments

## Setup

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/diren-ai-search.git
   cd diren-ai-search
   ```

2. Create an account on [OpenRouter](https://openrouter.ai/) and obtain an API key.

3. For local testing, you can set your API key directly in `test.js` (remember to remove it before pushing to GitHub):
   ```javascript
   const API_KEY = 'your-openrouter-api-key';
   ```

4. Open `index.html` in your browser to use the application.

### Vercel Deployment

1. Create a Vercel account and connect your GitHub repository.

2. Set up environment variables in Vercel:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key

3. Deploy to Vercel.

## Configuration Options

You can adjust the following options in `test.js`:

- `USE_CORS_PROXY`: Set to `true` if you encounter CORS issues during development
- `USE_MOCK_RESPONSE`: Set to `true` to use mock responses when testing without API access

## API Model

The application uses the `qwen/qwen-2-7b-instruct:free` model from OpenRouter, but you can change this in the code if desired.

## License

MIT License 