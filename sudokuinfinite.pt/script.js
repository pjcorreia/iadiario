document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const boardElement = document.getElementById('sudoku-board');
    const newGameBtn = document.getElementById('new-game-btn');
    const difficultySelect = document.getElementById('difficulty');
    const checkBtn = document.getElementById('check-btn');
    const messageElement = document.getElementById('message');

    // Game state
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let solution = Array(9).fill().map(() => Array(9).fill(0));
    let cellInputs = [];

    // Initialize the game
    initializeGame();

    // Event listeners
    newGameBtn.addEventListener('click', () => {
        generateNewGame(difficultySelect.value);
    });

    checkBtn.addEventListener('click', checkSolution);

    // Initialize the game board
    function initializeGame() {
        createBoard();
        generateNewGame(difficultySelect.value);
    }

    // Create the board UI
    function createBoard() {
        boardElement.innerHTML = '';
        cellInputs = [];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = row;
                input.dataset.col = col;
                
                // Add event listeners for input validation
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    // Only allow numbers 1-9
                    if (!/^[1-9]$/.test(value) && value !== '') {
                        e.target.value = '';
                    }
                    
                    // Clear any error styling
                    input.classList.remove('error');
                    messageElement.textContent = '';
                    messageElement.className = '';
                });
                
                // Highlight same numbers on focus
                input.addEventListener('focus', () => highlightSameNumbers(input));
                input.addEventListener('blur', () => removeHighlights());
                
                cell.appendChild(input);
                boardElement.appendChild(cell);
                
                // Store reference to input element
                if (!cellInputs[row]) {
                    cellInputs[row] = [];
                }
                cellInputs[row][col] = input;
            }
        }
    }

    // Generate a new Sudoku game
    function generateNewGame(difficulty) {
        // Clear message
        messageElement.textContent = '';
        messageElement.className = '';
        
        // Generate a solved board
        generateSolvedBoard();
        
        // Copy solution
        solution = JSON.parse(JSON.stringify(board));
        
        // Remove numbers based on difficulty
        removeNumbers(difficulty);
        
        // Update UI
        updateBoardUI();
    }

    // Generate a solved Sudoku board
    function generateSolvedBoard() {
        // Clear the board
        board = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill the diagonal 3x3 boxes first (these can be filled independently)
        fillDiagonalBoxes();
        
        // Solve the rest of the board
        solveSudoku();
    }

    // Fill the diagonal 3x3 boxes
    function fillDiagonalBoxes() {
        for (let box = 0; box < 9; box += 3) {
            fillBox(box, box);
        }
    }

    // Fill a 3x3 box with random numbers
    function fillBox(startRow, startCol) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(nums);
        
        let index = 0;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                board[startRow + row][startCol + col] = nums[index++];
            }
        }
    }

    // Solve the Sudoku board using backtracking
    function solveSudoku() {
        const emptyCell = findEmptyCell();
        if (!emptyCell) {
            return true; // Board is solved
        }
        
        const [row, col] = emptyCell;
        
        // Try placing numbers 1-9
        for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(row, col, num)) {
                board[row][col] = num;
                
                if (solveSudoku()) {
                    return true;
                }
                
                // If placing num doesn't lead to a solution, backtrack
                board[row][col] = 0;
            }
        }
        
        return false; // Trigger backtracking
    }

    // Find an empty cell (value 0)
    function findEmptyCell() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return [row, col];
                }
            }
        }
        return null; // No empty cells
    }

    // Check if placing a number is valid
    function isValidPlacement(row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (board[row][c] === num) {
                return false;
            }
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (board[r][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[boxStartRow + r][boxStartCol + c] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // Remove numbers from the board based on difficulty
    function removeNumbers(difficulty) {
        let cellsToRemove;
        
        switch (difficulty) {
            case 'easy':
                cellsToRemove = 40; // 41 clues (81-40)
                break;
            case 'medium':
                cellsToRemove = 50; // 31 clues
                break;
            case 'hard':
                cellsToRemove = 60; // 21 clues
                break;
            default:
                cellsToRemove = 40;
        }
        
        // Create a list of all positions
        const positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push([row, col]);
            }
        }
        
        // Shuffle the positions
        shuffleArray(positions);
        
        // Remove numbers
        for (let i = 0; i < cellsToRemove; i++) {
            const [row, col] = positions[i];
            board[row][col] = 0;
        }
    }

    // Update the board UI based on the current board state
    function updateBoardUI() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const input = cellInputs[row][col];
                const value = board[row][col];
                
                if (value === 0) {
                    // Empty cell
                    input.value = '';
                    input.readOnly = false;
                    input.parentElement.classList.remove('prefilled');
                } else {
                    // Prefilled cell
                    input.value = value;
                    input.readOnly = true;
                    input.parentElement.classList.add('prefilled');
                }
            }
        }
    }

    // Check if the current board state is a valid solution
    function checkSolution() {
        // Get current board state from inputs
        const currentBoard = getCurrentBoardState();
        
        // Check if the board is complete
        if (!isBoardComplete(currentBoard)) {
            showMessage('Please fill in all cells before checking.', 'error');
            return;
        }
        
        // Check if the solution is correct
        if (isCorrectSolution(currentBoard)) {
            showMessage('Congratulations! You solved the puzzle correctly!', 'success');
        } else {
            showMessage('Sorry, your solution contains errors.', 'error');
            highlightErrors(currentBoard);
        }
    }

    // Get the current board state from input values
    function getCurrentBoardState() {
        const currentBoard = Array(9).fill().map(() => Array(9).fill(0));
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = cellInputs[row][col].value;
                currentBoard[row][col] = value === '' ? 0 : parseInt(value);
            }
        }
        
        return currentBoard;
    }

    // Check if the board is completely filled
    function isBoardComplete(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the current solution matches the correct solution
    function isCorrectSolution(currentBoard) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentBoard[row][col] !== solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Highlight cells with errors
    function highlightErrors(currentBoard) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (currentBoard[row][col] !== solution[row][col]) {
                    cellInputs[row][col].classList.add('error');
                }
            }
        }
    }

    // Highlight cells with the same number
    function highlightSameNumbers(input) {
        const value = input.value;
        if (value === '') return;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (cellInputs[row][col].value === value) {
                    cellInputs[row][col].parentElement.classList.add('highlight');
                }
            }
        }
    }

    // Remove all highlights
    function removeHighlights() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                cellInputs[row][col].parentElement.classList.remove('highlight');
            }
        }
    }

    // Show a message to the user
    function showMessage(text, type) {
        messageElement.textContent = text;
        messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    }

    // Utility function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
