import React from "react";

// PUBLIC_INTERFACE
export default function Controls({
  movesLeft,
  onNewGame,
  onToggleSettings,
  isBusy
}) {
  /** Bottom control row for moves and actions. */
  return (
    <footer className="cc-controls" aria-label="Game controls">
      <div className="cc-moves" aria-label={`Moves left ${movesLeft}`}>
        <span className="cc-movesLabel">Moves</span>
        <span className="cc-movesValue">{movesLeft}</span>
      </div>

      <div className="cc-buttons">
        <button className="cc-btn cc-btnSecondary" type="button" onClick={onToggleSettings}>
          Settings
        </button>
        <button className="cc-btn" type="button" onClick={onNewGame} disabled={isBusy}>
          New Game
        </button>
      </div>
    </footer>
  );
}
