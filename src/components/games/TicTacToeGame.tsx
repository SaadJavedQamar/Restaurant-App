import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, UtensilsCrossed, ChefHat } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface TicTacToeProps {
  onBack: () => void;
  isOrderReady?: boolean;
}

type SquareValue = 'X' | 'O' | null;

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ onBack, isOrderReady }) => {
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<SquareValue | 'TIE' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ player: 0, chef: 0, ties: 0 });
  const [chefComment, setChefComment] = useState('Your move! Can you outsmart the kitchen?');

  const checkWinner = useCallback((currentBoard: SquareValue[]): { winner: SquareValue | 'TIE' | null; line: number[] | null } => {
    for (const combo of WIN_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every(sq => sq !== null)) {
      return { winner: 'TIE', line: null };
    }
    return { winner: null, line: null };
  }, []);

  // Sous Chef Bot AI Move
  useEffect(() => {
    if (isPlayerTurn || winner || isOrderReady) return;

    setChefComment('Chef is calculating the recipe...');

    const timer = setTimeout(() => {
      setBoard(prevBoard => {
        const { winner: currentWin } = checkWinner(prevBoard);
        if (currentWin) return prevBoard;

        const emptyIndices = prevBoard
          .map((val, idx) => (val === null ? idx : null))
          .filter((v): v is number => v !== null);

        if (emptyIndices.length === 0) return prevBoard;

        // 1. Try to win
        for (const idx of emptyIndices) {
          const testBoard = [...prevBoard];
          testBoard[idx] = 'O';
          if (checkWinner(testBoard).winner === 'O') {
            setChefComment('Order up! Checkmate from the chef!');
            return testBoard;
          }
        }

        // 2. Block player win
        for (const idx of emptyIndices) {
          const testBoard = [...prevBoard];
          testBoard[idx] = 'X';
          if (checkWinner(testBoard).winner === 'X') {
            const blockBoard = [...prevBoard];
            blockBoard[idx] = 'O';
            setChefComment('Blocked! Nothing burns on my watch.');
            return blockBoard;
          }
        }

        // 3. Take center if available
        if (prevBoard[4] === null) {
          const newBoard = [...prevBoard];
          newBoard[4] = 'O';
          setChefComment('Chef claims the center station!');
          return newBoard;
        }

        // 4. Random available corner or edge
        const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const newBoard = [...prevBoard];
        newBoard[randomIdx] = 'O';
        setChefComment('Plating the next move...');
        return newBoard;
      });

      setIsPlayerTurn(true);
      soundService.playWheelTickSound();
    }, 450);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, winner, isOrderReady, checkWinner]);

  // Check state after every board mutation
  useEffect(() => {
    const res = checkWinner(board);
    if (res.winner && !winner) {
      setWinner(res.winner);
      setWinningLine(res.line);

      if (res.winner === 'X') {
        soundService.playVictorySound();
        setScores(s => ({ ...s, player: s.player + 1 }));
        setChefComment('Bravo! You beat the Head Chef!');
      } else if (res.winner === 'O') {
        soundService.playGameOverSound();
        setScores(s => ({ ...s, chef: s.chef + 1 }));
        setChefComment('Chef wins this course! Try another round.');
      } else {
        setScores(s => ({ ...s, ties: s.ties + 1 }));
        setChefComment('A balanced recipe: It is a draw!');
      }
    }
  }, [board, checkWinner, winner]);

  const handleSquareClick = (index: number) => {
    if (!isPlayerTurn || board[index] !== null || winner || isOrderReady) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    soundService.playWheelTickSound();

    const outcome = checkWinner(newBoard);
    if (!outcome.winner) {
      setIsPlayerTurn(false);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine(null);
    setChefComment('New course! Your move first.');
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-amber-400">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span className="font-bold tabular-nums">{scores.player}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1 text-sky-400">
            <ChefHat className="w-3.5 h-3.5" />
            <span className="font-bold tabular-nums">{scores.chef}</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Ties: <strong className="tabular-nums">{scores.ties}</strong></span>
        </div>
      </div>

      {/* Chef commentary banner */}
      <div className="mb-4 rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-center text-xs text-slate-300 shadow-sm flex items-center justify-center gap-2">
        <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="italic">"{chefComment}"</span>
      </div>

      {/* 3x3 Board */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-2.5 w-72 h-72">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleSquareClick(index)}
                disabled={cell !== null || !isPlayerTurn || !!winner}
                className={`relative flex items-center justify-center rounded-2xl border text-3xl font-bold transition-transform active:scale-95 ${
                  isWinningCell
                    ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cell === 'X' && (
                  <span className="text-amber-400 flex items-center justify-center animate-in zoom-in-50">
                    <UtensilsCrossed className="w-10 h-10" />
                  </span>
                )}
                {cell === 'O' && (
                  <span className="text-sky-400 flex items-center justify-center animate-in zoom-in-50">
                    <ChefHat className="w-10 h-10" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Reset Action */}
      <div className="pt-4">
        <button
          onClick={resetGame}
          className="w-full h-11 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Board</span>
        </button>
      </div>
    </div>
  );
};
