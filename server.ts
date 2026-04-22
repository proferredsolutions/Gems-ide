import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser for incoming code previews
  app.use(express.json());

  // In-memory storage for the "Live Server" content
  let liveContent: Record<string, string> = {};

  // GitHub OAuth Routes
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }
    const redirectUri = `${process.env.APP_URL}/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo user',
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const { access_token } = response.data;
      
      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` }
      });

      const userData = userResponse.data;

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GITHUB_AUTH_SUCCESS', 
                  user: { 
                    login: ${JSON.stringify(userData.login)}, 
                    avatar_url: ${JSON.stringify(userData.avatar_url)} 
                  } 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub OAuth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Endpoint to update live content
  app.post("/api/live/update", (req, res) => {
    const { id, content } = req.body;
    if (id && content !== undefined) {
      liveContent[id] = content;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Endpoint to serve the live content as a real HTML page
  app.get("/api/live/preview/:id", (req, res) => {
    const { id } = req.params;
    const content = liveContent[id];
    if (content) {
      res.setHeader("Content-Type", "text/html");
      
      // Inject a script to intercept console.log and errors
      const injectedScript = `
        <script>
          (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            function sendToParent(type, args) {
              window.parent.postMessage({
                type: 'CONSOLE_LOG',
                logType: type,
                args: Array.from(args).map(arg => {
                  try {
                    return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                  } catch(e) {
                    return String(arg);
                  }
                })
              }, '*');
            }

            console.log = function() {
              sendToParent('log', arguments);
              originalLog.apply(console, arguments);
            };
            console.error = function() {
              sendToParent('error', arguments);
              originalError.apply(console, arguments);
            };
            console.warn = function() {
              sendToParent('warn', arguments);
              originalWarn.apply(console, arguments);
            };

            window.onerror = function(msg, url, lineNo, columnNo, error) {
              sendToParent('error', [msg + (lineNo ? ' (line ' + lineNo + ')' : '')]);
              return false;
            };
          })();
        </script>
      `;
      
      const modifiedContent = content.includes('</head>') 
        ? content.replace('</head>', `${injectedScript}</head>`)
        : injectedScript + content;

      res.send(modifiedContent);
    } else {
      res.status(404).send("Preview not found. Please run the file first.");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
