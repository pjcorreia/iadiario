// Connect to Socket.IO server
const socket = io();

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const gameIdInput = document.getElementById('game-id-input');
const gameIdDisplay = document.getElementById('game-id');
const playerTurn = document.getElementById('player-turn');
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const gameOver = document.getElementById('game-over');
const gameResult = document.getElementById('game-result');
const restartBtn = document.getElementById('restart-btn');
const notification = document.getElementById('notification');

// Game state
let gameId = null;
let playerSymbol = null;
let isMyTurn = false;
let currentBoard = Array(9).fill('');

// Event Listeners
createGameBtn.addEventListener('click', createGame);
joinGameBtn.addEventListener('click', joinGame);
restartBtn.addEventListener('click', restartGame);
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = parseInt(cell.getAttribute('data-index'));
        makeMove(index);
    });
});

// Functions
function createGame() {
    socket.emit('createGame');
}

function joinGame() {
    const id = gameIdInput.value.trim().toUpperCase();
    if (id) {
        socket.emit('joinGame', { gameId: id });
    } else {
        showNotification('Please enter a valid Game ID');
    }
}

function makeMove(index) {
    if (!isMyTurn || currentBoard[index] !== '') {
        return;
    }
    
    socket.emit('makeMove', { gameId, index });
}

function restartGame() {
    socket.emit('restartGame', { gameId });
}

function updateBoard(board) {
    currentBoard = board;
    
    cells.forEach((cell, index) => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'highlight');
        
        if (board[index] === 'X') {
            cell.textContent = 'X';
            cell.classList.add('x');
        } else if (board[index] === 'O') {
            cell.textContent = 'O';
            cell.classList.add('o');
        }
    });
}

function updateTurnIndicator(currentTurn) {
    const playerIndex = playerSymbol === 'X' ? 0 : 1;
    isMyTurn = currentTurn === playerIndex;
    
    if (isMyTurn) {
        playerTurn.textContent = 'Your turn';
    } else {
        playerTurn.textContent = 'Opponent\'s turn';
    }
}

function showGameScreen() {
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

function showNotification(message) {
    notification.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function highlightWinningCells(winningLine) {
    if (winningLine) {
        winningLine.forEach(index => {
            cells[index].classList.add('highlight');
        });
    }
}

// Socket.IO Event Handlers
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('gameCreated', (data) => {
    gameId = data.gameId;
    playerSymbol = 'X';
    gameIdDisplay.textContent = gameId;
    showGameScreen();
    console.log('Game created with ID:', gameId);
});

socket.on('gameStarted', (data) => {
    gameId = data.gameId;
    gameIdDisplay.textContent = gameId;
    
    // Determine player symbol based on player index
    const playerIndex = data.players.indexOf(socket.id);
    playerSymbol = playerIndex === 0 ? 'X' : 'O';
    
    // Update board and turn indicator
    updateBoard(data.board);
    updateTurnIndicator(data.currentTurn);
    
    // Hide game over screen if it was shown
    gameOver.classList.add('hidden');
    
    showGameScreen();
    console.log('Game started:', data);
});

socket.on('gameUpdated', (data) => {
    updateBoard(data.board);
    updateTurnIndicator(data.currentTurn);
    console.log('Game updated:', data);
});

socket.on('gameOver', (data) => {
    updateBoard(data.board);
    
    if (data.winningLine) {
        highlightWinningCells(data.winningLine);
    }
    
    if (data.winner === -1) {
        gameResult.textContent = 'Game ended in a draw!';
    } else {
        const winnerSymbol = data.winner === 0 ? 'X' : 'O';
        if (playerSymbol === winnerSymbol) {
            gameResult.textContent = 'You won!';
        } else {
            gameResult.textContent = 'You lost!';
        }
    }
    
    gameOver.classList.remove('hidden');
    console.log('Game over:', data);
});

socket.on('playerLeft', () => {
    showNotification('Opponent left the game');
    playerTurn.textContent = 'Opponent left the game';
    gameOver.classList.remove('hidden');
    gameResult.textContent = 'Opponent left the game';
});

socket.on('error', (data) => {
    showNotification(data.message);
    console.error('Error:', data.message);
});
