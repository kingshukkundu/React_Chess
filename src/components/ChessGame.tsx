import React, { useState, useEffect } from 'react';
import {
  ChessPiece,
  Position,
  PieceType,
  PieceColor,
  GameState,
  isValidMove,
  isKingInCheck,
  isSamePosition,
  needsPawnPromotion,
  getPawnPromotionPieces,
  isCheckmate,
  isStalemate,
  getValidMoves
} from '../chessRules';
import './ChessGame.css';
import { getComputerMove } from '../services/stockfishService';

const createInitialBoard = (): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up black pieces
  board[0] = [
    { type: 'rook', color: 'black', hasMoved: false },
    { type: 'knight', color: 'black', hasMoved: false },
    { type: 'bishop', color: 'black', hasMoved: false },
    { type: 'queen', color: 'black', hasMoved: false },
    { type: 'king', color: 'black', hasMoved: false },
    { type: 'bishop', color: 'black', hasMoved: false },
    { type: 'knight', color: 'black', hasMoved: false },
    { type: 'rook', color: 'black', hasMoved: false }
  ];

  // Set up black pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
  }

  // Set up white pawns
  for (let i = 0; i < 8; i++) {
    board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
  }

  // Set up white pieces
  board[7] = [
    { type: 'rook', color: 'white', hasMoved: false },
    { type: 'knight', color: 'white', hasMoved: false },
    { type: 'bishop', color: 'white', hasMoved: false },
    { type: 'queen', color: 'white', hasMoved: false },
    { type: 'king', color: 'white', hasMoved: false },
    { type: 'bishop', color: 'white', hasMoved: false },
    { type: 'knight', color: 'white', hasMoved: false },
    { type: 'rook', color: 'white', hasMoved: false }
  ];

  return board;
};

const initialBoard = createInitialBoard();

type GameMode = 'player' | 'computer' | null;

const ChessGame: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(initialBoard);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white');
  const [gameStatus, setGameStatus] = useState<string>('');
  const [showPromotionDialog, setShowPromotionDialog] = useState<Position | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    board: initialBoard,
    currentPlayer: 'white',
    enPassantTarget: null,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    }
  });



  const handlePawnPromotion = (promotionPiece: PieceType) => {
    if (!showPromotionDialog) return;

    const newBoard = board.map(row => [...row]);
    newBoard[showPromotionDialog.row][showPromotionDialog.col] = {
      type: promotionPiece,
      color: currentPlayer,
      hasMoved: true
    };

    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    const nextGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer
    };

    setBoard(newBoard);
    setShowPromotionDialog(null);
    setCurrentPlayer(nextPlayer);
    setGameState(nextGameState);
    
    // Check for checkmate after promotion
    if (isKingInCheck(nextPlayer, newBoard) && isCheckmate(nextPlayer, newBoard)) {
      setGameStatus(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins by checkmate!`);
      return;
    }
    
    // Check for check
    if (isKingInCheck(nextPlayer, newBoard)) {
      setGameStatus(`${nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1)} is in check!`);
    } else {
      setGameStatus('');
    }
  };



  // Convert board state to FEN notation for Stockfish API
  const boardToFEN = () => {
    let fen = '';
    let emptyCount = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          let pieceSymbol = '';
          switch (piece.type) {
            case 'pawn': pieceSymbol = 'p'; break;
            case 'rook': pieceSymbol = 'r'; break;
            case 'knight': pieceSymbol = 'n'; break;
            case 'bishop': pieceSymbol = 'b'; break;
            case 'queen': pieceSymbol = 'q'; break;
            case 'king': pieceSymbol = 'k'; break;
          }
          fen += piece.color === 'white' ? pieceSymbol.toUpperCase() : pieceSymbol;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
        emptyCount = 0;
      }
      if (row < 7) fen += '/';
    }
    
    fen += ` ${currentPlayer.charAt(0)} KQkq - 0 1`;
    return fen;
  };

  // Handle computer's move
  useEffect(() => {
    const makeComputerMove = async () => {
      if (gameMode === 'computer' && currentPlayer === 'black' && !isComputerThinking && !isGameOver) {
        setIsComputerThinking(true);
        try {
          const fen = boardToFEN();
          const move = await getComputerMove(fen);
          
          const fromPos = { 
            row: 8 - parseInt(move[1]), 
            col: move.charCodeAt(0) - 97 
          };
          const toPos = { 
            row: 8 - parseInt(move[3]), 
            col: move.charCodeAt(2) - 97 
          };
          
          const selectedPiece = board[fromPos.row][fromPos.col];
          if (!selectedPiece) return;

          const newBoard = board.map(row => [...row]);
          const newGameState = { ...gameState };

          // Update castling rights if moving king or rook
          if (selectedPiece.type === 'king') {
            newGameState.castlingRights[selectedPiece.color] = {
              kingSide: false,
              queenSide: false
            };
          } else if (selectedPiece.type === 'rook') {
            const side = fromPos.col === 0 ? 'queenSide' : 'kingSide';
            newGameState.castlingRights[selectedPiece.color][side] = false;
          }

          // Move the piece
          newBoard[toPos.row][toPos.col] = {
            ...selectedPiece,
            hasMoved: true
          };
          newBoard[fromPos.row][fromPos.col] = null;

          setBoard(newBoard);
          setGameState(newGameState);
          setCurrentPlayer('white');

          // Check for checkmate or stalemate
          if (isKingInCheck('white', newBoard) && isCheckmate('white', newBoard)) {
            setGameStatus('Black wins by checkmate!');
            setIsGameOver(true);
          } else if (isStalemate('white', newBoard, newGameState)) {
            setGameStatus('Game drawn by stalemate!');
            setIsGameOver(true);
          } else if (isKingInCheck('white', newBoard)) {
            setGameStatus('White is in check!');
          } else {
            setGameStatus('');
          }
        } catch (error) {
          console.error('Error making computer move:', error);
        }
        setIsComputerThinking(false);
      }
    };

    makeComputerMove();
  }, [currentPlayer, gameMode, isGameOver]);

  const handleSquareClick = (row: number, col: number) => {
    // Don't allow moves during computer's turn
    if (gameMode === 'computer' && currentPlayer === 'black') return;
    // Only block moves if the game is over (checkmate), not when in check
    if (showPromotionDialog || (gameStatus && gameStatus.includes('wins'))) return;

    const clickedPosition: Position = { row, col };
    const clickedPiece = board[row][col];
    
    // Clear valid moves when clicking a new square
    setValidMoves([]);

    // If no piece is selected
    if (!selectedPosition) {
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedPosition(clickedPosition);
        // Calculate and show valid moves
        const moves = getValidMoves(clickedPosition, clickedPiece, board, gameState);
        setValidMoves(moves);
      }
      return;
    }

    // If a piece is already selected
    const selectedPiece = board[selectedPosition.row][selectedPosition.col];
    if (!selectedPiece) return;

    // Check if the move is valid
    if (isValidMove(selectedPosition, clickedPosition, selectedPiece, board, { gameState, allowCastling: true })) {
      const newBoard = board.map(row => [...row]);
      const newGameState = { ...gameState };

      // Handle castling
      if (selectedPiece.type === 'king' && Math.abs(clickedPosition.col - selectedPosition.col) === 2) {
        const isKingSide = clickedPosition.col > selectedPosition.col;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? clickedPosition.col - 1 : clickedPosition.col + 1;

        // Move rook
        const rook = newBoard[selectedPosition.row][rookFromCol];
        if (rook && rook.type === 'rook' && rook.color === selectedPiece.color) {
          // Move the rook
          newBoard[selectedPosition.row][rookToCol] = {
            ...rook,
            hasMoved: true
          };
          newBoard[selectedPosition.row][rookFromCol] = null;

          // Move the king
          newBoard[selectedPosition.row][clickedPosition.col] = {
            ...selectedPiece,
            hasMoved: true
          };
          newBoard[selectedPosition.row][selectedPosition.col] = null;

          // Update castling rights immediately
          newGameState.castlingRights[selectedPiece.color] = {
            kingSide: false,
            queenSide: false
          };

          // Update board and state
          setBoard(newBoard);
          setGameState(newGameState);
          setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
          setSelectedPosition(null);
          return;
        }
      }

      // Handle en passant capture
      if (
        selectedPiece.type === 'pawn' &&
        gameState.enPassantTarget &&
        isSamePosition(clickedPosition, gameState.enPassantTarget)
      ) {
        newBoard[selectedPosition.row][clickedPosition.col] = null;
      }

      // Set en passant target for next move
      newGameState.enPassantTarget = null;
      if (
        selectedPiece.type === 'pawn' &&
        Math.abs(clickedPosition.row - selectedPosition.row) === 2
      ) {
        newGameState.enPassantTarget = {
          row: (clickedPosition.row + selectedPosition.row) / 2,
          col: clickedPosition.col
        };
      }



      // Move the piece
      newBoard[clickedPosition.row][clickedPosition.col] = {
        ...selectedPiece,
        hasMoved: true
      };
      newBoard[selectedPosition.row][selectedPosition.col] = null;

      // Check for pawn promotion
      if (needsPawnPromotion(clickedPosition, selectedPiece)) {
        setShowPromotionDialog(clickedPosition);
        setBoard(newBoard);
        setSelectedPosition(null);
        return;
      }

      // Update castling rights
      if (selectedPiece.type === 'king') {
        newGameState.castlingRights[selectedPiece.color] = {
          kingSide: false,
          queenSide: false
        };
      } else if (selectedPiece.type === 'rook') {
        const side = selectedPosition.col === 0 ? 'queenSide' : 'kingSide';
        newGameState.castlingRights[selectedPiece.color][side] = false;
      }

      setBoard(newBoard);
      setGameState(newGameState);
      setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');

      // Check for checkmate, stalemate, or check
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
      
      // First check for checkmate
      if (isKingInCheck(nextPlayer, newBoard) && isCheckmate(nextPlayer, newBoard)) {
        setGameStatus(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins by checkmate!`);
        setIsGameOver(true);
        return; // End the game
      }
      
      // Check for stalemate
      if (isStalemate(nextPlayer, newBoard, newGameState)) {
        setGameStatus('Game drawn by stalemate!');
        setIsGameOver(true);
        return; // End the game
      }
      
      // Then check for check
      if (isKingInCheck(nextPlayer, newBoard)) {
        setGameStatus(`${nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1)} is in check!`);
      } else {
        // Clear any previous check status
        setGameStatus('');
      }
    }

    setSelectedPosition(null);
  };

  const getPieceSymbol = (piece: ChessPiece | null): string => {
    if (!piece) return '';
    const symbols: { [key: string]: { [key: string]: string } } = {
      white: {
        king: '\u2654',
        queen: '\u2655',
        rook: '\u2656',
        bishop: '\u2657',
        knight: '\u2658',
        pawn: '\u2659',
      },
      black: {
        king: '\u265A',
        queen: '\u265B',
        rook: '\u265C',
        bishop: '\u265D',
        knight: '\u265E',
        pawn: '\u265F\uFE0E',
      },
    };
    return symbols[piece.color][piece.type];
  };

  const handleRestart = () => {
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setSelectedPosition(null);
    setIsGameOver(false);
    setValidMoves([]);
    setCurrentPlayer('white');
    setGameStatus('');
    setShowPromotionDialog(null);
    setGameState({
      board: newBoard,
      currentPlayer: 'white',
      enPassantTarget: null,
      castlingRights: {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
      }
    });
  };

  if (!gameMode) {
    return (
      <div className="game-mode-selection">
        <h2>Select Game Mode</h2>
        <button onClick={() => setGameMode('player')}>Play against Player</button>
        <button onClick={() => setGameMode('computer')}>Play against Computer</button>
      </div>
    );
  }

  return (
    <div className="chess-game">
      <div className="game-controls">
        <button onClick={handleRestart}>New Game</button>
        <button onClick={() => { setGameMode(null); handleRestart(); }}>Change Game Mode</button>
      </div>
      <div className="game-status">
        {gameStatus || `Current player: ${currentPlayer}`}
        {isGameOver && (
          <button onClick={handleRestart} className="restart-button">
            Restart Game
          </button>
        )}
        {gameMode === 'computer' && currentPlayer === 'black' && isComputerThinking && (
          <div className="thinking-indicator">Computer is thinking...</div>
        )}
      </div>
      <div className="chess-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((piece, colIndex) => {
              const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex;
              const squareColor = (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black';
              const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex);
              const isValidCapture = isValidMove && piece !== null && piece.color !== currentPlayer;
              
              return (
                <div
                  key={colIndex}
                  className={`square ${squareColor} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {isValidMove && !isValidCapture && <div className="valid-move-indicator" />}
                  {isValidCapture && <div className="valid-capture-indicator" />}
                  <span className="piece">{getPieceSymbol(piece)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {showPromotionDialog && (
        <div className="promotion-dialog">
          <div className="promotion-pieces">
            {getPawnPromotionPieces(currentPlayer).map((piece) => (
              <div
                key={piece.type}
                className="promotion-piece"
                onClick={() => handlePawnPromotion(piece.type)}
              >
                <span className="piece">{getPieceSymbol(piece)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;
