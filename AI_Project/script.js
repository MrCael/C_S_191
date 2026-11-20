const BOARD_SIZE = 8;
const DARK = "dark";
const LIGHT = "light";

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const turnDotEl = document.getElementById("turn-dot");
const gameOverEl = document.getElementById("game-over");
const winnerTextEl = document.getElementById("winner-text");
const newGameBtn = document.getElementById("new-game");

// Game state.
// board[row][col] is either null (empty) or a piece: { color: DARK | LIGHT, king: boolean }.
// Row 0 is the top of the board. Light starts at the top, dark at the bottom.
let board = [];
let currentPlayer = DARK;
let selected = null; // { row, col } of the selected piece, or null
let validMoves = []; // legal moves for the selected piece: { toRow, toCol, captured }
let jumpingPiece = null; // { row, col } of a piece in the middle of a multi-jump, or null
let winner = null; // DARK or LIGHT once the game is over, otherwise null
// The move just made, kept only until the next render so it can be animated:
// { fromRow, fromCol, toRow, toCol, captured: { row, col, piece } | null }
let lastMove = null;

// A square is dark (playable) when (row + col) is odd.
function isPlayableSquare(row, col) {
  return (row + col) % 2 === 1;
}

// Starting position: 12 light pieces on the top 3 rows,
// 12 dark pieces on the bottom 3 rows, all on dark squares.
function createInitialBoard() {
  const newBoard = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      let piece = null;
      if (isPlayableSquare(row, col)) {
        if (row < 3) piece = { color: LIGHT, king: false };
        else if (row > 4) piece = { color: DARK, king: false };
      }
      boardRow.push(piece);
    }
    newBoard.push(boardRow);
  }
  return newBoard;
}

// Build the 8x8 grid of square elements once.
function createBoardSquares() {
  boardEl.innerHTML = "";
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = document.createElement("div");
      square.className = `square ${isPlayableSquare(row, col) ? "dark" : "light"}`;
      square.dataset.row = row;
      square.dataset.col = col;
      boardEl.appendChild(square);
    }
  }
}

function getSquareEl(row, col) {
  return boardEl.children[row * BOARD_SIZE + col];
}

function isOnBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

// Row directions a piece may move in. Dark starts at the bottom and moves up
// (row - 1); light starts at the top and moves down (row + 1).
// Kings can move and capture both ways.
function getRowDirections(piece) {
  if (piece.king) return [-1, 1];
  return piece.color === DARK ? [-1] : [1];
}

// Simple (non-capture) moves: one step diagonally forward onto an empty square.
function getSimpleMoves(row, col) {
  const piece = board[row][col];
  const moves = [];
  for (const dRow of getRowDirections(piece)) {
    for (const dCol of [-1, 1]) {
      const toRow = row + dRow;
      const toCol = col + dCol;
      if (isOnBoard(toRow, toCol) && board[toRow][toCol] === null) {
        moves.push({ toRow, toCol, captured: null });
      }
    }
  }
  return moves;
}

// Jumps: an opponent piece diagonally adjacent (in a direction this piece may
// move) with an empty square right behind it. `captured` is the jumped square.
function getJumps(row, col) {
  const piece = board[row][col];
  const jumps = [];
  for (const dRow of getRowDirections(piece)) {
    for (const dCol of [-1, 1]) {
      const midRow = row + dRow;
      const midCol = col + dCol;
      const toRow = row + 2 * dRow;
      const toCol = col + 2 * dCol;
      if (!isOnBoard(toRow, toCol)) continue;
      const middle = board[midRow][midCol];
      if (middle && middle.color !== piece.color && board[toRow][toCol] === null) {
        jumps.push({ toRow, toCol, captured: { row: midRow, col: midCol } });
      }
    }
  }
  return jumps;
}

// Does any piece of `player` have a jump available?
function playerHasJump(player) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === player && getJumps(row, col).length > 0) {
        return true;
      }
    }
  }
  return false;
}

// Legal moves for the piece at (row, col), applying the capture rules:
// - In the middle of a multi-jump, only the jumping piece may move, and only by jumping.
// - Captures are mandatory: if the player has any jump, only jumps are legal.
function getLegalMoves(row, col) {
  if (jumpingPiece) {
    const isJumper = jumpingPiece.row === row && jumpingPiece.col === col;
    return isJumper ? getJumps(row, col) : [];
  }
  if (playerHasJump(currentPlayer)) return getJumps(row, col);
  return getSimpleMoves(row, col);
}

function selectPiece(row, col) {
  selected = { row, col };
  validMoves = getLegalMoves(row, col);
}

function clearSelection() {
  selected = null;
  validMoves = [];
}

function opponentOf(player) {
  return player === DARK ? LIGHT : DARK;
}

function playerName(player) {
  return player === DARK ? "Purple" : "White";
}

// Can `player` make any move at all? A player with no pieces left also has no moves.
function playerHasAnyMove(player) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== player) continue;
      if (getJumps(row, col).length > 0 || getSimpleMoves(row, col).length > 0) {
        return true;
      }
    }
  }
  return false;
}

// Pass the turn. If the next player has no pieces or no legal moves, they lose.
function switchTurn() {
  currentPlayer = opponentOf(currentPlayer);
  if (!playerHasAnyMove(currentPlayer)) {
    winner = opponentOf(currentPlayer);
  }
}

// A regular piece becomes a king when it reaches the far row:
// row 0 for dark (moving up), row 7 for light (moving down).
// Returns true if the piece was promoted.
function promoteIfNeeded(row, col) {
  const piece = board[row][col];
  if (piece.king) return false;
  const farRow = piece.color === DARK ? 0 : BOARD_SIZE - 1;
  if (row !== farRow) return false;
  piece.king = true;
  return true;
}

// Carry out a move from the selected square. After a jump, if the same piece
// can jump again it must continue: the turn stays with this player and the
// piece stays selected. Otherwise the turn passes.
// Being promoted to king always ends the turn, even if more jumps were possible.
function makeMove(move) {
  const { row: fromRow, col: fromCol } = selected;
  lastMove = {
    fromRow,
    fromCol,
    toRow: move.toRow,
    toCol: move.toCol,
    captured: move.captured
      ? { ...move.captured, piece: board[move.captured.row][move.captured.col] }
      : null,
  };

  board[move.toRow][move.toCol] = board[fromRow][fromCol];
  board[fromRow][fromCol] = null;
  if (move.captured) {
    board[move.captured.row][move.captured.col] = null;
  }

  const promoted = promoteIfNeeded(move.toRow, move.toCol);

  if (move.captured && !promoted) {
    if (getJumps(move.toRow, move.toCol).length > 0) {
      jumpingPiece = { row: move.toRow, col: move.toCol };
      selectPiece(move.toRow, move.toCol);
      return;
    }
  }

  jumpingPiece = null;
  clearSelection();
  switchTurn();
}

// Click handling:
// - Click your own piece to select it (click it again to deselect).
// - Click a highlighted square to move there.
// - Click anywhere else to deselect.
// - During a multi-jump the jumping piece stays selected until the jump ends.
function handleSquareClick(row, col) {
  if (winner) return; // game over: ignore clicks until a new game starts

  if (selected) {
    const move = validMoves.find((m) => m.toRow === row && m.toCol === col);
    if (move) {
      makeMove(move);
      render();
      return;
    }
  }

  if (jumpingPiece) return; // must finish the multi-jump

  const piece = board[row][col];
  const clickedSelected = selected && selected.row === row && selected.col === col;
  if (
    piece &&
    piece.color === currentPlayer &&
    !clickedSelected &&
    getLegalMoves(row, col).length > 0
  ) {
    selectPiece(row, col);
  } else {
    clearSelection();
  }
  render();
}

function getStatusText() {
  if (winner) return `${playerName(winner)} wins!`;
  const name = playerName(currentPlayer);
  if (jumpingPiece) return `${name}'s turn: keep jumping`;
  if (playerHasJump(currentPlayer)) return `${name}'s turn: you must capture`;
  return `${name}'s turn`;
}

function createPieceEl(piece) {
  const pieceEl = document.createElement("div");
  pieceEl.className = `piece ${piece.color}${piece.king ? " king" : ""}`;
  return pieceEl;
}

// Draw every piece from the board state onto the squares, plus:
// - highlights for the selected piece, its destinations, and pieces that can move
// - a slide animation for the piece that just moved and a fade-out for a captured piece
function render() {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const squareEl = getSquareEl(row, col);
      squareEl.innerHTML = "";
      squareEl.classList.remove("target");
      const piece = board[row][col];
      if (!piece) continue;

      const pieceEl = createPieceEl(piece);
      if (selected && selected.row === row && selected.col === col) {
        pieceEl.classList.add("selected");
      }
      if (
        !winner &&
        piece.color === currentPlayer &&
        getLegalMoves(row, col).length > 0
      ) {
        pieceEl.classList.add("movable");
      }
      if (lastMove && lastMove.toRow === row && lastMove.toCol === col) {
        // Start the piece where it came from (in square units) and slide it home.
        pieceEl.style.setProperty("--from-x", lastMove.fromCol - col);
        pieceEl.style.setProperty("--from-y", lastMove.fromRow - row);
        pieceEl.classList.add("moving");
      }
      squareEl.appendChild(pieceEl);
    }
  }

  if (lastMove && lastMove.captured) {
    const { row, col, piece } = lastMove.captured;
    const ghostEl = createPieceEl(piece);
    ghostEl.classList.add("captured");
    ghostEl.addEventListener("animationend", () => ghostEl.remove());
    getSquareEl(row, col).appendChild(ghostEl);
  }
  lastMove = null; // animate each move only once

  for (const move of validMoves) {
    getSquareEl(move.toRow, move.toCol).classList.add("target");
  }

  updateStatus(getStatusText());
  turnDotEl.className = `turn-dot ${winner || currentPlayer}`;

  gameOverEl.hidden = !winner;
  if (winner) {
    winnerTextEl.textContent = `${playerName(winner)} wins!`;
  }
}

function updateStatus(text) {
  statusEl.textContent = text;
}

function startGame() {
  board = createInitialBoard();
  currentPlayer = DARK;
  jumpingPiece = null;
  winner = null;
  lastMove = null;
  clearSelection();
  render();
}

// One click listener on the board handles every square (event delegation).
boardEl.addEventListener("click", (event) => {
  const squareEl = event.target.closest(".square");
  if (!squareEl) return;
  handleSquareClick(Number(squareEl.dataset.row), Number(squareEl.dataset.col));
});

newGameBtn.addEventListener("click", startGame);

createBoardSquares();
startGame();
