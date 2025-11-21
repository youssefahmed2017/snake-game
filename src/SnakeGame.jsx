import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 150;

const COLORS = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  black: '#1f2937',
  green: '#10b981'
};

const PATTERNS = {
  squares: { symbol: '■', cost: 0, name: 'Squares' },
  rectangles: { symbol: '▬', cost: 0, name: 'Rectangles' },
  triangles: { symbol: '▲', cost: 0, name: 'Triangles' },
  stars: { symbol: '★', cost: 3, name: 'Stars' },
  pentagon: { symbol: '⬟', cost: 4.5, name: 'Pentagon' },
  hexagon: { symbol: '⬡', cost: 5, name: 'Hexagon' },
  heptagon: { symbol: '⬢', cost: 6, name: 'Heptagon' },
  octagon: { symbol: '⯃', cost: 6.3, name: 'Octagon' },
  nonagon: { symbol: '⬣', cost: 7.3, name: 'Nonagon' },
  decagon: { symbol: '⬤', cost: 8, name: 'Decagon' },
  freeze: { symbol: '❄', cost: 12.5, name: 'Freeze' }
};

const SnakeLogo = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto mb-4">
    <path
      d="M 20 60 Q 30 40, 40 50 Q 50 60, 60 50 Q 70 40, 80 50 Q 90 60, 100 50"
      stroke="#10b981"
      strokeWidth="12"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="100" cy="50" r="8" fill="#10b981" />
    <circle cx="95" cy="45" r="2" fill="white" />
    <circle cx="20" cy="60" r="6" fill="#ef4444" />
  </svg>
);

export default function SnakeGame() {
  const [gameState, setGameState] = useState('menu');
  const [gameMode, setGameMode] = useState('classic');
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState([5, 5]);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lives, setLives] = useState(0);
  const [showRevive, setShowRevive] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  const [isSlowdown, setIsSlowdown] = useState(false);
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [unlockedModes, setUnlockedModes] = useState(['classic']);
  const [highScores, setHighScores] = useState({
    classic: 0,
    speed: 0,
    hard: 0,
    'endless-classic': 0,
    'endless-speedy': 0,
    'endless-hard': 0,
    uncompromising: 0
  });
  const [snakeColor, setSnakeColor] = useState('green');
  const [snakePattern, setSnakePattern] = useState('squares');
  const [starPoints, setStarPoints] = useState(0);
  const [unlockedPatterns, setUnlockedPatterns] = useState(['squares', 'rectangles', 'triangles']);
  const [lastStarCheck, setLastStarCheck] = useState(0);
  
  const synthRef = useRef(null);
  const slowdownTimerRef = useRef(null);
  const speedBoostTimerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const modesResult = await window.storage.get('unlocked-modes');
        if (modesResult) {
          setUnlockedModes(JSON.parse(modesResult.value));
        }
      } catch (e) {
        console.log('No saved modes yet');
      }

      try {
        const scoresResult = await window.storage.get('high-scores');
        if (scoresResult) {
          setHighScores(JSON.parse(scoresResult.value));
        }
      } catch (e) {
        console.log('No saved scores yet');
      }

      try {
        const customResult = await window.storage.get('snake-customization');
        if (customResult) {
          const custom = JSON.parse(customResult.value);
          setSnakeColor(custom.color || 'green');
          setSnakePattern(custom.pattern || 'squares');
        }
      } catch (e) {
        console.log('No saved customization yet');
      }

      try {
        const starResult = await window.storage.get('star-points');
        if (starResult) {
          setStarPoints(parseFloat(starResult.value));
        }
      } catch (e) {
        console.log('No saved star points yet');
      }

      try {
        const patternsResult = await window.storage.get('unlocked-patterns');
        if (patternsResult) {
          setUnlockedPatterns(JSON.parse(patternsResult.value));
        }
      } catch (e) {
        console.log('No saved patterns yet');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination();
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (slowdownTimerRef.current) {
        clearTimeout(slowdownTimerRef.current);
      }
      if (speedBoostTimerRef.current) {
        clearTimeout(speedBoostTimerRef.current);
      }
    };
  }, []);

  const playEatSound = () => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease("C5", "0.1");
    }
  };

  const playLifeSound = () => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease("C5", "0.08", Tone.now());
      synthRef.current.triggerAttackRelease("E5", "0.08", Tone.now() + 0.08);
      synthRef.current.triggerAttackRelease("G5", "0.08", Tone.now() + 0.16);
      synthRef.current.triggerAttackRelease("C6", "0.12", Tone.now() + 0.24);
      synthRef.current.triggerAttackRelease("E6", "0.15", Tone.now() + 0.36);
    }
  };

  const playGameOverSound = () => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease("C4", "0.2", Tone.now());
      synthRef.current.triggerAttackRelease("G3", "0.2", Tone.now() + 0.15);
      synthRef.current.triggerAttackRelease("E3", "0.4", Tone.now() + 0.3);
    }
  };

  const playUnlockSound = () => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease("C5", "0.1");
      setTimeout(() => synthRef.current.triggerAttackRelease("E5", "0.1"), 100);
      setTimeout(() => synthRef.current.triggerAttackRelease("G5", "0.2"), 200);
    }
  };

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE)
      ];
    } while (snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]));
    return newFood;
  }, [snake]);

  const getInitialSpeed = (mode) => {
    if (mode === 'speed') return INITIAL_SPEED / 1.30; // 130% speed
    if (mode === 'endless-speedy') return INITIAL_SPEED / 1.50; // 150% speed
    if (mode === 'hard' || mode === 'endless-hard') return INITIAL_SPEED / 1.45; // 145% speed
    if (mode === 'uncompromising') return INITIAL_SPEED / 1.75; // 175% speed
    return INITIAL_SPEED;
  };

  const resetGame = () => {
    const initialSpeed = getInitialSpeed(gameMode);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood([5, 5]);
    setScore(0);
    setLives(0);
    setGameOver(false);
    setShowRevive(false);
    setIsPlaying(true);
    setCurrentSpeed(initialSpeed);
    setIsSlowdown(false);
    setIsSpeedBoost(false);
    setLastStarCheck(0);
    if (slowdownTimerRef.current) {
      clearTimeout(slowdownTimerRef.current);
    }
    if (speedBoostTimerRef.current) {
      clearTimeout(speedBoostTimerRef.current);
    }
  };

  const startGame = (mode) => {
    setGameMode(mode);
    const initialSpeed = getInitialSpeed(mode);
    setCurrentSpeed(initialSpeed);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood([5, 5]);
    setScore(0);
    setLives(0);
    setGameOver(false);
    setShowRevive(false);
    setIsPlaying(true);
    setIsSlowdown(false);
    setIsSpeedBoost(false);
    setLastStarCheck(0);
    setGameState('playing');
  };

  const quitToMenu = () => {
    setGameState('menu');
    setGameOver(false);
    setIsPlaying(false);
  };

  const unlockMode = async (mode) => {
    if (!unlockedModes.includes(mode)) {
      const newModes = [...unlockedModes, mode];
      setUnlockedModes(newModes);
      playUnlockSound();
      try {
        await window.storage.set('unlocked-modes', JSON.stringify(newModes));
      } catch (e) {
        console.error('Failed to save unlocked modes');
      }
    }
  };

  const updateHighScore = async (mode, newScore) => {
    if (newScore > highScores[mode]) {
      const newHighScores = { ...highScores, [mode]: newScore };
      setHighScores(newHighScores);
      try {
        await window.storage.set('high-scores', JSON.stringify(newHighScores));
      } catch (e) {
        console.error('Failed to save high scores');
      }
    }
  };

  const handleDirectionChange = (newDir) => {
    if (!isPlaying && gameState === 'playing') {
      setIsPlaying(true);
    }
    
    if (newDir.x !== 0 && direction.x === 0) {
      setDirection(newDir);
    } else if (newDir.y !== 0 && direction.y === 0) {
      setDirection(newDir);
    }
  };

  const handleSpacePress = () => {
    if (showRevive && lives > 0) {
      setLives(l => l - 1);
      setShowRevive(false);
      setSnake(INITIAL_SNAKE);
      setDirection(INITIAL_DIRECTION);
    } else if (gameOver) {
      resetGame();
    }
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying || showRevive) return;

    const newSnake = [...snake];
    const head = newSnake[0];
    const newHead = [head[0] + direction.x, head[1] + direction.y];

    if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
      if (lives > 0) {
        setShowRevive(true);
        return;
      }
      playGameOverSound();
      setGameOver(true);
      setIsPlaying(false);
      updateHighScore(gameMode, score);
      return;
    }

    if (newSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
      if (lives > 0) {
        setShowRevive(true);
        return;
      }
      playGameOverSound();
      setGameOver(true);
      setIsPlaying(false);
      updateHighScore(gameMode, score);
      return;
    }

    newSnake.unshift(newHead);

    if (newHead[0] === food[0] && newHead[1] === food[1]) {
      const newScore = score + 10;
      setScore(newScore);
      playEatSound();
      
      // Check for star points every 250 points
      if (Math.floor(newScore / 250) > Math.floor(lastStarCheck / 250)) {
        const earnedStars = Math.floor(newScore / 250) - Math.floor(lastStarCheck / 250);
        setStarPoints(prev => {
          const newTotal = prev + earnedStars;
          window.storage.set('star-points', newTotal.toString()).catch(e => console.error('Failed to save star points'));
          return newTotal;
        });
        setLastStarCheck(newScore);
      }
      
      let lifeThreshold = 150;
      if (gameMode === 'hard' || gameMode === 'endless-hard') {
        lifeThreshold = 200;
      } else if (gameMode === 'endless-classic') {
        lifeThreshold = 200;
      } else if (gameMode === 'uncompromising') {
        lifeThreshold = 350;
      }
      
      if (Math.floor(newScore / lifeThreshold) > Math.floor(score / lifeThreshold)) {
        setLives(l => l + 1);
        playLifeSound();
      }

      if (gameMode === 'classic' && newScore >= 3000) {
        unlockMode('speed');
      }

      if (gameMode === 'speed' && newScore >= 100) {
        unlockMode('hard');
      }

      if (gameMode === 'hard' && newScore >= 7500) {
        unlockMode('endless-classic');
        unlockMode('endless-speedy');
        unlockMode('endless-hard');
      }

      if (gameMode === 'endless-hard' && newScore >= 10000) {
        unlockMode('uncompromising');
      }

      if (gameMode === 'speed' || gameMode === 'endless-speedy') {
        const speedUpIncrement = 50;
        const speedUpPercent = gameMode === 'endless-speedy' ? 0.90 : 0.95;
        
        if (Math.floor(newScore / speedUpIncrement) > Math.floor(score / speedUpIncrement)) {
          setCurrentSpeed(prevSpeed => prevSpeed * speedUpPercent);
        }

        if (Math.floor(newScore / 200) > Math.floor(score / 200)) {
          const savedSpeed = currentSpeed * speedUpPercent;
          setCurrentSpeed(INITIAL_SPEED);
          setIsSlowdown(true);
          
          if (slowdownTimerRef.current) {
            clearTimeout(slowdownTimerRef.current);
          }
          
          slowdownTimerRef.current = setTimeout(() => {
            setCurrentSpeed(savedSpeed);
            setIsSlowdown(false);
          }, 7000);
        }
      }

      if (gameMode === 'hard' || gameMode === 'endless-hard') {
        const boostInterval = gameMode === 'hard' ? 800 : 700;
        
        if (Math.floor(newScore / boostInterval) > Math.floor(score / boostInterval)) {
          const savedSpeed = currentSpeed;
          setCurrentSpeed(INITIAL_SPEED / 2); // 200% speed
          setIsSpeedBoost(true);
          
          if (speedBoostTimerRef.current) {
            clearTimeout(speedBoostTimerRef.current);
          }
          
          speedBoostTimerRef.current = setTimeout(() => {
            setCurrentSpeed(savedSpeed);
            setIsSpeedBoost(false);
          }, 6000);
        }
      }

      if (gameMode === 'uncompromising') {
        if (Math.floor(newScore / 250) > Math.floor(score / 250)) {
          const savedSpeed = currentSpeed;
          setCurrentSpeed(INITIAL_SPEED / 2.5); // 250% speed
          setIsSpeedBoost(true);
          
          if (speedBoostTimerRef.current) {
            clearTimeout(speedBoostTimerRef.current);
          }
          
          speedBoostTimerRef.current = setTimeout(() => {
            setCurrentSpeed(savedSpeed);
            setIsSpeedBoost(false);
          }, 6000);
        }

        // Check for completion at 10,000 points
        if (newScore >= 10000 && score < 10000) {
          setGameOver(true);
          setIsPlaying(false);
          updateHighScore(gameMode, newScore);
          // Show victory message
          setTimeout(() => {
            alert('🎉 UNCOMPROMISING MODE COMPLETED! YOU ARE A LEGEND! 🎉');
          }, 100);
          return;
        }
      }
      
      setFood(generateFood());
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, gameOver, isPlaying, generateFood, score, lives, gameMode, currentSpeed, showRevive]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleSpacePress();
        return;
      }

      if (!isPlaying && e.key.startsWith('Arrow')) {
        setIsPlaying(true);
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isPlaying, gameOver, showRevive, lives, gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(moveSnake, currentSpeed);
    return () => clearInterval(interval);
  }, [moveSnake, gameState, currentSpeed]);

  if (gameState === 'customize') {
    const saveCustomization = async () => {
      try {
        await window.storage.set('snake-customization', JSON.stringify({
          color: snakeColor,
          pattern: snakePattern
        }));
      } catch (e) {
        console.error('Failed to save customization');
      }
      setGameState('menu');
    };

    const unlockPattern = async (patternName) => {
      const pattern = PATTERNS[patternName];
      if (starPoints >= pattern.cost && !unlockedPatterns.includes(patternName)) {
        const newStarPoints = starPoints - pattern.cost;
        setStarPoints(newStarPoints);
        const newUnlocked = [...unlockedPatterns, patternName];
        setUnlockedPatterns(newUnlocked);
        
        try {
          await window.storage.set('star-points', newStarPoints.toString());
          await window.storage.set('unlocked-patterns', JSON.stringify(newUnlocked));
          playUnlockSound();
        } catch (e) {
          console.error('Failed to save unlock');
        }
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <svg className="w-24 h-24 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-purple-400 mb-2">Customize Snake</h1>
            <p className="text-xl text-gray-400">Make it your own!</p>
            <div className="mt-4 inline-block bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg font-bold text-xl">
              ⭐ Star Points: {starPoints}
            </div>
            <p className="text-sm text-gray-400 mt-2">Earn 1 ⭐ every 250 in-game points</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500 mb-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Snake Color</h2>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {Object.entries(COLORS).map(([colorName, colorValue]) => (
                <button
                  key={colorName}
                  onClick={() => setSnakeColor(colorName)}
                  className={`h-16 rounded-lg border-4 transition ${
                    snakeColor === colorName ? 'border-white scale-110' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: colorValue }}
                >
                  <span className="text-white font-bold text-xs capitalize">{colorName}</span>
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-purple-400 mb-4">Snake Pattern</h2>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(PATTERNS).map(([patternName, patternData]) => {
                const isUnlocked = unlockedPatterns.includes(patternName);
                const canAfford = starPoints >= patternData.cost;
                
                return (
                  <button
                    key={patternName}
                    onClick={() => {
                      if (isUnlocked) {
                        setSnakePattern(patternName);
                      } else if (canAfford) {
                        unlockPattern(patternName);
                      }
                    }}
                    className={`h-20 rounded-lg border-4 transition flex flex-col items-center justify-center relative ${
                      snakePattern === patternName ? 'border-white scale-110 bg-gray-700' : 
                      isUnlocked ? 'border-gray-600 bg-gray-800 hover:bg-gray-700' :
                      canAfford ? 'border-yellow-500 bg-gray-800 hover:bg-gray-700' :
                      'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed'
                    }`}
                    disabled={!isUnlocked && !canAfford}
                  >
                    <div className="text-3xl mb-1">{patternData.symbol}</div>
                    <div className="text-xs text-gray-300 capitalize">{patternData.name}</div>
                    {!isUnlocked && (
                      <div className="text-xs text-yellow-400 mt-1 font-bold">
                        {canAfford ? `⭐${patternData.cost}` : `🔒 ⭐${patternData.cost}`}
                      </div>
                    )}
                    {isUnlocked && patternData.cost > 0 && (
                      <div className="absolute top-1 right-1 text-green-400 text-xs">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500 mb-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Preview</h2>
            <div className="flex justify-center items-center space-x-2">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-12 h-12 rounded flex items-center justify-center text-2xl"
                  style={{ backgroundColor: COLORS[snakeColor] }}
                >
                  {PATTERNS[snakePattern].symbol}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={saveCustomization}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Save & Return
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8 relative">
            <SnakeLogo />
            <h1 className="text-6xl font-bold text-green-400 mb-2">SNAKE</h1>
            <p className="text-xl text-gray-400">Classic Arcade Game</p>
            
            <button
              onClick={() => setGameState('customize')}
              className="absolute top-0 right-0 bg-purple-600 hover:bg-purple-700 p-3 rounded-lg transition group"
              title="Customize Snake"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="text-xs text-white mt-1 opacity-0 group-hover:opacity-100 transition">Customize</p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500">
              <h2 className="text-2xl font-bold text-green-400 mb-4">Details</h2>
              <div className="text-gray-300 space-y-3">
                <div>
                  <p className="font-semibold text-white">Controls:</p>
                  <p>Arrow Keys - Move snake</p>
                  <p>Space - Use life / Restart</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Scoring:</p>
                  <p>+10 points per food</p>
                  <p>Earn 1 life every 150 points</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Unlocks:</p>
                  <p className="text-sm">Classic 3000pts → Speed Mode</p>
                  <p className="text-sm">Hard 7500pts → Endless Modes</p>
                </div>
                <div>
                  <p className="font-semibold text-white">High Scores:</p>
                  <p className="text-sm">Classic: {highScores.classic}</p>
                  <p className="text-sm">Speed: {highScores.speed}</p>
                  <p className="text-sm">Hard: {highScores.hard}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500">
              <h2 className="text-2xl font-bold text-green-400 mb-4">Game Modes</h2>
              <div className="space-y-3">
                <button
                  onClick={() => startGame('classic')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  <div className="flex justify-between items-center">
                    <span>Classic Mode</span>
                    <span className="text-sm">✓</span>
                  </div>
                </button>
                
                <button
                  onClick={() => unlockedModes.includes('speed') && startGame('speed')}
                  className={`w-full font-bold py-3 px-6 rounded-lg transition ${
                    unlockedModes.includes('speed')
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!unlockedModes.includes('speed')}
                >
                  <div className="flex justify-between items-center">
                    <span>Speed Mode</span>
                    {unlockedModes.includes('speed') ? (
                      <span className="text-sm">✓</span>
                    ) : (
                      <span className="text-xs">🔒 3000pts</span>
                    )}
                  </div>
                  {unlockedModes.includes('speed') && (
                    <p className="text-xs mt-1 text-left">130% start • +5% every 50pts • 7s slowdown/200pts</p>
                  )}
                </button>

                <button
                  onClick={() => unlockedModes.includes('hard') && startGame('hard')}
                  className={`w-full font-bold py-3 px-6 rounded-lg transition ${
                    unlockedModes.includes('hard')
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!unlockedModes.includes('hard')}
                >
                  <div className="flex justify-between items-center">
                    <span>Hard Mode</span>
                    {unlockedModes.includes('hard') ? (
                      <span className="text-sm">✓</span>
                    ) : (
                      <span className="text-xs">🔒 Complete Speed</span>
                    )}
                  </div>
                  {unlockedModes.includes('hard') && (
                    <p className="text-xs mt-1 text-left">145% start • 200pts/life • 200% boost/800pts (6s)</p>
                  )}
                </button>
                
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <p className="text-green-400 font-semibold mb-2 text-sm">Endless Modes</p>
                  
                  <button
                    onClick={() => unlockedModes.includes('endless-classic') && startGame('endless-classic')}
                    className={`w-full font-bold py-2 px-4 rounded-lg transition mb-2 ${
                      unlockedModes.includes('endless-classic')
                        ? 'bg-green-700 hover:bg-green-800 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!unlockedModes.includes('endless-classic')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Classic Endless</span>
                      {unlockedModes.includes('endless-classic') ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <span className="text-xs">🔒</span>
                      )}
                    </div>
                    {unlockedModes.includes('endless-classic') && (
                      <p className="text-xs mt-1 text-left">200pts/life</p>
                    )}
                  </button>
                  
                  <button
                    onClick={() => unlockedModes.includes('endless-speedy') && startGame('endless-speedy')}
                    className={`w-full font-bold py-2 px-4 rounded-lg transition mb-2 ${
                      unlockedModes.includes('endless-speedy')
                        ? 'bg-yellow-700 hover:bg-yellow-800 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!unlockedModes.includes('endless-speedy')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Speedy Endless</span>
                      {unlockedModes.includes('endless-speedy') ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <span className="text-xs">🔒</span>
                      )}
                    </div>
                    {unlockedModes.includes('endless-speedy') && (
                      <p className="text-xs mt-1 text-left">150% start • +10% every 50pts</p>
                    )}
                  </button>
                  
                  <button
                    onClick={() => unlockedModes.includes('endless-hard') && startGame('endless-hard')}
                    className={`w-full font-bold py-2 px-4 rounded-lg transition ${
                      unlockedModes.includes('endless-hard')
                        ? 'bg-orange-700 hover:bg-orange-800 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!unlockedModes.includes('endless-hard')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hard Endless</span>
                      {unlockedModes.includes('endless-hard') ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <span className="text-xs">🔒</span>
                      )}
                    </div>
                    {unlockedModes.includes('endless-hard') && (
                      <p className="text-xs mt-1 text-left">145% start • 200% boost/700pts</p>
                    )}
                  </button>
                  
                  {!unlockedModes.includes('endless-classic') && (
                    <p className="text-xs text-gray-500 mt-2">Unlock at Hard Mode 7500pts</p>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-3 mt-3">
                  <p className="text-red-400 font-semibold mb-2 text-sm">Ultimate Challenge</p>
                  
                  <button
                    onClick={() => unlockedModes.includes('uncompromising') && startGame('uncompromising')}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition ${
                      unlockedModes.includes('uncompromising')
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!unlockedModes.includes('uncompromising')}
                  >
                    <div className="flex justify-between items-center">
                      <span>Uncompromising Mode</span>
                      {unlockedModes.includes('uncompromising') ? (
                        <span className="text-sm">✓</span>
                      ) : (
                        <span className="text-xs">🔒 Endless Hard 10k</span>
                      )}
                    </div>
                    {unlockedModes.includes('uncompromising') && (
                      <p className="text-xs mt-1 text-left">175% start • 350pts/life • 250% boost/250pts • WIN at 10000pts!</p>
                    )}
                  </button>
                  
                  {!unlockedModes.includes('uncompromising') && (
                    <p className="text-xs text-gray-500 mt-2">Unlock at Endless Hard 10000pts</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">Press ESC or close window to quit</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-2">
          {gameMode === 'classic' && 'Classic Mode'}
          {gameMode === 'speed' && 'Speed Mode'}
          {gameMode === 'hard' && 'Hard Mode'}
          {gameMode === 'endless-classic' && 'Classic Endless'}
          {gameMode === 'endless-speedy' && 'Speedy Endless'}
          {gameMode === 'endless-hard' && 'Hard Endless'}
          {gameMode === 'uncompromising' && '💀 UNCOMPROMISING MODE 💀'}
        </h1>
        <p className="text-xl text-white">Score: {score}</p>
        {gameMode === 'uncompromising' && (
          <p className="text-lg text-red-400 mt-1">Goal: 10000 pts to WIN!</p>
        )}
        <p className="text-lg text-yellow-400 mt-1">Lives: {lives} 💛</p>
        {(gameMode === 'speed' || gameMode === 'endless-speedy') && isSlowdown && (
          <p className="text-lg text-blue-400 mt-1">⏱️ SLOWDOWN ACTIVE!</p>
        )}
        {(gameMode === 'hard' || gameMode === 'endless-hard') && isSpeedBoost && (
          <p className="text-lg text-red-400 mt-1">⚡ SPEED BOOST! 200%</p>
        )}
        {gameMode === 'uncompromising' && isSpeedBoost && (
          <p className="text-lg text-red-400 mt-1">⚡ EXTREME BOOST! 250%</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-2">
        <div 
          className="relative bg-gray-800 border-4 border-green-500"
          style={{ 
            width: GRID_SIZE * CELL_SIZE, 
            height: GRID_SIZE * CELL_SIZE 
          }}
        >
          {snake.map((segment, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{
                position: 'absolute',
                left: segment[0] * CELL_SIZE,
                top: segment[1] * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: COLORS[snakeColor],
                borderRadius: i === 0 ? '4px' : '2px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: snakeColor === 'black' ? 'white' : snakeColor === 'yellow' ? 'black' : 'white'
              }}
            >
              {PATTERNS[snakePattern].symbol}
            </div>
          ))}

          <div
            className="bg-red-500 rounded-full"
            style={{
              position: 'absolute',
              left: food[0] * CELL_SIZE + 2,
              top: food[1] * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          />

          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <p className="text-white text-xl">Press Arrow Key to Start</p>
            </div>
          )}

          {showRevive && lives > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
              <div className="text-center">
                <p className="text-yellow-400 text-3xl font-bold mb-4">💛 Second Chance! 💛</p>
                <p className="text-white text-xl mb-4">Use a life to continue?</p>
                <button
                  onClick={() => {
                    setLives(l => l - 1);
                    setShowRevive(false);
                    setSnake(INITIAL_SNAKE);
                    setDirection(INITIAL_DIRECTION);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded"
                >
                  Use Life (Press Space)
                </button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
              <div className="text-center">
                {gameMode === 'uncompromising' && score >= 10000 ? (
                  <>
                    <p className="text-yellow-400 text-4xl font-bold mb-4">🎉 VICTORY! 🎉</p>
                    <p className="text-green-400 text-2xl mb-4">YOU CONQUERED UNCOMPROMISING MODE!</p>
                    <p className="text-white text-xl mb-4">Final Score: {score}</p>
                  </>
                ) : (
                  <>
                    <p className="text-red-400 text-3xl font-bold mb-4">Game Over!</p>
                    <p className="text-white text-xl mb-4">Final Score: {score}</p>
                    {score > highScores[gameMode] && (
                      <p className="text-yellow-400 text-lg mb-4">🏆 NEW HIGH SCORE! 🏆</p>
                    )}
                  </>
                )}
                <div className="space-x-4">
                  <button
                    onClick={resetGame}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={quitToMenu}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded"
                  >
                    Main Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-3 border-2 border-green-500 w-48 flex-shrink-0">
          <p className="text-center text-gray-400 text-xs mb-2">Controls</p>
          <div className="grid grid-cols-3 gap-1">
            <div className="col-start-2">
              <button
                onTouchStart={() => handleDirectionChange({ x: 0, y: -1 })}
                onClick={() => handleDirectionChange({ x: 0, y: -1 })}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2 rounded text-sm"
              >
                ▲
              </button>
            </div>
            <div className="col-start-1 col-span-1">
              <button
                onTouchStart={() => handleDirectionChange({ x: -1, y: 0 })}
                onClick={() => handleDirectionChange({ x: -1, y: 0 })}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2 rounded text-sm"
              >
                ◀
              </button>
            </div>
            <div className="col-start-2">
              <button
                onTouchStart={handleSpacePress}
                onClick={handleSpacePress}
                className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-bold py-2 rounded text-xs"
              >
                SPC
              </button>
            </div>
            <div className="col-start-3">
              <button
                onTouchStart={() => handleDirectionChange({ x: 1, y: 0 })}
                onClick={() => handleDirectionChange({ x: 1, y: 0 })}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2 rounded text-sm"
              >
                ▶
              </button>
            </div>
            <div className="col-start-2">
              <button
                onTouchStart={() => handleDirectionChange({ x: 0, y: 1 })}
                onClick={() => handleDirectionChange({ x: 0, y: 1 })}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2 rounded text-sm"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={quitToMenu}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
