# React Chess Game

A two-player chess game built with React and TypeScript. Players can take turns playing on the same device.

## Features

- Complete chess rule implementation
- Visual piece movement
- Turn-based gameplay
- Game status display
- Unicode chess pieces
- Responsive design

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run tests:
   ```bash
   npm test
   ```

## How to Play

1. White moves first
2. Click on a piece to select it
3. Click on a valid destination square to move the piece
4. Players alternate turns
5. Game ends when a king is captured

## Project Structure

- `src/components/ChessGame.tsx` - Main game component
- `src/components/ChessGame.css` - Game styling
- `src/chessRules.ts` - Chess rules and move validation
- `src/__tests__/chessRules.test.tsx` - Unit tests for game rules

## Homework Details

**Name:** Kingshuk Kundu

**Hours Worked:** 20 working hours

**Issues Faced:** The AI occasionally broke working code, and since I hadn't backed it up on GitHub, I had to start from scratch. This experience taught me the importance of breaking down problems into smaller, manageable chunks and verifying each functionality before moving forward—a much more effective approach.
