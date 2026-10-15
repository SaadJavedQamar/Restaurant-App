import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface SnakeGameProps {
  onBack: () => void;
  isOrderReady?: boolean;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const FOOD_ITEMS = [
  { emoji: '🍔', name: 'Angus Burger', points: 15 },
  { emoji: '🍕', name: 'Truffle Pizza', points: 20 },
  { emoji: '🌮', name: 'Baja Taco', points: 10 },
  { emoji: '🍟', name: 'Truffle Fries', points: 12 },
  { emoji: '🧁', name: 'Berry Cupcake', points: 25 },
  { emoji: '🧋', name: 'Boba Mocktail', points: 18 }
];

const GRID_SIZE = 18;
const INITIAL_SPEED = 140;

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack, isOrderReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([
    { x: 8, y: 8 },
    { x: 8, y: 9 },
    { x: 8, y: 10 }
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const nextDirectionRef = useRef<Direction>('UP');
  const [food, setFood] = useState<{ x: number; y: number; item: typeof FOOD_ITEMS[0] }>({
    x: 5,
    y: 5,
    item: FOOD_ITEMS[0]
  });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('bistropulse_snake_hi') || '0', 10);
    }
    return 0;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // If order becomes ready, pause game immediately
  useEffect(() => {
    if (isOrderReady) {
      setIsPaused(true);
    }
  }, [isOrderReady]);

  const generateFood = useCallback((currentSnake: Point[]): { x: number; y: number; item: typeof FOOD_ITEMS[0] } => {
    let newX: number;
    let newY: number;
    let collision: boolean;
    do {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      collision = currentSnake.some(seg => seg.x === newX && seg.y === newY);
    } while (collision);

    const randomItem = FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)];
    return { x: newX, y: newY, item: randomItem };
  }, []);

  const resetGame = () => {
    const initialSnake: Point[] = [
      { x: 8, y: 8 },
      { x: 8, y: 9 },
      { x: 8, y: 10 }
    ];
    setSnake(initialSnake);
    setDirection('UP');
    nextDirectionRef.current = 'UP';
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    setFood(generateFood(initialSnake));
  };

  const handleDirectionChange = (newDir: Direction) => {
    const current = nextDirectionRef.current;
    if (newDir === 'UP' && current !== 'DOWN') nextDirectionRef.current = 'UP';
    if (newDir === 'DOWN' && current !== 'UP') nextDirectionRef.current = 'DOWN';
    if (newDir === 'LEFT' && current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (newDir === 'RIGHT' && current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
    if (!hasStarted) setHasStarted(true);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleDirectionChange('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleDirectionChange('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleDirectionChange('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleDirectionChange('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Loop
  useEffect(() => {
    if (!hasStarted || isPaused || isGameOver || isOrderReady) return;

    const currentSpeed = Math.max(70, INITIAL_SPEED - Math.floor(score / 30) * 8);

    const timer = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = nextDirectionRef.current;
        setDirection(currentDir);

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // Wall collisions
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          soundService.playGameOverSound();
          return prevSnake;
        }

        // Self collisions
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          setIsGameOver(true);
          soundService.playGameOverSound();
          return prevSnake;
        }

        // Check if food eaten
        const ateFood = head.x === food.x && head.y === food.y;
        const newSnake = [head, ...prevSnake];

        if (ateFood) {
          soundService.playEatSound();
          const earned = food.item.points;
          setScore(s => {
            const newScore = s + earned;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('bistropulse_snake_hi', newScore.toString());
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, currentSpeed);

    return () => clearInterval(timer);
  }, [hasStarted, isPaused, isGameOver, isOrderReady, food, score, highScore, generateFood]);

  // Render to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food
    const foodCenterX = food.x * cellSize + cellSize / 2;
    const foodCenterY = food.y * cellSize + cellSize / 2;
    ctx.font = `${Math.floor(cellSize * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(food.item.emoji, foodCenterX, foodCenterY);

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;

      if (isHead) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();

        // Eye dots
        ctx.fillStyle = '#0f172a';
        const eyeOffset = cellSize * 0.25;
        if (direction === 'UP') {
          ctx.fillRect(x + eyeOffset, y + eyeOffset, 3, 3);
          ctx.fillRect(x + cellSize - eyeOffset - 3, y + eyeOffset, 3, 3);
        } else if (direction === 'DOWN') {
          ctx.fillRect(x + eyeOffset, y + cellSize - eyeOffset - 3, 3, 3);
          ctx.fillRect(x + cellSize - eyeOffset - 3, y + cellSize - eyeOffset - 3, 3, 3);
        } else if (direction === 'LEFT') {
          ctx.fillRect(x + eyeOffset, y + eyeOffset, 3, 3);
          ctx.fillRect(x + eyeOffset, y + cellSize - eyeOffset - 3, 3, 3);
        } else {
          ctx.fillRect(x + cellSize - eyeOffset - 3, y + eyeOffset, 3, 3);
          ctx.fillRect(x + cellSize - eyeOffset - 3, y + cellSize - eyeOffset - 3, 3, 3);
        }
      } else {
        const shade = Math.max(0.4, 1 - index * 0.03);
        ctx.fillStyle = `rgba(245, 158, 11, ${shade})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 4);
        ctx.fill();
      }
    });
  }, [snake, food, direction]);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-3 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-400">Score: </span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-semibold tabular-nums">{highScore}</span>
          </div>
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 flex items-center justify-center my-1">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="rounded-2xl border-2 border-slate-800 shadow-2xl max-w-full aspect-square touch-none"
        />

        {/* Start / Game Over Overlay */}
        {(!hasStarted || isGameOver || isPaused) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs rounded-2xl p-4 text-center">
            {isGameOver ? (
              <>
                <h3 className="text-xl font-bold text-red-400">Order Out!</h3>
                <p className="text-xs text-slate-300 mt-1">Final Score: <strong className="text-amber-400">{score}</strong></p>
                <button
                  onClick={resetGame}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-lg transition-transform active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              </>
            ) : isPaused ? (
              <>
                <h3 className="text-lg font-bold text-white">Game Paused</h3>
                <p className="text-xs text-slate-400 mt-1">Your food is still being prepared hot!</p>
                <button
                  onClick={() => setIsPaused(false)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">🍔 🍕 🌮</div>
                <h3 className="text-base font-bold text-white">Foodie Snake</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Collect appetizers and chef specials to grow your combo score!</p>
                <button
                  onClick={resetGame}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-lg transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Game</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Thumb-Zone D-Pad for Mobile Touch Ergonomics */}
      <div className="pt-2 pb-1 flex flex-col items-center">
        <div className="grid grid-cols-3 gap-1.5 w-48">
          <div />
          <button
            onClick={() => handleDirectionChange('UP')}
            className="h-11 rounded-xl bg-slate-900 border border-slate-800 active:bg-amber-500/20 flex items-center justify-center text-slate-200 active:text-amber-400 shadow-sm"
            aria-label="Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div />

          <button
            onClick={() => handleDirectionChange('LEFT')}
            className="h-11 rounded-xl bg-slate-900 border border-slate-800 active:bg-amber-500/20 flex items-center justify-center text-slate-200 active:text-amber-400 shadow-sm"
            aria-label="Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleDirectionChange('DOWN')}
            className="h-11 rounded-xl bg-slate-900 border border-slate-800 active:bg-amber-500/20 flex items-center justify-center text-slate-200 active:text-amber-400 shadow-sm"
            aria-label="Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleDirectionChange('RIGHT')}
            className="h-11 rounded-xl bg-slate-900 border border-slate-800 active:bg-amber-500/20 flex items-center justify-center text-slate-200 active:text-amber-400 shadow-sm"
            aria-label="Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
