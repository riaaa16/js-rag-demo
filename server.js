// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io'; // Import the Server class from socket.io
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);      // Current file's full path
const __dirname = path.dirname(__filename);             // Current file's directory

const app = express();
const server = http.createServer(app); // Create an HTTP server using Express
const io = new Server(server); // Initialize Socket.IO, passing it the HTTP server

// Track who is currently typing
const typingUsers = new Set();

const PORT = process.env.PORT || 3000;

// Serve the index.html file when someone visits the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id); // Log when a new client connects

  // Listen for 'disconnect' events
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    typingUsers.delete(socket.id); // Remove user from typing list
  });

  // Listen for 'chat message' events from a client
  socket.on('chat message', (msg) => {
    console.log('💬 Message received:', msg);
    // Broadcast the message to ALL connected clients (including the sender)
    io.emit('chat message', msg);
    typingUsers.delete(socket.id); // Remove user from typing list
    socket.broadcast.emit('typing', Array.from(typingUsers)); // Send array to all clients (except the sender)
  });

  // Listing for 'typing' events from client
  socket.on('typing', () => {
    typingUsers.add(socket.id);
    socket.broadcast.emit('typing', Array.from(typingUsers)); // Send array to all clients (except the sender)
  });

  socket.on('stop typing', () => {
    typingUsers.delete(socket.id);
    socket.broadcast.emit('typing', Array.from(typingUsers)); // Send array to all clients (except the sender)
  });
});
// --- End Socket.IO Logic ---


// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});