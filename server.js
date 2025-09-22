const express = require('express');
const path = require('path');
const app = express();

// Whitelist of files that are allowed to be served
const allowedFiles = [
  'index.html',
  'main.html',
  'scoreboard.html',
  'style.css',
  'refresh.html',
  'logo-2.png',
//   'firebase.js'
];

// Serve only whitelisted static files
app.use('/', (req, res, next) => {
  const requestedFile = req.path.split('/').pop();
  
  // Allow root path
  if (req.path === '/') {
    return next();
  }
  
  if (allowedFiles.includes(requestedFile)) {
    next();
  } else {
    res.status(403).send('Access Denied');
  }
});

// Serve static files from project directory
app.use(express.static(__dirname, {
  dotfiles: 'deny', // Prevent serving .git and other dot files
  index: 'index.html',
  extensions: ['html', 'css', 'js'] // Auto-resolve these extensions
}));

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Secure server running at http://localhost:${port}`);
});