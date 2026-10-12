/**
 * Tic Tac Toe Website - Clean Game Logic & Interactivity
 */

(function () {
  'use strict';

  // Winning combinations for 3x3
  const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const STORAGE = {
    SCORES: 'ttt_simple_scores',
    SOUND: 'ttt_simple_sound',
    MODE: 'ttt_simple_mode',
    DIFF: 'ttt_simple_diff'
  };

  // State
  let board = Array(9).fill(null);
  let currentPlayer = 'X';
  let gameActive = true;
  let gameMode = localStorage.getItem(STORAGE.MODE) || 'pvp'; // 'pvp' | 'ai'
  let aiDifficulty = localStorage.getItem(STORAGE.DIFF) || 'medium'; // 'easy' | 'medium' | 'hard'
  let soundEnabled = localStorage.getItem(STORAGE.SOUND) !== 'false';
  let isAiThinking = false;

  let scores = { X: 0, O: 0, ties: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.SCORES));
    if (saved && typeof saved.X === 'number') scores = saved;
  } catch (e) {}

  // Elements
  const cells = document.querySelectorAll('.board-cell');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');

  const scoreBoxX = document.getElementById('score-box-x');
  const scoreBoxO = document.getElementById('score-box-o');
  const scoreValX = document.getElementById('score-x-val');
  const scoreValO = document.getElementById('score-o-val');
  const scoreValTies = document.getElementById('score-ties-val');
  const playerXLabel = document.getElementById('player-x-label');
  const playerOLabel = document.getElementById('player-o-label');

  const modePvpBtn = document.getElementById('mode-pvp-btn');
  const modeAiBtn = document.getElementById('mode-ai-btn');
  const aiDiffBar = document.getElementById('ai-difficulty-bar');
  const diffBtns = document.querySelectorAll('.diff-btn');

  const resetMatchBtn = document.getElementById('reset-match-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');

  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');

  const modal = document.getElementById('game-result-modal');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-result-title');
  const modalMsg = document.getElementById('modal-result-msg');
  const modalAgainBtn = document.getElementById('modal-again-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // Web Audio Synthesizer
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(freq, duration = 0.08, type = 'sine') {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playWinSound() {
    if (!soundEnabled) return;
    [440, 554.37, 659.25].forEach((f, i) => {
      setTimeout(() => playSound(f, 0.18, 'triangle'), i * 90);
    });
  }

  // Render SVG marks
  function createXMark() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 50 50');
    svg.classList.add('mark-svg', 'mark-x');
    svg.innerHTML = `
      <line x1="12" y1="12" x2="38" y2="38" />
      <line x1="38" y1="12" x2="12" y2="38" />
    `;
    return svg;
  }

  function createOMark() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 50 50');
    svg.classList.add('mark-svg', 'mark-o');
    svg.innerHTML = `<circle cx="25" cy="25" r="16" />`;
    return svg;
  }

  // Update UI State
  function updateUI() {
    scoreValX.textContent = scores.X;
    scoreValO.textContent = scores.O;
    scoreValTies.textContent = scores.ties;

    // Active score box
    scoreBoxX.classList.toggle('active', gameActive && currentPlayer === 'X');
    scoreBoxO.classList.toggle('active', gameActive && currentPlayer === 'O');

    // Turn indicator labels
    const turnIndicatorX = scoreBoxX.querySelector('.turn-indicator');
    const turnIndicatorO = scoreBoxO.querySelector('.turn-indicator');
    if (turnIndicatorX) turnIndicatorX.textContent = (gameActive && currentPlayer === 'X') ? 'Your Turn' : '—';
    if (turnIndicatorO) turnIndicatorO.textContent = (gameActive && currentPlayer === 'O') ? 'Your Turn' : '—';

    // Status Banner
    statusBanner.className = 'status-banner';
    if (gameActive) {
      if (currentPlayer === 'X') {
        statusBanner.classList.add('status-x');
        statusText.innerHTML = `Player <strong>X</strong>'s turn`;
      } else {
        statusBanner.classList.add('status-o');
        const oName = gameMode === 'ai' ? 'Computer' : 'Player O';
        statusText.innerHTML = isAiThinking ? `<strong>${oName}</strong> is thinking...` : `<strong>${oName}</strong>'s turn`;
      }
    }

    // Mode labels
    if (gameMode === 'ai') {
      playerOLabel.textContent = 'Computer';
      aiDiffBar.classList.remove('hidden');
    } else {
      playerOLabel.textContent = 'Player O';
      aiDiffBar.classList.add('hidden');
    }

    // Tabs & Pills
    modePvpBtn.classList.toggle('active', gameMode === 'pvp');
    modeAiBtn.classList.toggle('active', gameMode === 'ai');

    diffBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === aiDifficulty);
    });

    // Sound button
    soundIconOn.classList.toggle('hidden', !soundEnabled);
    soundIconOff.classList.toggle('hidden', soundEnabled);
  }

  // Move Handling
  function handleCellClick(index) {
    if (!gameActive || board[index] !== null || isAiThinking) return;

    makeMove(index, currentPlayer);

    if (gameActive && gameMode === 'ai' && currentPlayer === 'O') {
      triggerAiTurn();
    }
  }

  function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.classList.add('taken');
    cell.innerHTML = '';
    cell.appendChild(player === 'X' ? createXMark() : createOMark());

    playSound(player === 'X' ? 520 : 380, 0.08);

    const winInfo = checkWin(board);
    if (winInfo) {
      handleGameOver(winInfo.winner, winInfo.combo);
      return;
    }

    if (board.every(c => c !== null)) {
      handleGameOver('tie', null);
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateUI();
  }

  function checkWin(b) {
    for (const combo of WINNING_COMBINATIONS) {
      const [p1, p2, p3] = combo;
      if (b[p1] && b[p1] === b[p2] && b[p1] === b[p3]) {
        return { winner: b[p1], combo };
      }
    }
    return null;
  }

  function handleGameOver(winner, combo) {
    gameActive = false;

    if (winner === 'tie') {
      scores.ties++;
      saveScores();
      statusBanner.className = 'status-banner status-tie';
      statusText.innerHTML = `Game ended in a draw!`;
      playSound(280, 0.2);

      setTimeout(() => {
        showModal('🤝', 'Draw Game!', 'Both players played skillfully with no winner.');
      }, 400);
    } else {
      scores[winner]++;
      saveScores();

      // Highlight winning cells
      if (combo) {
        combo.forEach(idx => cells[idx].classList.add('winning-cell'));
      }

      playWinSound();
      const winnerName = winner === 'X' ? 'Player X' : (gameMode === 'ai' ? 'Computer' : 'Player O');
      statusBanner.className = `status-banner status-${winner.toLowerCase()}`;
      statusText.innerHTML = `<strong>${winnerName}</strong> won the game!`;

      setTimeout(() => {
        showModal('🏆', `${winnerName} Wins!`, `${winnerName} completed three in a row.`);
      }, 500);
    }

    updateUI();
  }

  function showModal(badge, title, message) {
    modalBadge.textContent = badge;
    modalTitle.textContent = title;
    modalMsg.textContent = message;
    modal.classList.remove('hidden');
  }

  function hideModal() {
    modal.classList.add('hidden');
  }

  function resetRound() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    isAiThinking = false;
    hideModal();

    cells.forEach(cell => {
      cell.innerHTML = '';
      cell.classList.remove('taken', 'winning-cell');
    });

    updateUI();
  }

  function resetScores() {
    scores = { X: 0, O: 0, ties: 0 };
    saveScores();
    resetRound();
  }

  function saveScores() {
    localStorage.setItem(STORAGE.SCORES, JSON.stringify(scores));
  }

  // AI Opponent with Minimax
  function triggerAiTurn() {
    isAiThinking = true;
    updateUI();

    const delay = Math.random() * 150 + 300;
    setTimeout(() => {
      if (!gameActive || currentPlayer !== 'O') {
        isAiThinking = false;
        return;
      }

      let move;
      if (aiDifficulty === 'easy') {
        move = getRandomMove();
      } else if (aiDifficulty === 'medium') {
        move = Math.random() < 0.65 ? getMinimaxMove() : getRandomMove();
      } else {
        move = getMinimaxMove();
      }

      isAiThinking = false;
      if (move !== null && move !== undefined) {
        makeMove(move, 'O');
      }
    }, delay);
  }

  function getAvailableMoves(b) {
    const list = [];
    b.forEach((v, i) => { if (v === null) list.push(i); });
    return list;
  }

  function getRandomMove() {
    const av = getAvailableMoves(board);
    if (av.length === 0) return null;
    return av[Math.floor(Math.random() * av.length)];
  }

  function getMinimaxMove() {
    const available = getAvailableMoves(board);
    if (available.length === 0) return null;

    // Center/corner heuristic for faster opening
    if (available.length === 8 && board[4] === null) return 4;

    let bestScore = -Infinity;
    let bestMove = available[0];

    for (const m of available) {
      board[m] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[m] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }
    return bestMove;
  }

  function minimax(b, depth, isMaximizing, alpha, beta) {
    const win = checkWin(b);
    if (win) {
      if (win.winner === 'O') return 10 - depth;
      if (win.winner === 'X') return depth - 10;
    }

    const av = getAvailableMoves(b);
    if (av.length === 0) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of av) {
        b[m] = 'O';
        const evaluation = minimax(b, depth + 1, false, alpha, beta);
        b[m] = null;
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of av) {
        b[m] = 'X';
        const evaluation = minimax(b, depth + 1, true, alpha, beta);
        b[m] = null;
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Event Listeners
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      getAudioContext();
      const idx = parseInt(cell.dataset.index, 10);
      handleCellClick(idx);
    });
  });

  modePvpBtn.addEventListener('click', () => {
    if (gameMode !== 'pvp') {
      gameMode = 'pvp';
      localStorage.setItem(STORAGE.MODE, 'pvp');
      resetRound();
    }
  });

  modeAiBtn.addEventListener('click', () => {
    if (gameMode !== 'ai') {
      gameMode = 'ai';
      localStorage.setItem(STORAGE.MODE, 'ai');
      resetRound();
    }
  });

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      aiDifficulty = btn.dataset.diff;
      localStorage.setItem(STORAGE.DIFF, aiDifficulty);
      updateUI();
    });
  });

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(STORAGE.SOUND, soundEnabled);
    if (soundEnabled) playSound(500, 0.05);
    updateUI();
  });

  resetMatchBtn.addEventListener('click', resetRound);

  resetScoresBtn.addEventListener('click', () => {
    if (confirm('Reset all scoreboard tallies to 0?')) {
      resetScores();
    }
  });

  modalAgainBtn.addEventListener('click', resetRound);
  modalCloseBtn.addEventListener('click', hideModal);

  // Keyboard navigation (1-9, R, Esc)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
      return;
    }
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
      resetRound();
      return;
    }
    const val = parseInt(e.key, 10);
    if (!isNaN(val) && val >= 1 && val <= 9) {
      handleCellClick(val - 1);
    }
  });

  // Navigation link smooth highlighting
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Init
  updateUI();
})();
