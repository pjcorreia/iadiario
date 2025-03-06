const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const games = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new game
  socket.on('createGame', () => {
    const gameId = generateGameId();
    games[gameId] = {
      id: gameId,
      board: Array(9).fill(''),
      players: [socket.id],
      currentTurn: 0, // Index of the player whose turn it is
      status: 'waiting' // waiting, playing, finished
    };

    socket.join(gameId);
    socket.emit('gameCreated', { gameId });
    console.log(`Game created: ${gameId}`);
  });

  // Join an existing game
  socket.on('joinGame', ({ gameId }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    game.players.push(socket.id);
    game.status = 'playing';
    
    socket.join(gameId);
    
    // Notify both players that the game has started
    io.to(gameId).emit('gameStarted', { 
      gameId,
      board: game.board,
      currentTurn: game.currentTurn,
      players: game.players
    });
    
    console.log(`Player joined game: ${gameId}`);
  });

  // Handle a player's move
  socket.on('makeMove', ({ gameId, index }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Check if it's the player's turn
    const playerIndex = game.players.indexOf(socket.id);
    if (playerIndex === -1 || playerIndex !== game.currentTurn) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Check if the cell is already taken
    if (game.board[index] !== '') {
      socket.emit('error', { message: 'Cell already taken' });
      return;
    }

    // Make the move
    game.board[index] = playerIndex === 0 ? 'X' : 'O';
    
    // Check for a win or draw
    const result = checkGameResult(game.board);
    
    if (result.status === 'win') {
      game.status = 'finished';
      io.to(gameId).emit('gameOver', { 
        winner: playerIndex,
        winningLine: result.winningLine,
        board: game.board
      });
    } else if (result.status === 'draw') {
      game.status = 'finished';
      io.to(gameId).emit('gameOver', { 
        winner: -1, // No winner
        board: game.board
      });
    } else {
      // Switch turns
      game.currentTurn = 1 - game.currentTurn;
      
      // Update all players with the new game state
      io.to(gameId).emit('gameUpdated', {
        board: game.board,
        currentTurn: game.currentTurn
      });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find any games the player was in
    for (const gameId in games) {
      const game = games[gameId];
      const playerIndex = game.players.indexOf(socket.id);
      
      if (playerIndex !== -1) {
        // Notify the other player that this player has left
        socket.to(gameId).emit('playerLeft');
        
        // Remove the game
        delete games[gameId];
        console.log(`Game ${gameId} ended because a player left`);
      }
    }
  });

  // Handle game restart
  socket.on('restartGame', ({ gameId }) => {
    const game = games[gameId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Reset the game
    game.board = Array(9).fill('');
    game.currentTurn = 0;
    game.status = 'playing';
    
    // Notify both players that the game has restarted
    io.to(gameId).emit('gameStarted', { 
      gameId,
      board: game.board,
      currentTurn: game.currentTurn,
      players: game.players
    });
    
    console.log(`Game restarted: ${gameId}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Helper functions
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkGameResult(board) {
  // Winning combinations (rows, columns, diagonals)
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  // Check for a win
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { status: 'win', winningLine: pattern };
    }
  }

  // Check for a draw
  if (!board.includes('')) {
    return { status: 'draw' };
  }

  // Game is still in progress
  return { status: 'playing' };
}
