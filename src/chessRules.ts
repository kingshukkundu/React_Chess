export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  promotion?: PieceType;
  isCastling?: boolean;
  isEnPassant?: boolean;
}

export interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: PieceColor;
  enPassantTarget: Position | null;
  castlingRights: {
    white: { kingSide: boolean; queenSide: boolean };
    black: { kingSide: boolean; queenSide: boolean };
  };
}

export const isValidPosition = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
};

export const isSamePosition = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};

export const isPathClear = (
  from: Position,
  to: Position,
  board: (ChessPiece | null)[][]
): boolean => {
  const rowStep = Math.sign(to.row - from.row);
  const colStep = Math.sign(to.col - from.col);
  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;

  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  return true;
};

export const isKingInCheck = (
  color: PieceColor,
  board: (ChessPiece | null)[][],
  kingPos?: Position
): boolean => {
  // Find king's position if not provided
  if (!kingPos) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece?.type === 'king' && piece.color === color) {
          kingPos = { row, col };
          break;
        }
      }
      if (kingPos) break;
    }
  }

  if (!kingPos) return false;

  // Check if any opponent's piece can capture the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color !== color) {
        const canCapture = isValidMove(
          { row, col },
          kingPos,
          piece,
          board,
          { checkForCheck: false }
        );
        if (canCapture) return true;
      }
    }
  }
  return false;
};

export const isPawnMove = (
  from: Position,
  to: Position,
  piece: ChessPiece,
  board: (ChessPiece | null)[][],
  gameState?: GameState
): boolean => {
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  
  // Normal move forward
  if (to.col === from.col && to.row === from.row + direction && !board[to.row][to.col]) {
    return true;
  }
  
  // Initial two-square move
  if (
    !piece.hasMoved &&
    from.row === startRow &&
    to.col === from.col &&
    to.row === from.row + 2 * direction &&
    !board[to.row][to.col] &&
    !board[from.row + direction][from.col]
  ) {
    return true;
  }
  
  // Regular capture
  if (
    to.row === from.row + direction &&
    Math.abs(to.col - from.col) === 1 &&
    board[to.row][to.col] &&
    board[to.row][to.col]?.color !== piece.color
  ) {
    return true;
  }

  // En passant
  if (
    gameState?.enPassantTarget &&
    to.row === from.row + direction &&
    Math.abs(to.col - from.col) === 1 &&
    isSamePosition(to, gameState.enPassantTarget)
  ) {
    return true;
  }
  
  return false;
};

export const isRookMove = (
  from: Position,
  to: Position,
  board: (ChessPiece | null)[][]
): boolean => {
  if (from.row !== to.row && from.col !== to.col) return false;
  
  const rowDir = Math.sign(to.row - from.row);
  const colDir = Math.sign(to.col - from.col);
  
  let currentRow = from.row + rowDir;
  let currentCol = from.col + colDir;
  
  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowDir;
    currentCol += colDir;
  }
  
  return true;
};

export const isBishopMove = (
  from: Position,
  to: Position,
  board: (ChessPiece | null)[][]
): boolean => {
  if (Math.abs(to.row - from.row) !== Math.abs(to.col - from.col)) return false;
  
  const rowDir = Math.sign(to.row - from.row);
  const colDir = Math.sign(to.col - from.col);
  
  let currentRow = from.row + rowDir;
  let currentCol = from.col + colDir;
  
  while (currentRow !== to.row && currentCol !== to.col) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowDir;
    currentCol += colDir;
  }
  
  return true;
};

export const isKnightMove = (from: Position, to: Position): boolean => {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};

export const isQueenMove = (
  from: Position,
  to: Position,
  board: (ChessPiece | null)[][]
): boolean => {
  return isRookMove(from, to, board) || isBishopMove(from, to, board);
};

export const isKingMove = (from: Position, to: Position): boolean => {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);
  return rowDiff <= 1 && colDiff <= 1;
};

export const isValidMove = (
  from: Position,
  to: Position,
  piece: ChessPiece,
  board: (ChessPiece | null)[][],
  options: {
    gameState?: GameState;
    checkForCheck?: boolean;
    allowCastling?: boolean;
  } = { checkForCheck: true, allowCastling: true }
): boolean => {
  // Don't allow moves to the same position
  if (from.row === to.row && from.col === to.col) {
    return false;
  }

  if (!isValidPosition(from) || !isValidPosition(to)) return false;
  
  const targetPiece = board[to.row][to.col];
  if (targetPiece && targetPiece.color === piece.color) return false;
  
  let isValid = false;
  
  switch (piece.type) {
    case 'pawn':
      isValid = isPawnMove(from, to, piece, board, options.gameState);
      break;
    case 'rook':
      isValid = isRookMove(from, to, board);
      break;
    case 'knight':
      isValid = isKnightMove(from, to);
      break;
    case 'bishop':
      isValid = isBishopMove(from, to, board);
      break;
    case 'queen':
      isValid = isQueenMove(from, to, board);
      break;
    case 'king':
      isValid = isKingMove(from, to);
      if (!isValid && options.allowCastling && !piece.hasMoved && Math.abs(to.col - from.col) === 2) {
        // Check if castling is allowed based on castling rights
        const isKingSide = to.col > from.col;
        if (options.gameState?.castlingRights?.[piece.color]?.[isKingSide ? 'kingSide' : 'queenSide']) {
          isValid = isCastlingValid(from, to, piece.color, board);
        }
      }
      break;
    default:
      return false;
  }

  if (!isValid) return false;

  // Check if move puts or leaves own king in check
  if (options.checkForCheck !== false) {
    const tempBoard = board.map(row => [...row]);
    tempBoard[to.row][to.col] = piece;
    tempBoard[from.row][from.col] = null;

    // For en passant capture
    if (
      piece.type === 'pawn' &&
      options.gameState?.enPassantTarget &&
      isSamePosition(to, options.gameState.enPassantTarget)
    ) {
      tempBoard[from.row][to.col] = null;
    }

    if (isKingInCheck(piece.color, tempBoard)) {
      return false;
    }
  }

  return true;
};

export const isCastlingValid = (
  from: Position,
  to: Position,
  color: PieceColor,
  board: (ChessPiece | null)[][]
): boolean => {
  const row = color === 'white' ? 7 : 0;
  const isKingSide = to.col > from.col;
  
  // Check if king and rook are in correct positions
  const rookCol = isKingSide ? 7 : 0;
  const rook = board[row][rookCol];
  
  if (!rook || rook.type !== 'rook' || rook.color !== color || rook.hasMoved) {
    return false;
  }

  // Verify king is in starting position
  const king = board[row][4];
  if (!king || king.type !== 'king' || king.color !== color || king.hasMoved) {
    return false;
  }

  // Check if path between king and rook is clear
  const start = Math.min(from.col, rookCol);
  const end = Math.max(from.col, rookCol);
  for (let col = start + 1; col < end; col++) {
    if (board[row][col] !== null) {
      return false;
    }
  }

  // Check if king passes through check
  const direction = isKingSide ? 1 : -1;
  for (let col = from.col; col !== to.col + direction; col += direction) {
    const tempBoard = board.map(row => [...row]);
    tempBoard[row][from.col] = null;
    tempBoard[row][col] = { type: 'king', color, hasMoved: false };
    if (isKingInCheck(color, tempBoard)) {
      return false;
    }
  }

  return true;
};

export const getPawnPromotionPieces = (color: PieceColor): ChessPiece[] => {
  return ['queen', 'rook', 'bishop', 'knight'].map(type => ({
    type: type as PieceType,
    color,
    hasMoved: true
  }));
};

export const needsPawnPromotion = (to: Position, piece: ChessPiece): boolean => {
  return piece.type === 'pawn' && (to.row === 0 || to.row === 7);
};

export const canMovePreventCheck = (
  color: PieceColor,
  board: (ChessPiece | null)[][]
): boolean => {
  // Try every possible move for every piece of the given color
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== color) continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          const from = { row: fromRow, col: fromCol };
          const to = { row: toRow, col: toCol };

          // Skip invalid moves
          if (from.row === to.row && from.col === to.col) continue;

          // Check if the move is valid according to piece rules
          if (isValidMove(from, to, piece, board, { 
            checkForCheck: false // Don't check for check yet as we'll do it manually
          })) {
            // Try the move on a temporary board
            const tempBoard = board.map(row => row.map(cell => 
              cell ? { ...cell } : null
            ));
            tempBoard[to.row][to.col] = { ...piece };
            tempBoard[from.row][from.col] = null;

            // If this move gets us out of check, it's a valid escape
            if (!isKingInCheck(color, tempBoard)) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
};

export const isCheckmate = (
  color: PieceColor,
  board: (ChessPiece | null)[][]
): boolean => {
  // First verify the king is in check
  if (!isKingInCheck(color, board)) {
    return false;
  }

  // Then verify no move can get out of check
  return !canMovePreventCheck(color, board);
};

export const isStalemate = (
  color: PieceColor,
  board: (ChessPiece | null)[][],
  gameState: GameState
): boolean => {
  // If the king is in check, it's not stalemate
  if (isKingInCheck(color, board)) {
    return false;
  }

  // Check if the player has any legal moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getValidMoves({ row, col }, piece, board, gameState);
        if (moves.length > 0) {
          return false;
        }
      }
    }
  }

  // If no legal moves are found and king is not in check, it's stalemate
  return true;
};

export const getValidMoves = (
  from: Position,
  piece: ChessPiece,
  board: (ChessPiece | null)[][],
  gameState: GameState
): Position[] => {
  const validMoves: Position[] = [];
  const { row, col } = from;

  // Define possible moves based on piece type
  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const moves = [
        { row: row + direction, col }, // Forward one
        { row: row + 2 * direction, col }, // Forward two (if hasn't moved)
        { row: row + direction, col: col - 1 }, // Capture left
        { row: row + direction, col: col + 1 }, // Capture right
      ];
      if (gameState.enPassantTarget) {
        moves.push({ row: row + direction, col: gameState.enPassantTarget.col }); // En passant
      }
      for (const move of moves) {
        if (isValidMove(from, move, piece, board, { gameState, checkForCheck: true })) {
          validMoves.push(move);
        }
      }
      break;
    }
    case 'knight': {
      const moves = [
        { row: row - 2, col: col - 1 }, { row: row - 2, col: col + 1 },
        { row: row - 1, col: col - 2 }, { row: row - 1, col: col + 2 },
        { row: row + 1, col: col - 2 }, { row: row + 1, col: col + 2 },
        { row: row + 2, col: col - 1 }, { row: row + 2, col: col + 1 }
      ];
      for (const move of moves) {
        if (isValidMove(from, move, piece, board, { gameState, checkForCheck: true })) {
          validMoves.push(move);
        }
      }
      break;
    }
    case 'king': {
      // Regular king moves
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          if (r === 0 && c === 0) continue;
          const move = { row: row + r, col: col + c };
          if (isValidMove(from, move, piece, board, { gameState, checkForCheck: true })) {
            validMoves.push(move);
          }
        }
      }
      // Castling moves
      if (!piece.hasMoved) {
        const castlingMoves = [
          { row, col: col - 2 }, // Queen side
          { row, col: col + 2 }  // King side
        ];
        for (const move of castlingMoves) {
          if (isValidMove(from, move, piece, board, { gameState, checkForCheck: true, allowCastling: true })) {
            validMoves.push(move);
          }
        }
      }
      break;
    }
    case 'rook':
    case 'bishop':
    case 'queen': {
      const directions = piece.type === 'rook' ? [
        [-1, 0], [1, 0], [0, -1], [0, 1] // Rook directions
      ] : piece.type === 'bishop' ? [
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Bishop directions
      ] : [
        [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1] // Queen directions
      ];

      for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const move = { row: r, col: c };
          if (isValidMove(from, move, piece, board, { gameState, checkForCheck: true })) {
            validMoves.push(move);
          }
          if (board[r][c] !== null) break; // Stop if we hit a piece
          r += dr;
          c += dc;
        }
      }
      break;
    }
  }

  return validMoves;
};
