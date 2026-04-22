# Gemini IDE

An AI-powered, browser-based IDE with deep integration of Gemini 1.5 Pro.

## Features
- **AI Code Completion**: Real-time suggestions as you type.
- **VS Code Shortcuts**: Familiar keyboard mapping for high productivity.
- **Python/JS Debugger**: Step-through debugging powered by AI analysis.
- **Live Preview**: Instant feedback for web development.
- **Blueprint Panel**: Architectural overview of your engineering state.

## Local Development

To run this application on your local machine (`localhost`):

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed.
2. **Download/Clone**: Export or download this project to your computer.
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Environment Variables**:
   - Create a `.env` file in the root directory based on `.env.example`.
   - Add your `GEMINI_API_KEY` (Get one from [Google AI Studio](https://aistudio.google.com/)).
   - Add GitHub OAuth credentials if using Git features.
5. **Run Development Server**:
   ```bash
   npm run dev
   ```
6. **Access the App**:
   - Open your browser and navigate to `http://localhost:3000`.

## Production Build
To create a production-optimized build:
```bash
npm run build
npm start
```

---
*Note: In the AI Studio preview environment, the app is automatically hosted and accessible via the provided URL. The localhost instructions are for your local machine.*
