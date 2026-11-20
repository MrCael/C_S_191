# Checkers Game — Project Plan

## Context
A browser checkers game built with only HTML, CSS, and JavaScript for a C S 191 AI project. This file records the agreed specs and milestones so we can refer back to them during development.

## Specifications
| Area | Decision |
|---|---|
| Players | Two players taking turns on one device (hot-seat) |
| Rules | Standard American checkers: 8×8 board, 12 pieces per side, mandatory captures, multi-jumps must be finished, regular pieces move and capture forward only, kings move and capture one square in any diagonal direction, a piece is promoted to king when it reaches the far row (and its turn ends) |
| Input | Click a piece to select it, legal destinations are highlighted, click a destination to move |
| Game end | Win/loss only: a player loses when they have no pieces or no legal moves. Show the winner and a "New Game" button |
| Style | Minimal/modern: flat colors, clean lines, simple move animations |
| Files | `index.html`, `style.css`, `script.js` (opening `index.html` directly in a browser is enough, no server needed) |
| Extras | No preference, so they go in the optional final milestone |

## Milestones

### M1 — Project setup & static board
- Create `index.html`, `style.css`, `script.js`
- Draw an 8×8 board with CSS Grid, alternating square colors
- Status area showing whose turn it is
- **Done when:** opening `index.html` shows an empty, centered board

### M2 — Game state & pieces
- Board state as an 8×8 array in JS (empty / dark / light, regular / king)
- `render()` function that draws pieces from the state
- Starting setup: 12 pieces per side on the dark squares
- **Done when:** the starting position renders correctly from the state

### M3 — Selection & simple moves
- Track the current player (dark moves first)
- Click to select your own piece and highlight it; click again or click elsewhere to deselect
- Work out legal non-capture moves (forward diagonals) and highlight them
- Click a highlighted square to move, then switch turns
- **Done when:** players can take turns making simple moves

### M4 — Captures (mandatory + multi-jump)
- Find jumps over adjacent enemy pieces into empty squares
- Mandatory capture: if any jump exists, only jumping pieces can be selected
- Multi-jump: after a jump, the same piece must keep jumping while it can (other pieces locked out)
- Remove captured pieces
- **Done when:** captures work and the rules are enforced

### M5 — Kings
- Promote a piece when it reaches the far row; the turn ends there even if more jumps were possible
- Kings move and capture in all four diagonal directions
- Visual king marker (for example a ring or crown icon)
- **Done when:** promotion and king movement work

### M6 — Win detection & reset
- After each turn, check whether the next player has any pieces or legal moves
- Show the winner and a "New Game" button that resets the state
- **Done when:** a full game can be played to the end and restarted

### M7 — Minimal/modern polish
- Flat color palette, clean typography, hover and selection states
- Simple CSS transition when a piece moves or is captured
- Board resizes to fit smaller screens
- **Done when:** the game looks clean and works on desktop and mobile widths

### M8 — Optional stretch features (pick any later)
- Undo last move (history stack)
- Move history list in checkers notation
- Captured pieces / pieces left counter
- Save the game in localStorage so a refresh doesn't lose it

## Verification (each milestone)
- Open `index.html` in a browser and test the milestone's "Done when" goal by hand
- Rule checks to run after M4–M6: a forced capture, a double or triple jump, a piece promoted mid-jump (turn should end), a king capturing backward, and a win by blocking the opponent so they have no moves
- Check the browser console for errors
