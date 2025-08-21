import https from 'https';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import http from 'http';

// SSL certificate options
const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost-cert.pem')
};

// Expo should already be running on port 8081, so we'll just proxy to it
console.log('Creating HTTPS proxy to existing Expo server on port 8081...');

const server = https.createServer(options, (req, res) => {
  // Proxy all requests to the Expo server
  
  const proxyReq = http.request({
    hostname: 'localhost',
    port: 8081,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      // Copy headers from proxy response
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      res.writeHead(proxyRes.statusCode);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(500);
      res.end('Proxy error');
    });
    
    req.pipe(proxyReq);
  });

server.listen(8443, '0.0.0.0', () => {
  console.log('\n🔒 HTTPS Server running!');
  console.log('📱 Access on iPhone: https://10.0.0.68:8443');
  console.log('⚠️  You will need to accept the self-signed certificate warning');
  console.log('💡 In Safari: tap "Advanced" → "Proceed to 10.0.0.68 (Unsafe)"');
});

server.on('error', (err) => {
  console.error('HTTPS server error:', err);
});