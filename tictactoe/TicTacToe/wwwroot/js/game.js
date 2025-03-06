// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const gameIdInput = document.getElementById('game-id-input');
const gameIdDisplay = document.getElementById('game-id');
const playerTurn = document.getElementById('player-turn');
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

// Connect to SignalR hub
const connection = new signalR.HubConnectionBuilder()
    .withUrl('/gamehub')
    .configureLogging(signalR.LogLevel.Information)
    .build();

// Start the connection
async function startConnection() {
    try {
        await connection.start();
        console.log('Connected to SignalR hub');
    } catch (err) {
        console.error('Error connecting to SignalR hub:', err);
        setTimeout(startConnection, 5000);
    }
}

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
    connection.invoke('CreateGame');
}

function joinGame() {
    const id = gameIdInput.value.trim().toUpperCase();
    if (id) {
        connection.invoke('JoinGame', id);
    } else {
        showNotification('Please enter a valid Game ID');
    }
}

function makeMove(index) {
    if (!isMyTurn || currentBoard[index] !== '') {
        return;
    }
    
    connection.invoke('MakeMove', gameId, index);
}

function restartGame() {
    connection.invoke('RestartGame', gameId);
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
    welcomeScreen.classList.add('d-none');
    gameScreen.classList.remove('d-none');
}

function showNotification(message) {
    notification.textContent = message;
    notification.classList.remove('d-none');
    
    setTimeout(() => {
        notification.classList.add('d-none');
    }, 3000);
}

function highlightWinningCells(winningLine) {
    if (winningLine) {
        winningLine.forEach(index => {
            cells[index].classList.add('highlight');
        });
    }
}

// SignalR Event Handlers
connection.on('GameCreated', (data) => {
    gameId = data.gameId;
    playerSymbol = 'X';
    gameIdDisplay.textContent = gameId;
    showGameScreen();
    console.log('Game created with ID:', gameId);
});

connection.on('GameStarted', (data) => {
    gameId = data.gameId;
    gameIdDisplay.textContent = gameId;
    
    // Determine player symbol based on player index
    const playerIndex = data.players.indexOf(connection.connectionId);
    playerSymbol = playerIndex === 0 ? 'X' : 'O';
    
    // Update board and turn indicator
    updateBoard(data.board);
    updateTurnIndicator(data.currentTurn);
    
    // Hide game over screen if it was shown
    gameOver.classList.add('d-none');
    
    showGameScreen();
    console.log('Game started:', data);
});

connection.on('GameUpdated', (data) => {
    updateBoard(data.board);
    updateTurnIndicator(data.currentTurn);
    console.log('Game updated:', data);
});

connection.on('GameOver', (data) => {
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
    
    gameOver.classList.remove('d-none');
    console.log('Game over:', data);
});

connection.on('PlayerLeft', () => {
    showNotification('Opponent left the game');
    playerTurn.textContent = 'Opponent left the game';
    gameOver.classList.remove('d-none');
    gameResult.textContent = 'Opponent left the game';
});

connection.on('Error', (data) => {
    showNotification(data.message);
    console.error('Error:', data.message);
});

// Start the connection
startConnection();
