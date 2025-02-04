import {
  isValidPosition,
  isPawnMove,
  isRookMove,
  isBishopMove,
  isKnightMove,
  isQueenMove,
  isKingMove,
  isValidMove,
  isKingInCheck,
  isCastlingValid,
  needsPawnPromotion,
  type ChessPiece,
  type Position,
  type GameState,
  type PieceColor
} from '../chessRules';

describe('Chess Rules Tests', () => {
  let emptyBoard: (ChessPiece | null)[][];
  let gameState: GameState;

  beforeEach(() => {
    emptyBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    gameState = {
      board: emptyBoard,
      currentPlayer: 'white',
      enPassantTarget: null,
      castlingRights: {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
      }
    };
  });

  describe('Check and Checkmate Tests', () => {
    test('should detect king in check', () => {
      // Set up a simple check scenario
      // White king at e1, black rook at e8
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      const whiteKing: ChessPiece = { type: 'king', color: 'white', hasMoved: false };
      const blackRook: ChessPiece = { type: 'rook', color: 'black', hasMoved: false };
      
      board[7][4] = whiteKing;  // e1
      board[0][4] = blackRook;   // e8

      expect(isKingInCheck('white', board)).toBe(true);
    });

    test('should not be checkmate if king can escape', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king at e1, black rook at e8, but king can move to d1 or f1
      board[7][4] = { type: 'king', color: 'white', hasMoved: false };
      board[0][4] = { type: 'rook', color: 'black', hasMoved: false };

      expect(isKingInCheck('white', board)).toBe(true);
      
      // Verify king can escape
      const kingPiece = board[7][4];
      const hasEscape = isValidMove(
        { row: 7, col: 4 },
        { row: 7, col: 3 },
        kingPiece!,
        board,
        { gameState, checkForCheck: true }
      );
      
      expect(hasEscape).toBe(true);
    });

    test('should detect checkmate when king is surrounded', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // White king surrounded by black pieces
      board[7][4] = { type: 'king', color: 'white', hasMoved: false };
      board[6][3] = { type: 'pawn', color: 'black', hasMoved: true };
      board[6][4] = { type: 'pawn', color: 'black', hasMoved: true };
      board[6][5] = { type: 'pawn', color: 'black', hasMoved: true };
      board[7][3] = { type: 'queen', color: 'black', hasMoved: true };
      board[7][5] = { type: 'rook', color: 'black', hasMoved: true };

      expect(isKingInCheck('white', board)).toBe(true);
      
      // Test all possible moves for white king
      let hasEscape = false;
      const kingPiece = board[7][4];
      for (let toRow = 6; toRow <= 7; toRow++) {
        for (let toCol = 3; toCol <= 5; toCol++) {
          if (isValidMove(
            { row: 7, col: 4 },
            { row: toRow, col: toCol },
            kingPiece!,
            board,
            { gameState, checkForCheck: true }
          )) {
            const tempBoard = board.map(row => [...row]);
            tempBoard[toRow][toCol] = kingPiece;
            tempBoard[7][4] = null;
            
            if (!isKingInCheck('white', tempBoard)) {
              hasEscape = true;
            }
          }
        }
      }
      
      expect(hasEscape).toBe(false);
    });
  });

  describe('Special Moves', () => {
    test('should allow castling when conditions are met', () => {
      const board = Array(8).fill(null).map(() => Array(8).fill(null));
      
      // Set up white king and rook in initial positions
      board[7][4] = { type: 'king', color: 'white', hasMoved: false };
      board[7][7] = { type: 'rook', color: 'white', hasMoved: false };

      expect(isCastlingValid(
        { row: 7, col: 4 },
        { row: 7, col: 6 },
        'white',
        board
      )).toBe(true);
    });

    test('should detect pawn promotion', () => {
      const pawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true };
      
      expect(needsPawnPromotion({ row: 0, col: 0 }, pawn)).toBe(true);
      expect(needsPawnPromotion({ row: 3, col: 0 }, pawn)).toBe(false);
    });
  });
});
