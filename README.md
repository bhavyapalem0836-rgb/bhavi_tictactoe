# Tic Tac Toe

A clean, modern, and interactive Tic Tac Toe web game built with vanilla HTML, CSS, and JavaScript.

## ✨ Features

- **Game Modes**:
  - **2 Players**: Local pass-and-play on the same device.
  - **vs Computer (AI)**: Play against an intelligent computer opponent with 3 difficulty levels (*Easy*, *Medium*, and an *Unbeatable* Minimax algorithm).
- **Modern Minimalist UI**:
  - Clean responsive grid layout designed for both desktop and mobile devices.
  - Live turn indicators and automated score tracking.
- **Audio Synthesizer**: Built-in sound effects generated using the Web Audio API (no external audio assets required).
- **Keyboard Support**:
  - Press `1` through `9` on your keyboard or numpad to place marks.
  - Press `R` to start a new round.
  - Press `Escape` to dismiss result dialogs.
- **Informative Sections**:
  - Rules & How-to-play overview.
  - Proven winning strategies (center control, defensive blocking, and double-attack forks).

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
# Optional: run with Node.js
node server.js
```

Then visit `http://localhost:3000/`.

## 🛠️ Tech Stack

- **HTML5**: Semantic markup and accessibility.
- **CSS3**: Vanilla CSS with modern custom properties, flexbox, and grid.
- **JavaScript**: Pure Vanilla ES6+ logic with Minimax algorithm with alpha-beta pruning.
