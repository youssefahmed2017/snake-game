// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
function Game() {

  // 👇 paste your code BELOW THIS LINE


const GRID_SIZE = 20;
const CELL_SIZE_DESKTOP = 20;
const CELL_SIZE_MOBILE = 14;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 150;

const FRUIT_TYPES = {
  normal: { points: 10, color: '#ef4444' },
  double: { points: 20, color: '#dc2626' },
  slow:   { points: 10, color: '#eab308', effect: 'slow' },
  mini:   { points: 10, color: '#22c55e', effect: 'shrink' },
  hot:    { points: 10, color: '#f97316', effect: 'speed' },
  star:   { points: 10, color: '#fbbf24', effect: 'star' }
};

const ACHIEVEMENTS = [
  { id: 'complete-classic',        name: 'Complete Classic',   desc: 'Reach 3000 pts in Classic',       reward: 3,  check: (s: any) => s.classic >= 3000},
  { id: 'complete-speed',          name: 'Speed Demon',        desc: 'Reach 3500 pts in Speed',          reward: 3,  check: (s: any) => s.speed >= 3500 },
  { id: 'hard-2000',               name: 'Hard Mode Master',   desc: 'Reach 2000 pts in Hard',           reward: 3,  check: (s: any) => s.hard >= 2000 },
  { id: 'endless-5000',            name: 'Endless Warrior',    desc: 'Reach 5000 pts in any Endless',   reward: 4,  check: (s: any) => s['endless-classic'] >= 5000 || s['endless-speedy'] >= 5000 || s['endless-hard'] >= 5000 },
  { id: 'uncompromising-complete', name: 'The Uncompromising', desc: 'Complete Uncompromising Mode',     reward: 10, check: (s: any) => s.uncompromising >= 10000 },
  { id: 'buy-3-colors',            name: 'Colorful Snake',     desc: 'Unlock 3 paid colors',             reward: 1,  check: (_, u) => u.colors.filter(c => COLORS[c] && COLORS[c].cost > 0).length >= 3 },
  { id: 'buy-5-patterns',          name: 'Pattern Master',     desc: 'Unlock 5 paid patterns',           reward: 2,  check: (_, u) => u.patterns.filter(p => PATTERNS[p] && PATTERNS[p].cost > 0).length >= 5 },
  { id: 'collector',               name: 'The Collector',      desc: 'Unlock all colors and patterns',   reward: 5,  check: (_, u) => u.colors.length === Object.keys(COLORS).length && u.patterns.length === Object.keys(PATTERNS).length }
];

const COLORS = {
  red:      { value: '#ef4444', cost: 0,    name: 'Red',      textColor: 'white' },
  yellow:   { value: '#eab308', cost: 0,    name: 'Yellow',   textColor: 'black' },
  blue:     { value: '#3b82f6', cost: 0,    name: 'Blue',     textColor: 'white' },
  green:    { value: '#10b981', cost: 0,    name: 'Green',    textColor: 'white' },
  white:    { value: '#f3f4f6', cost: 2,    name: 'White',    textColor: 'black' },
  pink:     { value: '#ec4899', cost: 2.5,  name: 'Pink',     textColor: 'white' },
  purple:   { value: '#a855f7', cost: 3,    name: 'Purple',   textColor: 'white' },
  gray:     { value: '#6b7280', cost: 3.5,  name: 'Gray',     textColor: 'white' },
  gradient: { value: 'linear-gradient(135deg,#3b82f6 0%,#a855f7 50%,#f3f4f6 100%)', cost: 15, name: 'Legendary', textColor: 'white', isGradient: true }
};

const PATTERNS = {
  squares:    { symbol: '■', cost: 0,    name: 'Squares' },
  rectangles: { symbol: '▬', cost: 0,    name: 'Rect.' },
  triangles:  { symbol: '▲', cost: 0,    name: 'Tri.' },
  stars:      { symbol: '★', cost: 3,    name: 'Stars' },
  pentagon:   { symbol: '⬟', cost: 4.5,  name: 'Pent.' },
  hexagon:    { symbol: '⬡', cost: 5,    name: 'Hex.' },
  heptagon:   { symbol: '⬢', cost: 6,    name: 'Hept.' },
  octagon:    { symbol: '⯃', cost: 6.3,  name: 'Oct.' },
  nonagon:    { symbol: '⬣', cost: 7.3,  name: 'Non.' },
  decagon:    { symbol: '⬤', cost: 8,    name: 'Dec.' },
  freeze:     { symbol: '❄', cost: 12.5, name: 'Freeze' }
};

const THEMES = {
  default: { name: 'Default', bg: '#1f2937', border: '#10b981', glowSnake: false },
  dark:    { name: 'Dark',    bg: '#0a0a0a', border: '#1f1f1f', glowSnake: true, glowColor: '#4ade80' },
  ice:     { name: 'Ice',     bg: '#cffafe', border: '#06b6d4', glowSnake: true, glowColor: '#67e8f9' },
  desert:  { name: 'Desert',  bg: '#fef3c7', border: '#f59e0b', glowSnake: true, glowColor: '#fbbf24' },
  space:   { name: 'Space',   bg: '#1e1b4b', border: '#8b5cf6', glowSnake: true, glowColor: '#c084fc' },
  neon:    { name: 'Neon',    bg: '#000000', border: '#0ff',    glowSnake: true, glowColor: '#0ff', neonGrid: true }
};

const MODES = [
  { mode: 'classic',         label: 'Classic',        bg: '#22c55e', always: true },
  { mode: 'speed',           label: 'Speed',           bg: '#e05a1a', lockDesc: '3000 pts in Classic' },
  { mode: 'hard',            label: 'Hard',            bg: '#ef4444', lockDesc: '3500 pts in Speed' },
  { mode: 'endless-classic', label: 'Endless Classic', bg: '#14532d', lockDesc: '7500 pts in Hard' },
  { mode: 'endless-speedy',  label: 'Endless Speedy',  bg: '#7c2d06', lockDesc: '7500 pts in Hard' },
  { mode: 'endless-hard',    label: 'Endless Hard',    bg: '#7f1d1d', lockDesc: '7500 pts in Hard' },
  { mode: 'uncompromising',  label: 'Uncompromising',  bg: '#ff0000', lockDesc: '10000 pts in Endless Hard' },
  { mode: 'crazy-fruits',    label: 'Crazy Fruits',    bg: '#9333ea', lockDesc: 'Complete Uncompromising' },
];

const ArrowUp    = () => <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><polygon points="12,3 22,21 2,21"/></svg>;
const ArrowDown  = () => <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><polygon points="12,21 2,3 22,3"/></svg>;
const ArrowLeft  = () => <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><polygon points="3,12 21,2 21,22"/></svg>;
const ArrowRight = () => <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><polygon points="21,12 3,2 3,22"/></svg>;

export default function SnakeGame() {
  const [deviceType, setDeviceType]       = useState(null);
  const [gameState, setGameState]         = useState('menu');
  const [gameMode, setGameMode]           = useState('classic');
  const [snake, setSnake]                 = useState(INITIAL_SNAKE);
  const [food, setFood]                   = useState([5, 5]);
  const [direction, setDirection]         = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver]           = useState(false);
  const [score, setScore]                 = useState(0);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [lives, setLives]                 = useState(0);
  const [showRevive, setShowRevive]       = useState(false);
  const [currentSpeed, setCurrentSpeed]   = useState(INITIAL_SPEED);
  const [isSlowdown, setIsSlowdown]       = useState(false);
  const [isSpeedBoost, setIsSpeedBoost]   = useState(false);
  const [unlockedModes, setUnlockedModes] = useState(['classic']);
  const [highScores, setHighScores]       = useState({ classic:0, speed:0, hard:0, 'endless-classic':0, 'endless-speedy':0, 'endless-hard':0, uncompromising:0, 'crazy-fruits':0 });
  const [snakeColor, setSnakeColor]       = useState('green');
  const [snakePattern, setSnakePattern]   = useState('squares');
  const [theme, setTheme]                 = useState('default');
  const [starPoints, setStarPoints]       = useState(0);
  const [unlockedPatterns, setUnlockedPatterns] = useState(['squares', 'rectangles', 'triangles']);
  const [unlockedColors, setUnlockedColors]     = useState(['red', 'yellow', 'blue', 'green']);
  const [unlockedThemes, setUnlockedThemes]     = useState(['default']);
  const [lastStarCheck, setLastStarCheck]       = useState(0);
  const [currentFruitType, setCurrentFruitType] = useState('normal');
  const [fruitEffectActive, setFruitEffectActive] = useState(null);
  const [achievements, setAchievements]   = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [isPaused, setIsPaused]           = useState(false);
  const [mobilePanel, setMobilePanel]     = useState(null);

  const isMobile  = deviceType === 'mobile';
  const CELL_SIZE = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
  const gridPx    = GRID_SIZE * CELL_SIZE;

  const synthRef            = useRef(null);
  const musicSynthRef       = useRef(null);
  const musicLoopRef        = useRef(null);
  const slowdownTimerRef    = useRef(null);
  const speedBoostTimerRef  = useRef(null);
  const fruitEffectTimerRef = useRef(null);
  const touchStartRef       = useRef(null);

  useEffect(() => {
    const load = async () => {
      const pairs = [
        ['unlocked-modes',      (v) => setUnlockedModes(JSON.parse(v))],
        ['high-scores',         (v) => setHighScores(JSON.parse(v))],
        ['snake-customization', (v) => { const c = JSON.parse(v); setSnakeColor(c.color || 'green'); setSnakePattern(c.pattern || 'squares'); setTheme(c.theme || 'default'); }],
        ['star-points',         (v) => setStarPoints(parseFloat(v))],
        ['unlocked-patterns',   (v) => setUnlockedPatterns(JSON.parse(v))],
        ['unlocked-colors',     (v) => setUnlockedColors(JSON.parse(v))],
        ['unlocked-themes',     (v) => setUnlockedThemes(JSON.parse(v))],
        ['achievements',        (v) => setAchievements(JSON.parse(v))],
      ];
      for (const [k, fn] of pairs) {
        try { const r = await window.storage.get(k); if (r) fn(r.value); } catch (e) {}
      }
    };
    load();
  }, []);

  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination();
    musicSynthRef.current = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 }
    }).toDestination();
    musicSynthRef.current.volume.value = -12;
    return () => {
      if (synthRef.current) synthRef.current.dispose();
      if (musicSynthRef.current) musicSynthRef.current.dispose();
      if (musicLoopRef.current) { musicLoopRef.current.stop(); musicLoopRef.current.dispose(); }
      [slowdownTimerRef, speedBoostTimerRef, fruitEffectTimerRef].forEach((r) => { if (r.current) clearTimeout(r.current); });
    };
  }, []);

  const snd = (notes) => {
    if (!synthRef.current) return;
    notes.forEach(([n, d, t]) => synthRef.current.triggerAttackRelease(n, d, Tone.now() + (t || 0)));
  };
  const playEat          = () => snd([['C5', '0.1']]);
  const playLife         = () => snd([['C5','0.08'],['E5','0.08',0.08],['G5','0.08',0.16],['C6','0.12',0.24],['E6','0.15',0.36]]);
  const playDead         = () => snd([['C4','0.2'],['G3','0.2',0.15],['E3','0.4',0.3]]);
  const playStar         = () => snd([['E5','0.08'],['G5','0.08',0.08],['C6','0.12',0.16],['E6','0.15',0.28],['G6','0.2',0.43]]);
  const playUnlock       = () => snd([['C5','0.1'],['E5','0.1',0.1],['G5','0.2',0.2]]);
  const playAch          = () => snd([['C5','0.1'],['E5','0.1',0.1],['G5','0.1',0.2],['C6','0.15',0.3],['E6','0.2',0.45]]);
  const playBuy          = () => snd([['G4','0.07'],['B4','0.07',0.07],['D5','0.07',0.14],['G5','0.12',0.21]]);
  const playModeComplete = () => snd([['C5','0.08'],['E5','0.08',0.08],['G5','0.08',0.16],['C6','0.08',0.24],['E6','0.08',0.32],['G6','0.15',0.40],['C7','0.3',0.55]]);
  const playPause        = () => snd([['A4','0.08'],['E4','0.12',0.09]]);
  const playResume       = () => snd([['E4','0.08'],['A4','0.12',0.09]]);
  const playRevive       = () => snd([['E4','0.08'],['G4','0.08',0.08],['B4','0.12',0.16]]);

  const handlePause = () => {
    if (gameOver || showRevive) return;
    setIsPaused((p) => {
      if (!p) playPause(); else playResume();
      return !p;
    });
  };

  const startMusic = (mode) => {
    if (musicLoopRef.current) { musicLoopRef.current.stop(); musicLoopRef.current.dispose(); }
    const M = {
      classic:          ['C4','E4','G4','E4','C4','G3','C4','E4'],
      speed:            ['E4','G4','A4','G4','E4','D4','E4','G4','A4','B4'],
      hard:             ['A3','C4','E4','F4','E4','D4','C4','A3','G3','A3'],
      'endless-classic':['C4','D4','E4','G4','E4','D4','C4','G3'],
      'endless-speedy': ['E4','F#4','G4','A4','B4','A4','G4','F#4'],
      'endless-hard':   ['A3','B3','C4','D4','E4','F4','E4','D4'],
      uncompromising:   ['D4','F4','A4','C5','A4','F4','D4','C4','D4','F4'],
      'crazy-fruits':   ['E4','G4','B4','D5','B4','G4','E4','D4']
    };
    const T = { classic:'4n', speed:'8n', hard:'8n', 'endless-classic':'4n', 'endless-speedy':'8n', 'endless-hard':'8n', uncompromising:'16n', 'crazy-fruits':'8n' };
    const mel = M[mode] || M.classic;
    const tempo = T[mode] || '4n';
    let i = 0;
    musicLoopRef.current = new Tone.Loop((t) => {
      if (musicSynthRef.current) musicSynthRef.current.triggerAttackRelease(mel[i % mel.length], tempo, t);
      i++;
    }, tempo);
    Tone.Transport.start();
    musicLoopRef.current.start(0);
  };

  const stopMusic = () => {
    if (musicLoopRef.current) musicLoopRef.current.stop();
    Tone.Transport.stop();
  };

  const getInitialSpeed = (m) => {
    const map = { speed: INITIAL_SPEED/1.3, 'endless-speedy': INITIAL_SPEED/1.5, hard: INITIAL_SPEED/1.45, 'endless-hard': INITIAL_SPEED/1.45, uncompromising: INITIAL_SPEED/1.75, 'crazy-fruits': INITIAL_SPEED/1.4 };
    return map[m] || INITIAL_SPEED;
  };

  const generateFood = useCallback(() => {
    let f;
    do { f = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)]; }
    while (snake.some((s) => s[0] === f[0] && s[1] === f[1]));
    if (gameMode === 'crazy-fruits') {
      const r = Math.random();
      setCurrentFruitType(r < 0.5 ? 'normal' : r < 0.65 ? 'double' : r < 0.75 ? 'slow' : r < 0.85 ? 'mini' : r < 0.95 ? 'hot' : 'star');
    } else {
      setCurrentFruitType('normal');
    }
    return f;
  }, [snake, gameMode]);

  const doUnlockMode = async (m) => {
    if (!unlockedModes.includes(m)) {
      const n = [...unlockedModes, m];
      setUnlockedModes(n);
      playUnlock();
      try { await window.storage.set('unlocked-modes', JSON.stringify(n)); } catch (e) {}
    }
  };

  const checkAchievements = async (hs) => {
    const u = { colors: unlockedColors, patterns: unlockedPatterns };
    for (const a of ACHIEVEMENTS) {
      if (!achievements.includes(a.id) && a.check(hs || highScores, u)) {
        const na = [...achievements, a.id];
        setAchievements(na);
        const ns = starPoints + a.reward;
        setStarPoints(ns);
        setShowAchievement(a);
        playAch();
        setTimeout(() => setShowAchievement(null), 4000);
        try {
          await window.storage.set('achievements', JSON.stringify(na));
          await window.storage.set('star-points', ns.toString());
        } catch (e) {}
        break;
      }
    }
  };

  const updateHighScore = async (m, s) => {
    if (s > highScores[m]) {
      const nhs = { ...highScores, [m]: s };
      setHighScores(nhs);
      playModeComplete();
      try { await window.storage.set('high-scores', JSON.stringify(nhs)); } catch (e) {}
      setTimeout(() => checkAchievements(nhs), 500);
    }
  };

  const startGame = (m) => {
    setGameMode(m);
    setCurrentSpeed(getInitialSpeed(m));
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
    setCurrentFruitType('normal');
    setFruitEffectActive(null);
    [slowdownTimerRef, speedBoostTimerRef, fruitEffectTimerRef].forEach((r) => { if (r.current) clearTimeout(r.current); });
    setGameState('playing');
    startMusic(m);
  };

  const resetGame = () => startGame(gameMode);

  const quitToMenu = () => {
    setGameState('menu');
    setGameOver(false);
    setIsPlaying(false);
    setIsPaused(false);
    stopMusic();
  };

  const handleDir = (d) => {
    if (!isPlaying) setIsPlaying(true);
    if (d.x !== 0 && direction.x === 0) setDirection(d);
    else if (d.y !== 0 && direction.y === 0) setDirection(d);
  };

  const handleSpace = () => {
    if (showRevive && lives > 0) {
      playRevive();
      setLives((l) => l - 1);
      setShowRevive(false);
      setSnake(INITIAL_SNAKE);
      setDirection(INITIAL_DIRECTION);
    } else if (gameOver) {
      resetGame();
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) handleDir({ x: dx > 0 ? 1 : -1, y: 0 });
    else handleDir({ x: 0, y: dy > 0 ? 1 : -1 });
    touchStartRef.current = null;
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying || showRevive || isPaused) return;
    const ns = [...snake];
    const head = ns[0];
    const nh = [head[0] + direction.x, head[1] + direction.y];
    if (nh[0] < 0 || nh[0] >= GRID_SIZE || nh[1] < 0 || nh[1] >= GRID_SIZE || ns.some((s) => s[0] === nh[0] && s[1] === nh[1])) {
      if (lives > 0) { setShowRevive(true); return; }
      playDead();
      setGameOver(true);
      setIsPlaying(false);
      updateHighScore(gameMode, score);
      stopMusic();
      return;
    }
    ns.unshift(nh);
    if (nh[0] === food[0] && nh[1] === food[1]) {
      const ft = FRUIT_TYPES[currentFruitType];
      const newScore = score + ft.points;
      setScore(newScore);
      playEat();
      if (gameMode === 'crazy-fruits' && ft.effect) {
        if (ft.effect === 'slow') {
          setCurrentSpeed(INITIAL_SPEED * 1.5);
          setFruitEffectActive('slow');
          fruitEffectTimerRef.current = setTimeout(() => { setCurrentSpeed(currentSpeed); setFruitEffectActive(null); }, 3000);
        } else if (ft.effect === 'shrink') {
          if (ns.length > 3) { ns.pop(); ns.pop(); }
        } else if (ft.effect === 'speed') {
          setCurrentSpeed(currentSpeed * 0.67);
          setFruitEffectActive('speed');
          fruitEffectTimerRef.current = setTimeout(() => { setCurrentSpeed(currentSpeed); setFruitEffectActive(null); }, 3000);
        } else if (ft.effect === 'star') {
          setStarPoints((p) => { const t = p + 1; window.storage.set('star-points', t.toString()).catch(() => {}); return t; });
          playStar();
        }
      }
      if (Math.floor(newScore / 250) > Math.floor(lastStarCheck / 250)) {
        const earned = Math.floor(newScore / 250) - Math.floor(lastStarCheck / 250);
        setStarPoints((p) => { const t = p + earned; window.storage.set('star-points', t.toString()).catch(() => {}); return t; });
        setLastStarCheck(newScore);
        playStar();
      }
      const lt = gameMode === 'uncompromising' ? 350 : (gameMode === 'hard' || gameMode === 'endless-hard' || gameMode === 'endless-classic') ? 200 : 150;
      if (Math.floor(newScore / lt) > Math.floor(score / lt)) { setLives((l) => l + 1); playLife(); }
      if (gameMode === 'classic' && newScore >= 3000) {
        doUnlockMode('speed');
        if (!unlockedThemes.includes('dark')) {
          const nt = [...unlockedThemes, 'dark'];
          setUnlockedThemes(nt);
          window.storage.set('unlocked-themes', JSON.stringify(nt)).catch(() => {});
        }
      }
      if (gameMode === 'speed' && newScore >= 3500) doUnlockMode('hard');
      if (gameMode === 'hard' && newScore >= 7500) { doUnlockMode('endless-classic'); doUnlockMode('endless-speedy'); doUnlockMode('endless-hard'); }
      if (gameMode === 'endless-hard' && newScore >= 10000) doUnlockMode('uncompromising');
      if (gameMode === 'uncompromising' && newScore >= 10000) doUnlockMode('crazy-fruits');
      if (gameMode === 'speed' || gameMode === 'endless-speedy') {
        const pct = gameMode === 'endless-speedy' ? 0.9 : 0.95;
        if (Math.floor(newScore / 50) > Math.floor(score / 50)) setCurrentSpeed((s) => s * pct);
        if (Math.floor(newScore / 200) > Math.floor(score / 200)) {
          setCurrentSpeed(INITIAL_SPEED);
          setIsSlowdown(true);
          slowdownTimerRef.current = setTimeout(() => { setCurrentSpeed(currentSpeed); setIsSlowdown(false); }, 7000);
        }
      }
      if (gameMode === 'hard' || gameMode === 'endless-hard') {
        const bi = gameMode === 'hard' ? 800 : 700;
        if (Math.floor(newScore / bi) > Math.floor(score / bi)) {
          setCurrentSpeed(INITIAL_SPEED / 2);
          setIsSpeedBoost(true);
          speedBoostTimerRef.current = setTimeout(() => { setCurrentSpeed(currentSpeed); setIsSpeedBoost(false); }, 6000);
        }
      }
      if (gameMode === 'uncompromising') {
        if (Math.floor(newScore / 250) > Math.floor(score / 250)) {
          setCurrentSpeed(INITIAL_SPEED / 2.5);
          setIsSpeedBoost(true);
          speedBoostTimerRef.current = setTimeout(() => { setCurrentSpeed(currentSpeed); setIsSpeedBoost(false); }, 6000);
        }
        if (newScore >= 10000 && score < 10000) { setGameOver(true); setIsPlaying(false); updateHighScore(gameMode, newScore); stopMusic(); return; }
      }
      setFood(generateFood());
    } else {
      ns.pop();
    }
    setSnake(ns);
  }, [snake, direction, food, gameOver, isPlaying, generateFood, score, lives, gameMode, currentSpeed, showRevive, isPaused, lastStarCheck]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const h = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); handlePause(); return; }
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); quitToMenu(); return; }
      if (e.key === ' ') { e.preventDefault(); handleSpace(); return; }
      if (!isPlaying && e.key.startsWith('Arrow')) setIsPlaying(true);
      if (e.key === 'ArrowUp'    && direction.y === 0) setDirection({ x: 0, y: -1 });
      else if (e.key === 'ArrowDown'  && direction.y === 0) setDirection({ x: 0, y: 1 });
      else if (e.key === 'ArrowLeft'  && direction.x === 0) setDirection({ x: -1, y: 0 });
      else if (e.key === 'ArrowRight' && direction.x === 0) setDirection({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [direction, isPlaying, gameOver, showRevive, lives, gameState, isPaused]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const i = setInterval(moveSnake, currentSpeed);
    return () => clearInterval(i);
  }, [moveSnake, gameState, currentSpeed]);

  const saveCustomization = async () => {
    playBuy();
    try { await window.storage.set('snake-customization', JSON.stringify({ color: snakeColor, pattern: snakePattern, theme })); } catch (e) {}
  };

  const doUnlockItem = async (name, cost, list, setList, storageKey) => {
    if (starPoints >= cost && !list.includes(name)) {
      const ns = starPoints - cost;
      setStarPoints(ns);
      const nl = [...list, name];
      setList(nl);
      playBuy();
      try {
        await window.storage.set('star-points', ns.toString());
        await window.storage.set(storageKey, JSON.stringify(nl));
        playUnlock();
      } catch (e) {}
    }
  };

  const Overlay = ({ children }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">{children}</div>
  );

  const DPad = ({ size = 'w-14 h-14', onUp, onDown, onLeft, onRight, onSpace, onPause, pauseLabel, tablet = false }) => {
    const btn = tablet
      ? (fn, child) => <button onPointerDown={(e) => { e.preventDefault(); fn(); }} onClick={() => fn()} className={`bg-green-600 active:bg-green-800 hover:bg-green-700 font-bold ${size} rounded-lg flex items-center justify-center`}>{child}</button>
      : (fn, child) => <button onPointerDown={(e) => { e.preventDefault(); fn(); }} className={`bg-green-600 active:bg-green-800 font-bold ${size} rounded-lg flex items-center justify-center`}>{child}</button>;
    const spcBtn = tablet
      ? <button onPointerDown={(e) => { e.preventDefault(); onSpace(); }} onClick={() => onSpace()} className={`bg-yellow-500 active:bg-yellow-700 hover:bg-yellow-600 text-white font-bold ${size} rounded-lg text-xs flex items-center justify-center`}>SPC</button>
      : <button onPointerDown={(e) => { e.preventDefault(); onSpace(); }} className={`bg-yellow-500 active:bg-yellow-700 text-white font-bold ${size} rounded-lg text-xs flex items-center justify-center`}>SPC</button>;
    const pauseBtn = tablet
      ? <button onPointerDown={(e) => { e.preventDefault(); onPause(); }} onClick={() => onPause()} className={`bg-blue-600 active:bg-blue-800 hover:bg-blue-700 text-white font-bold ${size} rounded-lg text-xs flex items-center justify-center`}>{pauseLabel}</button>
      : <button onPointerDown={(e) => { e.preventDefault(); onPause(); }} className={`bg-blue-600 active:bg-blue-800 text-white font-bold ${size} rounded-lg text-xs flex items-center justify-center`}>{pauseLabel}</button>;
    return (
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-3 gap-1">
          <div/>{btn(onUp, <ArrowUp/>)}<div/>
          {btn(onLeft, <ArrowLeft/>)}
          {spcBtn}
          {btn(onRight, <ArrowRight/>)}
          <div/>{btn(onDown, <ArrowDown/>)}<div/>
        </div>
        {pauseBtn}
      </div>
    );
  };

  const GameBoard = () => (
    <div
      className="relative rounded"
      style={{ width: gridPx, height: gridPx, backgroundColor: THEMES[theme].bg, border: `3px solid ${THEMES[theme].border}` }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {THEMES[theme].neonGrid && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(${THEMES[theme].border} 1px,transparent 1px),linear-gradient(90deg,${THEMES[theme].border} 1px,transparent 1px)`, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`, opacity: 0.2 }} />
      )}
      {snake.map((seg, i) => (
        <div key={i} className="absolute flex items-center justify-center" style={{ left: seg[0] * CELL_SIZE, top: seg[1] * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE, background: COLORS[snakeColor].value, borderRadius: i === 0 ? '3px' : '2px', fontSize: CELL_SIZE - 4, color: COLORS[snakeColor].textColor === 'black' ? 'black' : 'white', boxShadow: THEMES[theme].glowSnake ? `0 0 10px ${THEMES[theme].glowColor}` : '', zIndex: 10 }}>
          {PATTERNS[snakePattern].symbol}
        </div>
      ))}
      <div className="absolute rounded-full" style={{ left: food[0] * CELL_SIZE + 1, top: food[1] * CELL_SIZE + 1, width: CELL_SIZE - 2, height: CELL_SIZE - 2, backgroundColor: FRUIT_TYPES[currentFruitType].color, zIndex: 10 }} />
      {isPaused && !gameOver && !showRevive && <Overlay><p className="text-white text-2xl font-bold">PAUSED</p></Overlay>}
      {!isPlaying && !gameOver && <Overlay><p className="text-white text-sm">{isMobile ? 'Swipe or tap arrow to start' : 'Press Arrow Key to Start'}</p></Overlay>}
      {showRevive && lives > 0 && (
        <Overlay>
          <div className="text-center p-3">
            <p className="text-yellow-400 text-xl font-bold mb-2">Use a life?</p>
            <button onClick={() => { playRevive(); setLives((l) => l - 1); setShowRevive(false); setSnake(INITIAL_SNAKE); setDirection(INITIAL_DIRECTION); }} className="bg-yellow-500 text-white font-bold py-2 px-5 rounded">Continue</button>
          </div>
        </Overlay>
      )}
      {gameOver && (
        <Overlay>
          <div className="text-center p-3">
            {score >= 10000 && gameMode === 'uncompromising' ? <p className="text-yellow-400 text-2xl font-bold mb-2">VICTORY!</p> : <p className="text-red-400 text-2xl font-bold mb-2">Game Over!</p>}
            <p className="text-white text-lg mb-2">Score: {score}</p>
            {score > highScores[gameMode] && <p className="text-yellow-300 text-sm mb-2">NEW HIGH SCORE!</p>}
            <div className="flex gap-2 justify-center">
              <button onClick={resetGame} className="bg-green-500 text-white font-bold py-2 px-4 rounded">Again</button>
              <button onClick={quitToMenu} className="bg-gray-600 text-white font-bold py-2 px-4 rounded">Menu</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );

  const AchievementsPanel = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b-2 border-yellow-500">
        <h2 className="text-xl font-bold text-yellow-400">Achievements</h2>
        <button onClick={onClose} className="bg-red-600 text-white font-bold w-10 h-10 rounded-lg text-xl flex items-center justify-center">X</button>
      </div>
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {ACHIEVEMENTS.map((a) => {
          const u = achievements.includes(a.id);
          return (
            <div key={a.id} className={`p-3 rounded-lg border-2 flex gap-3 items-start ${u ? 'bg-yellow-900 bg-opacity-30 border-yellow-500' : 'bg-gray-700 border-gray-600'}`}>
              <div className="flex-1">
                <div className={`font-bold text-sm ${u ? 'text-yellow-400' : 'text-gray-400'}`}>{a.name}</div>
                <div className={`text-xs ${u ? 'text-gray-300' : 'text-gray-500'}`}>{a.desc}</div>
                <div className="text-yellow-400 font-bold text-xs mt-1">+{a.reward} star pts</div>
              </div>
              {u && <div className="text-green-400 font-bold">done</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const CustomizePanel = ({ onClose }) => {
    const save = async () => { await saveCustomization(); onClose(); };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b-2 border-purple-500">
          <h2 className="text-xl font-bold text-purple-400">Customize</h2>
          <div className="flex gap-2 items-center">
            <span className="bg-yellow-500 text-gray-900 px-2 py-1 rounded font-bold text-sm">{starPoints} pts</span>
            <button onClick={onClose} className="bg-red-600 text-white font-bold w-10 h-10 rounded-lg text-xl flex items-center justify-center">X</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-3">
          <h3 className="text-purple-400 font-bold mb-2 text-sm">Color</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(COLORS).map(([cn, cd]) => {
              const isU = unlockedColors.includes(cn);
              const can = starPoints >= cd.cost;
              const handleClick = () => {
                if (isU) { setSnakeColor(cn); playBuy(); }
                else if (can) doUnlockItem(cn, cd.cost, unlockedColors, setUnlockedColors, 'unlocked-colors');
              };
              return (
                <button key={cn} onClick={handleClick} disabled={!isU && !can}
                  className={`h-12 rounded border-4 relative transition ${snakeColor === cn ? 'border-white scale-105' : isU ? 'border-gray-600' : can ? 'border-yellow-500' : 'border-gray-700 opacity-50'}`}
                  style={{ background: cd.value }}>
                  <span className={`font-bold text-xs ${cd.textColor === 'black' ? 'text-black' : 'text-white'}`}>{cd.name}</span>
                  {!isU && <div className="absolute bottom-0 left-0 right-0"><span className="text-xs bg-black bg-opacity-70 px-1 rounded text-yellow-400">{can ? `${cd.cost} pts` : `lock ${cd.cost}`}</span></div>}
                </button>
              );
            })}
          </div>
          <h3 className="text-purple-400 font-bold mb-2 text-sm">Pattern</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(PATTERNS).map(([pn, pd]) => {
              const isU = unlockedPatterns.includes(pn);
              const can = starPoints >= pd.cost;
              const handleClick = () => {
                if (isU) { setSnakePattern(pn); playBuy(); }
                else if (can) doUnlockItem(pn, pd.cost, unlockedPatterns, setUnlockedPatterns, 'unlocked-patterns');
              };
              return (
                <button key={pn} onClick={handleClick} disabled={!isU && !can}
                  className={`h-14 rounded border-4 flex flex-col items-center justify-center relative transition ${snakePattern === pn ? 'border-white scale-105 bg-gray-700' : isU ? 'border-gray-600 bg-gray-800' : can ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-900 opacity-50'}`}>
                  <div className="text-xl">{pd.symbol}</div>
                  <div className="text-xs text-gray-300">{pd.name}</div>
                  {!isU && <div className="text-xs text-yellow-400 font-bold">{can ? `${pd.cost} pts` : 'lock'}</div>}
                </button>
              );
            })}
          </div>
          <button onClick={save} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg">Save</button>
        </div>
      </div>
    );
  };

  // ── DEVICE SELECT ──────────────────────────────────────────────────────
  if (!deviceType) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-green-400 mb-2">SNAKE</h1>
        <p className="text-gray-400 text-lg mb-10">What is your device?</p>
        <div className="flex gap-6 justify-center flex-wrap">
          <button onClick={() => setDeviceType('mobile')}   className="bg-blue-600   hover:bg-blue-500   text-white font-bold py-6 px-10 rounded-2xl text-2xl border-4 border-blue-400">Mobile</button>
          <button onClick={() => setDeviceType('tablet')}   className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-10 rounded-2xl text-2xl border-4 border-indigo-400">Tablet</button>
          <button onClick={() => setDeviceType('computer')} className="bg-green-600  hover:bg-green-500  text-white font-bold py-6 px-10 rounded-2xl text-2xl border-4 border-green-400">Computer</button>
        </div>
      </div>
    </div>
  );

  // ── MOBILE MENU ────────────────────────────────────────────────────────
  if (isMobile && gameState === 'menu') return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {mobilePanel === 'achievements' && <AchievementsPanel onClose={() => setMobilePanel(null)} />}
      {mobilePanel === 'customize'    && <CustomizePanel    onClose={() => setMobilePanel(null)} />}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-4xl font-bold text-green-400">SNAKE</h1>
        <p className="text-gray-400 text-sm">{starPoints} star points</p>
        <button onClick={() => setDeviceType(null)} className="mt-1 text-xs text-gray-500 underline">Change device</button>
      </div>
      <div className="flex justify-center gap-3 px-4 mb-3">
        <button onClick={() => setMobilePanel('achievements')} className="bg-yellow-600 active:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Achievements</button>
        <button onClick={() => setMobilePanel('customize')}    className="bg-purple-600 active:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Customize</button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {MODES.map(({ mode, label, bg, always, lockDesc }) => {
          const locked = !always && !unlockedModes.includes(mode);
          return (
            <button key={mode} onClick={() => !locked && startGame(mode)} disabled={locked}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white text-left flex justify-between items-center ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: locked ? '#374151' : bg }}>
              <span>{label}</span>
              {locked && <span className="text-xs opacity-80">Lock: {lockDesc}</span>}
            </button>
          );
        })}
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-green-500 mt-2">
          <h2 className="text-lg font-bold text-green-400 mb-3">Details</h2>
          <div className="text-gray-300 space-y-3 text-xs">
            <div><p className="font-semibold text-white mb-1">Controls</p><p>Swipe or D-pad — Move</p><p>SPC — Use life / Restart</p><p>Pause button — Pause</p></div>
            <div><p className="font-semibold text-white mb-1">Scoring</p><p>+10 pts per food</p><p>1 life every 150 pts (200 in Hard and Endless, 350 in Uncompromising)</p><p>1 star point every 250 pts</p></div>
            <div><p className="font-semibold text-white mb-1">How to Unlock Modes</p>
              <p><span style={{ color: '#e05a1a' }} className="font-semibold">Speed</span> — 3000 pts in Classic</p>
              <p><span style={{ color: '#ef4444' }} className="font-semibold">Hard</span> — 3500 pts in Speed</p>
              <p><span style={{ color: '#4ade80' }} className="font-semibold">Endless Modes</span> — 7500 pts in Hard</p>
              <p><span style={{ color: '#ff6666' }} className="font-semibold">Uncompromising</span> — 10000 pts in Endless Hard</p>
              <p><span style={{ color: '#a855f7' }} className="font-semibold">Crazy Fruits</span> — Complete Uncompromising</p>
            </div>
            <div><p className="font-semibold text-white mb-1">High Scores</p>{Object.entries(highScores).map(([k, v]) => <p key={k} className="capitalize">{k.replace(/-/g, ' ')}: {v}</p>)}</div>
            <div className="pt-2 border-t border-gray-600"><p className="text-gray-400">Want more info? <a href="https://chatgpt.com/g/g-6925b9bc48d88191a25b8caa73051011-snake-game-revived-gpt-assistant" target="_blank" rel="noopener noreferrer" className="text-green-400 underline">Check our GPT</a></p></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DESKTOP MENU ───────────────────────────────────────────────────────
  if (!isMobile && gameState === 'menu') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-6 relative">
          <h1 className="text-6xl font-bold text-green-400 mb-1">SNAKE</h1>
          <p className="text-gray-400 mb-1">Classic Arcade Game</p>
          <button onClick={() => setDeviceType(null)} className="text-xs text-gray-500 underline hover:text-gray-400">Change device</button>
          <div className="absolute top-0 right-0 flex gap-2">
            <button onClick={() => setGameState('achievements')} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-bold text-white text-sm">Achievements</button>
            <button onClick={() => setGameState('customize')}    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-white text-sm">Customize</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Details</h2>
            <div className="text-gray-300 space-y-3 text-sm">
              <div><p className="font-semibold text-white mb-1">Controls</p><p>Arrow Keys — Move</p><p>Space — Use life / Restart</p><p>P / Escape — Pause</p><p>B — Back to Menu</p></div>
              <div><p className="font-semibold text-white mb-1">Scoring</p><p>+10 pts per food</p><p>1 life every 150 pts (200 in Hard and Endless, 350 in Uncompromising)</p><p>1 star point every 250 pts</p></div>
              <div><p className="font-semibold text-white mb-1">How to Unlock Modes</p>
                <p><span className="font-semibold" style={{ color: '#e05a1a' }}>Speed</span> — 3000 pts in Classic</p>
                <p><span className="font-semibold" style={{ color: '#ef4444' }}>Hard</span> — 3500 pts in Speed</p>
                <p><span className="font-semibold" style={{ color: '#4ade80' }}>Endless Modes</span> — 7500 pts in Hard</p>
                <p><span className="font-semibold" style={{ color: '#ff6666' }}>Uncompromising</span> — 10000 pts in Endless Hard</p>
                <p><span className="font-semibold" style={{ color: '#a855f7' }}>Crazy Fruits</span> — Complete Uncompromising</p>
              </div>
              <div><p className="font-semibold text-white mb-1">High Scores</p>{Object.entries(highScores).map(([k, v]) => <p key={k} className="text-xs capitalize">{k.replace(/-/g, ' ')}: {v}</p>)}</div>
              <div className="pt-2 border-t border-gray-600"><p className="text-gray-400 text-xs">Want more info? <a href="https://chatgpt.com/g/g-6925b9bc48d88191a25b8caa73051011-snake-game-revived-gpt-assistant" target="_blank" rel="noopener noreferrer" className="text-green-400 underline">Check our GPT</a></p></div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-green-500">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Game Modes</h2>
            <div className="space-y-2">
              {MODES.map(({ mode, label, bg, always, lockDesc }) => {
                const locked = !always && !unlockedModes.includes(mode);
                return (
                  <button key={mode} onClick={() => !locked && startGame(mode)} disabled={locked}
                    className={`w-full font-bold py-2 px-4 rounded-lg text-white text-left flex justify-between items-center ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
                    style={{ backgroundColor: locked ? '#374151' : bg }}>
                    <span>{label}</span>
                    {locked && <span className="text-xs">Lock: {lockDesc}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DESKTOP ACHIEVEMENTS ───────────────────────────────────────────────
  if (!isMobile && gameState === 'achievements') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg border-4 border-yellow-500 flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between p-4 border-b-2 border-yellow-500">
          <h2 className="text-3xl font-bold text-yellow-400">Achievements</h2>
          <button onClick={() => setGameState('menu')} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg">Close</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {ACHIEVEMENTS.map((a) => {
            const u = achievements.includes(a.id);
            return (
              <div key={a.id} className={`p-4 rounded-lg border-2 flex gap-4 items-start ${u ? 'bg-yellow-900 bg-opacity-30 border-yellow-500' : 'bg-gray-700 border-gray-600'}`}>
                <div className="flex-1">
                  <div className={`font-bold text-lg ${u ? 'text-yellow-400' : 'text-gray-400'}`}>{a.name}</div>
                  <div className={`text-sm ${u ? 'text-gray-300' : 'text-gray-500'}`}>{a.desc}</div>
                  <div className="text-yellow-400 font-bold mt-1">+{a.reward} star pts</div>
                </div>
                {u && <div className="text-green-400 text-xl font-bold">done</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── DESKTOP CUSTOMIZE ─────────────────────────────────────────────────
  if (!isMobile && gameState === 'customize') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-purple-400 mb-1">Customize Snake</h1>
          <div className="inline-block bg-yellow-500 text-gray-900 px-4 py-1 rounded-lg font-bold">{starPoints} Star Points</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-5 border-2 border-purple-500 mb-4">
          <h2 className="text-xl font-bold text-purple-400 mb-3">Color</h2>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {Object.entries(COLORS).map(([cn, cd]) => {
              const isU = unlockedColors.includes(cn);
              const can = starPoints >= cd.cost;
              const handleClick = () => {
                if (isU) { setSnakeColor(cn); playBuy(); }
                else if (can) doUnlockItem(cn, cd.cost, unlockedColors, setUnlockedColors, 'unlocked-colors');
              };
              return (
                <button key={cn} onClick={handleClick} disabled={!isU && !can}
                  className={`h-16 rounded border-4 relative transition ${snakeColor === cn ? 'border-white scale-105' : isU ? 'border-gray-600 hover:border-gray-400' : can ? 'border-yellow-500' : 'border-gray-700 opacity-50 cursor-not-allowed'}`}
                  style={{ background: cd.value }}>
                  <span className={`font-bold text-xs ${cd.textColor === 'black' ? 'text-black' : 'text-white'}`}>{cd.name}</span>
                  {!isU && <div className="absolute bottom-0 left-0 right-0 text-center"><span className="text-xs font-bold bg-black bg-opacity-70 px-1 rounded text-yellow-400">{can ? `${cd.cost} pts` : `lock ${cd.cost}`}</span></div>}
                </button>
              );
            })}
          </div>
          <h2 className="text-xl font-bold text-purple-400 mb-3">Pattern</h2>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(PATTERNS).map(([pn, pd]) => {
              const isU = unlockedPatterns.includes(pn);
              const can = starPoints >= pd.cost;
              const handleClick = () => {
                if (isU) { setSnakePattern(pn); playBuy(); }
                else if (can) doUnlockItem(pn, pd.cost, unlockedPatterns, setUnlockedPatterns, 'unlocked-patterns');
              };
              return (
                <button key={pn} onClick={handleClick} disabled={!isU && !can}
                  className={`h-16 rounded border-4 flex flex-col items-center justify-center relative transition ${snakePattern === pn ? 'border-white scale-105 bg-gray-700' : isU ? 'border-gray-600 bg-gray-800 hover:bg-gray-700' : can ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed'}`}>
                  <div className="text-2xl">{pd.symbol}</div>
                  <div className="text-xs text-gray-300">{pd.name}</div>
                  {!isU && <div className="text-xs text-yellow-400 font-bold">{can ? `${pd.cost} pts` : 'lock'}</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-purple-500 mb-4">
          <h2 className="text-lg font-bold text-purple-400 mb-2">Preview</h2>
          <div className="rounded p-3 flex justify-center gap-1" style={{ backgroundColor: THEMES[theme].bg, border: `2px solid ${THEMES[theme].border}` }}>
            {[0,1,2,3,4].map((i) => <div key={i} className="w-10 h-10 rounded flex items-center justify-center text-xl" style={{ background: COLORS[snakeColor].value, color: COLORS[snakeColor].textColor === 'black' ? 'black' : 'white', boxShadow: THEMES[theme].glowSnake ? `0 0 12px ${THEMES[theme].glowColor}` : '' }}>{PATTERNS[snakePattern].symbol}</div>)}
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={async () => { await saveCustomization(); setGameState('menu'); }} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg">Save and Return</button>
          <button onClick={() => setGameState('menu')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );

  // ── MOBILE PLAYING ─────────────────────────────────────────────────────
  if (isMobile && gameState === 'playing') return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white select-none">
      {mobilePanel === 'achievements' && <AchievementsPanel onClose={() => setMobilePanel(null)} />}
      {mobilePanel === 'customize'    && <CustomizePanel    onClose={() => setMobilePanel(null)} />}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <button onClick={quitToMenu} className="bg-gray-600 active:bg-gray-700 text-white font-bold px-3 py-1 rounded text-sm">Menu</button>
        <div className="text-center">
          <div className="font-bold text-sm" style={{ color: MODES.find((m) => m.mode === gameMode)?.bg || '#22c55e' }}>{gameMode.replace(/-/g, ' ').toUpperCase()}</div>
          <div className="text-white font-bold">Score: {score}</div>
        </div>
        <div className="text-right text-sm">
          <div className="text-yellow-400">Lives: {lives}</div>
          <div className="text-yellow-300">Stars: {starPoints}</div>
        </div>
      </div>
      {(isSlowdown || isSpeedBoost || fruitEffectActive) && (
        <div className="text-center py-1 text-xs font-bold bg-black bg-opacity-50">
          {isSlowdown && <span className="text-blue-400">SLOWDOWN </span>}
          {isSpeedBoost && <span className="text-red-400">SPEED BOOST </span>}
          {fruitEffectActive === 'slow'  && <span className="text-blue-400">Slowed </span>}
          {fruitEffectActive === 'speed' && <span className="text-orange-400">Speed Boost </span>}
        </div>
      )}
      <div className="flex justify-center pt-2"><GameBoard /></div>
      <div className="flex justify-center mt-3 mb-2">
        <DPad
          onUp={() => handleDir({ x: 0, y: -1 })}
          onDown={() => handleDir({ x: 0, y: 1 })}
          onLeft={() => handleDir({ x: -1, y: 0 })}
          onRight={() => handleDir({ x: 1, y: 0 })}
          onSpace={handleSpace}
          onPause={handlePause}
          pauseLabel={isPaused ? 'Resume' : 'Pause'}
        />
      </div>
      <div className="flex justify-center pb-3">
        <button onClick={quitToMenu} className="bg-gray-600 active:bg-gray-700 text-white font-bold px-6 py-2 rounded-lg text-sm">Back to Menu</button>
      </div>
      {showAchievement && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-gray-900 px-4 py-3 rounded-lg shadow-lg z-50 text-center"><p className="font-bold">Achievement Unlocked!</p><p className="text-sm">{showAchievement.name} +{showAchievement.reward} star pts</p></div>}
    </div>
  );

  // ── DESKTOP / TABLET PLAYING ───────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-4 text-center relative w-full max-w-2xl">
        <button onClick={handlePause} disabled={gameOver || showRevive} className="absolute top-0 right-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{isPaused ? 'Resume' : 'Pause'}</button>
        <h1 className="text-4xl font-bold mb-1" style={{ color: MODES.find((m) => m.mode === gameMode)?.bg || '#22c55e' }}>{gameMode.replace(/-/g, ' ').toUpperCase()}</h1>
        <p className="text-xl text-white">Score: {score}</p>
        <p className="text-lg text-yellow-400">Lives: {lives} | Stars: {starPoints}</p>
        {isSlowdown   && <p className="text-blue-400 text-sm">SLOWDOWN ACTIVE!</p>}
        {isSpeedBoost && <p className="text-red-400 text-sm">SPEED BOOST!</p>}
      </div>
      <GameBoard />
      {deviceType === 'tablet' && (
        <div className="mt-4">
          <DPad
            tablet={true}
            onUp={() => handleDir({ x: 0, y: -1 })}
            onDown={() => handleDir({ x: 0, y: 1 })}
            onLeft={() => handleDir({ x: -1, y: 0 })}
            onRight={() => handleDir({ x: 1, y: 0 })}
            onSpace={handleSpace}
            onPause={handlePause}
            pauseLabel={isPaused ? 'Resume' : 'Pause'}
          />
        </div>
      )}
      <div className="mt-4"><button onClick={quitToMenu} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm">Back to Menu</button></div>
      {showAchievement && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-gray-900 px-6 py-4 rounded-lg shadow-lg z-50"><p className="text-xl font-bold">Achievement Unlocked!</p><p>{showAchievement.name}</p><p className="font-bold">+{showAchievement.reward} star pts</p></div>}
    </div>
  );
}
}

export default Game;