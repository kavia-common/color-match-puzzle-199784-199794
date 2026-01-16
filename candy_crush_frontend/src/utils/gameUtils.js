const BOARD_SIZE = 8;

const CANDY_TYPES = [
  { id: "orange", label: "Orange", hue: 24 },
  { id: "lime", label: "Lime", hue: 132 },
  { id: "berry", label: "Berry", hue: 290 },
  { id: "lemon", label: "Lemon", hue: 55 },
  { id: "sky", label: "Sky", hue: 200 },
  { id: "cherry", label: "Cherry", hue: 350 }
];

const randInt = (maxExclusive) => Math.floor(Math.random() * maxExclusive);

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

/**
 * A "cell" in the board.
 * - id: stable identifier for animation/keying
 * - type: candy type id or null (empty)
 * - isNew: used to animate newly spawned candies
 */
const makeCandyCell = (type, { isNew = false } = {}) => ({
  id: makeId(),
  type,
  isNew
});

const inBounds = (r, c) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

const coordToIndex = (r, c) => r * BOARD_SIZE + c;

const indexToCoord = (idx) => ({
  row: Math.floor(idx / BOARD_SIZE),
  col: idx % BOARD_SIZE
});

// PUBLIC_INTERFACE
export function getBoardSize() {
  /** Return fixed board size (8). */
  return BOARD_SIZE;
}

// PUBLIC_INTERFACE
export function getCandyTypes() {
  /** Return available candy types (id/label/hue). */
  return CANDY_TYPES;
}

// PUBLIC_INTERFACE
export function areAdjacent(aIdx, bIdx) {
  /** Returns true if two indices represent orthogonally adjacent cells. */
  const a = indexToCoord(aIdx);
  const b = indexToCoord(bIdx);
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function cloneBoard(board) {
  return board.map((cell) => ({ ...cell }));
}

function randomCandyType() {
  return CANDY_TYPES[randInt(CANDY_TYPES.length)].id;
}

// PUBLIC_INTERFACE
export function createInitialBoard() {
  /**
   * Creates a random board with no immediate matches (so the first move matters).
   */
  const board = new Array(BOARD_SIZE * BOARD_SIZE).fill(null);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      let type = randomCandyType();

      // avoid creating 3-in-a-row/col on initial fill
      const left1 = c - 1 >= 0 ? board[coordToIndex(r, c - 1)]?.type : null;
      const left2 = c - 2 >= 0 ? board[coordToIndex(r, c - 2)]?.type : null;
      const up1 = r - 1 >= 0 ? board[coordToIndex(r - 1, c)]?.type : null;
      const up2 = r - 2 >= 0 ? board[coordToIndex(r - 2, c)]?.type : null;

      while ((type === left1 && type === left2) || (type === up1 && type === up2)) {
        type = randomCandyType();
      }

      board[coordToIndex(r, c)] = makeCandyCell(type);
    }
  }

  return board;
}

// PUBLIC_INTERFACE
export function swapCells(board, aIdx, bIdx) {
  /** Returns a new board with two indices swapped. */
  const next = cloneBoard(board);
  const tmp = next[aIdx];
  next[aIdx] = next[bIdx];
  next[bIdx] = tmp;
  return next;
}

function collectRun(board, startR, startC, dr, dc) {
  const startIdx = coordToIndex(startR, startC);
  const startType = board[startIdx]?.type;
  if (!startType) return [];

  const coords = [{ row: startR, col: startC }];
  let r = startR + dr;
  let c = startC + dc;

  while (inBounds(r, c)) {
    const idx = coordToIndex(r, c);
    const type = board[idx]?.type;
    if (type !== startType) break;
    coords.push({ row: r, col: c });
    r += dr;
    c += dc;
  }

  return coords;
}

// PUBLIC_INTERFACE
export function findMatches(board) {
  /**
   * Finds all indices that are part of any horizontal/vertical match of length >= 3.
   * Returns { matchedIndices: Set<number>, matchGroups: Array<{ indices:number[], length:number }> }
   */
  const matched = new Set();
  const groups = [];

  // horizontal scan
  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = 0;
    while (c < BOARD_SIZE) {
      const idx = coordToIndex(r, c);
      const type = board[idx]?.type;
      if (!type) {
        c++;
        continue;
      }
      const run = collectRun(board, r, c, 0, 1);
      if (run.length >= 3) {
        const indices = run.map(({ row, col }) => coordToIndex(row, col));
        indices.forEach((i) => matched.add(i));
        groups.push({ indices, length: run.length });
      }
      c += Math.max(1, run.length);
    }
  }

  // vertical scan
  for (let c = 0; c < BOARD_SIZE; c++) {
    let r = 0;
    while (r < BOARD_SIZE) {
      const idx = coordToIndex(r, c);
      const type = board[idx]?.type;
      if (!type) {
        r++;
        continue;
      }
      const run = collectRun(board, r, c, 1, 0);
      if (run.length >= 3) {
        const indices = run.map(({ row, col }) => coordToIndex(row, col));
        indices.forEach((i) => matched.add(i));
        groups.push({ indices, length: run.length });
      }
      r += Math.max(1, run.length);
    }
  }

  return { matchedIndices: matched, matchGroups: groups };
}

// PUBLIC_INTERFACE
export function clearMatches(board, matchedIndices) {
  /**
   * Returns a new board where matched indices become empty (type null).
   */
  const next = cloneBoard(board);
  matchedIndices.forEach((idx) => {
    next[idx] = { ...next[idx], type: null };
  });
  return next;
}

// PUBLIC_INTERFACE
export function applyGravityAndRefill(board) {
  /**
   * Applies gravity column-by-column and refills from the top with new candies.
   * Returns a new board.
   */
  const next = cloneBoard(board).map((cell) => ({ ...cell, isNew: false }));

  for (let c = 0; c < BOARD_SIZE; c++) {
    const filled = [];
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      const idx = coordToIndex(r, c);
      const cell = next[idx];
      if (cell?.type) filled.push(cell);
    }

    // rewrite column bottom -> top
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      const idx = coordToIndex(r, c);
      const existing = filled[BOARD_SIZE - 1 - r]; // 0 => bottom
      if (existing) {
        next[idx] = { ...existing, isNew: false };
      } else {
        next[idx] = makeCandyCell(randomCandyType(), { isNew: true });
      }
    }
  }

  return next;
}

// PUBLIC_INTERFACE
export function scoreForMatchGroups(matchGroups) {
  /**
   * Basic scoring:
   * - 3 => 30
   * - 4 => 60
   * - 5 => 100
   * - 6+ => 150
   * Plus +5 per candy over 3 for each group.
   */
  let score = 0;
  for (const g of matchGroups) {
    if (g.length === 3) score += 30;
    else if (g.length === 4) score += 60;
    else if (g.length === 5) score += 100;
    else score += 150;

    if (g.length > 3) score += (g.length - 3) * 5;
  }
  return score;
}

// PUBLIC_INTERFACE
export function wouldSwapCreateMatch(board, aIdx, bIdx) {
  /**
   * Returns true if swapping the two cells creates any match.
   */
  const swapped = swapCells(board, aIdx, bIdx);
  const { matchedIndices } = findMatches(swapped);
  return matchedIndices.size > 0;
}
