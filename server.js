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

// Sets
const typingUsers = new Set(); // Track users who are typing
const usernames = new Set(); // Track registered usernames

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve the index.html file when someone visits the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  socket.username = socket.id; // Initialize username to socket ID

  // Listen for 'disconnect' events
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.username}`);
    typingUsers.delete(socket.username); // Remove user from typing list
    usernames.delete(socket.username); // Delete username from usernames list
    io.emit('user list', Array.from(usernames)); // Update list of users to ALL connected clients
  });

  // Listen for 'set username events from client
  socket.on('set username', (username) => {
    username = username.trim(); // Remove whitespace

    if (!username || usernames.has(username.toLowerCase())) { // If name is null or already exists
      socket.emit('username register', false); // Send error to client
      return; // End function here
    }

    socket.username = username; // Set username
    usernames.add(username); // Add username to set
    socket.emit('username register', true); // Send success to client
    io.emit('user list', Array.from(usernames)); // Send list of users to ALL connected clients
    console.log(`✅ Connected: ${socket.username}`);
  });

  // Listen for 'chat message' events from a client
  socket.on('chat message', (msg) => {
    console.log(`💬 ${socket.username}: ${msg}`);
    // Broadcast the message to ALL connected clients (including the sender)
    io.emit('chat message', {
      username: socket.username, // Send username
      message: msg // Send message
    });
    typingUsers.delete(socket.username); // Remove user from typing list
    socket.broadcast.emit('typing', Array.from(typingUsers)); // Send array to all clients (except the sender)
  });

  // Listen for 'typing' events from client
  socket.on('typing', () => {
    typingUsers.add(socket.username);
    socket.broadcast.emit('typing', Array.from(typingUsers)); // Send array to all clients (except the sender)
  });

  socket.on('stop typing', () => {
    typingUsers.delete(socket.username);
    socket.broadcast.emit('typing', Array.from(typingUsers)); // Send array to all clients (except the sender)
  });

});
// --- End Socket.IO Logic ---


// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});