#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Remove leading slash
  if (pathname.startsWith('/')) pathname = pathname.slice(1);

  // Handle GET requests for files
  if (req.method === 'GET') {
    let filePath = path.join(__dirname, pathname);
    
    // If requesting root, serve customers.html
    if (pathname === '' || pathname === '/') {
      filePath = path.join(__dirname, 'customers.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }

      // Determine content type
      let contentType = 'text/html';
      if (filePath.endsWith('.js')) contentType = 'application/javascript';
      else if (filePath.endsWith('.json')) contentType = 'application/json';
      else if (filePath.endsWith('.css')) contentType = 'text/css';

      res.setHeader('Content-Type', contentType);
      res.writeHead(200);
      res.end(data);
    });
  }

  // Handle PUT requests to save data.json
  else if (req.method === 'PUT' && pathname === 'data/data.json') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        // Parse and validate JSON
        const jsonData = JSON.parse(body);
        
        // Write to file
        fs.writeFileSync(DATA_FILE, JSON.stringify(jsonData, null, 2));
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Data saved successfully' }));
        
        console.log('✅ Data saved to data/data.json');
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  else {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   📱 StoreManager Server Running      ║
║                                        ║
║   🌐 http://localhost:${PORT}             ║
║                                        ║
║   ✅ Data will be saved to data.json   ║
╚════════════════════════════════════════╝
  `);
});
