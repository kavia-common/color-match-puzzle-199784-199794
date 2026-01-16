import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Controls from "./components/Controls";
import GameBoard from "./components/GameBoard";
import HUD from "./components/HUD";
import SettingsModal from "./components/SettingsModal";
import {
  applyGravityAndRefill,
  areAdjacent,
  clearMatches,
  createInitialBoard,
  findMatches,
  scoreForMatchGroups,
  swapCells
} from "./utils/gameUtils";
import { createSoundPlayer } from "./utils/sound";

const INITIAL_MOVES = 20;

function targetScoreForLevel(level) {
  return 400 + (level - 1) * 250;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// PUBLIC_INTERFACE
function App() {
  /** Main app entry: manages all game state and composes UI components. */
  const [board, setBoard] = useState(() => createInitialBoard());
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const targetScore = useMemo(() => targetScoreForLevel(level), [level]);

  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES);

  const [isBusy, setIsBusy] = useState(false);
  const [clearingSet, setClearingSet] = useState(new Set());

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [reducedMotion, setReducedMotion] = useState(false);

  const soundsRef = useRef(null);
  // Incremented for each user-initiated swap attempt; used to ignore stale async work.
  const swapOpRef = useRef(0);

  useEffect(() => {
    soundsRef.current = createSoundPlayer({
      getMuted: () => muted,
      getVolume: () => volume
    });
  }, [muted, volume]);

  useEffect(() => {
    document.documentElement.setAttribute("data-reduced-motion", reducedMotion ? "true" : "false");
  }, [reducedMotion]);

  const canMove = movesLeft > 0;

  const startNewGame = () => {
    setIsBusy(true);
    setSelectedIndex(null);
    setClearingSet(new Set());
    setScore(0);
    setLevel(1);
    setMovesLeft(INITIAL_MOVES);
    setBoard(createInitialBoard());
    // tiny delay so button feels responsive even if we do work
    setTimeout(() => setIsBusy(false), 50);
  };

  const startNextLevel = async () => {
    setIsBusy(true);
    setSelectedIndex(null);
    setClearingSet(new Set());

    soundsRef.current?.levelUp();

    // small celebration pause
    await sleep(reducedMotion ? 100 : 450);

    setLevel((l) => l + 1);
    setMovesLeft(INITIAL_MOVES);
    setBoard(createInitialBoard());
    setScore(0);

    setIsBusy(false);
  };

  const resolveBoard = async (workingBoard) => {
    // Continue clearing/cascading until stable.
    let next = workingBoard;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { matchedIndices, matchGroups } = findMatches(next);
      if (matchedIndices.size === 0) {
        setClearingSet(new Set());
        break;
      }

      // show clearing state briefly
      setClearingSet(new Set(matchedIndices));
      soundsRef.current?.match();

      await sleep(reducedMotion ? 70 : 180);

      const cleared = clearMatches(next, matchedIndices);
      setBoard(cleared);

      const gained = scoreForMatchGroups(matchGroups);
      setScore((s) => s + gained);

      await sleep(reducedMotion ? 50 : 120);

      next = applyGravityAndRefill(cleared);
      setBoard(next);

      await sleep(reducedMotion ? 50 : 140);
    }

    return next;
  };

  useEffect(() => {
    // Check level completion whenever score changes.
    if (score >= targetScore && !isBusy) {
      startNextLevel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, targetScore]);

  const handleCellActivate = async (idx) => {
    if (isBusy || settingsOpen) return;
    if (!canMove) return;

    if (selectedIndex === null) {
      setSelectedIndex(idx);
      soundsRef.current?.swap();
      return;
    }

    // Snapshot current selection/board to avoid stale closure issues during async work.
    const fromIdx = selectedIndex;
    const toIdx = idx;
    const boardSnapshot = board;

    // reselect same cell
    if (fromIdx === toIdx) {
      setSelectedIndex(null);
      return;
    }

    // second click: attempt swap if adjacent
    if (!areAdjacent(fromIdx, toIdx)) {
      // switch selection to new cell (no swap)
      setSelectedIndex(toIdx);
      soundsRef.current?.invalid();
      return;
    }

    // Begin a new swap operation; anything from older operations should no-op.
    const opId = ++swapOpRef.current;

    setIsBusy(true);
    setSelectedIndex(null);

    soundsRef.current?.swap();

    // 1) Tentative swap (always for adjacent candies)
    let swapped = swapCells(boardSnapshot, fromIdx, toIdx);
    setBoard(swapped);

    await sleep(reducedMotion ? 60 : 140);
    if (swapOpRef.current !== opId) return;

    // 2) Check if that swap created any match
    const { matchedIndices } = findMatches(swapped);

    // 3) No match => revert swap, do NOT spend a move
    if (matchedIndices.size === 0) {
      soundsRef.current?.invalid();
      const reverted = swapCells(swapped, fromIdx, toIdx);
      setBoard(reverted);

      await sleep(reducedMotion ? 60 : 140);
      if (swapOpRef.current !== opId) return;

      setIsBusy(false);
      return;
    }

    // 4) Match exists => spend a move and resolve clears/cascades
    setMovesLeft((m) => Math.max(0, m - 1));

    swapped = await resolveBoard(swapped);
    if (swapOpRef.current !== opId) return;

    setIsBusy(false);

    // If out of moves after a valid move, end state is simply "no moves"; user can start new game.
    // We keep board as-is for the final view.
  };

  const statusText = useMemo(() => {
    if (!canMove) return "No moves left. Start a new game.";
    if (isBusy) return "Resolving matches…";
    if (score >= targetScore) return "Level complete!";
    return "Select a candy, then select an adjacent candy to swap.";
  }, [canMove, isBusy, score, targetScore]);

  return (
    <div className="App">
      <main className="cc-page">
        <HUD level={level} score={score} targetScore={targetScore} />

        <div className="cc-center">
          <div className="cc-status" aria-live="polite">
            {statusText}
          </div>

          <GameBoard
            board={board}
            selectedIndex={selectedIndex}
            clearingSet={clearingSet}
            onCellActivate={handleCellActivate}
            disabled={isBusy || settingsOpen || !canMove}
          />

          <Controls
            movesLeft={movesLeft}
            isBusy={isBusy}
            onNewGame={startNewGame}
            onToggleSettings={() => setSettingsOpen(true)}
          />
        </div>

        <SettingsModal
          open={settingsOpen}
          muted={muted}
          volume={volume}
          reducedMotion={reducedMotion}
          onClose={() => setSettingsOpen(false)}
          onMutedChange={setMuted}
          onVolumeChange={setVolume}
          onReducedMotionChange={setReducedMotion}
        />
      </main>
    </div>
  );
}

export default App;
