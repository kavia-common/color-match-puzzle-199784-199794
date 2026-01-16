import React, { useEffect, useMemo, useRef, useState } from "react";
import Candy from "./Candy";
import { getBoardSize } from "../utils/gameUtils";

const BOARD_SIZE = getBoardSize();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// PUBLIC_INTERFACE
export default function GameBoard({
  board,
  selectedIndex,
  clearingSet,
  onCellActivate,
  disabled
}) {
  /** Renders the 8x8 board and handles keyboard navigation. */
  const [focusIndex, setFocusIndex] = useState(0);
  const cellRefs = useRef([]);

  const clearingLookup = useMemo(() => {
    const set = new Set();
    clearingSet?.forEach((i) => set.add(i));
    return set;
  }, [clearingSet]);

  useEffect(() => {
    // Keep focus on selected cell if any.
    if (typeof selectedIndex === "number") setFocusIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    const el = cellRefs.current[focusIndex];
    if (el && typeof el.focus === "function") el.focus();
  }, [focusIndex]);

  const onKeyDown = (e) => {
    const row = Math.floor(focusIndex / BOARD_SIZE);
    const col = focusIndex % BOARD_SIZE;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex(clamp((row - 1) * BOARD_SIZE + col, 0, BOARD_SIZE * BOARD_SIZE - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex(clamp((row + 1) * BOARD_SIZE + col, 0, BOARD_SIZE * BOARD_SIZE - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusIndex(clamp(row * BOARD_SIZE + (col - 1), 0, BOARD_SIZE * BOARD_SIZE - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusIndex(clamp(row * BOARD_SIZE + (col + 1), 0, BOARD_SIZE * BOARD_SIZE - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCellActivate(focusIndex);
    }
  };

  return (
    <section className="cc-boardWrap" aria-label="Candy board">
      <div
        className="cc-board"
        role="grid"
        aria-rowcount={BOARD_SIZE}
        aria-colcount={BOARD_SIZE}
        onKeyDown={onKeyDown}
      >
        {board.map((cell, idx) => (
          <div role="gridcell" key={cell.id} className="cc-gridCell">
            <Candy
              cell={cell}
              index={idx}
              isSelected={selectedIndex === idx}
              isClearing={clearingLookup.has(idx)}
              onActivate={(i) => {
                setFocusIndex(i);
                onCellActivate(i);
              }}
              disabled={disabled}
              ref={(el) => {
                cellRefs.current[idx] = el;
              }}
            />
          </div>
        ))}
      </div>
      <p className="cc-helpText" aria-live="polite">
        Tip: Use arrow keys to move focus; press Enter/Space to select and swap.
      </p>
    </section>
  );
}
