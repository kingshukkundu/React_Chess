import React from 'react';
import ChessGame from './components/ChessGame';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>React Chess Game</h1>
      </header>
      <main className="app-main">
        <ChessGame />
      </main>
      <footer className="app-footer">
        <p>Two Player Chess Game - Play on the same device</p>
      </footer>
    </div>
  );
};

export default App;
