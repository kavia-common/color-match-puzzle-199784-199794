import React from "react";

// PUBLIC_INTERFACE
export default function HUD({ level, score, targetScore }) {
  /** Displays top HUD area. */
  return (
    <header className="cc-hud">
      <div className="cc-brand">
        <div className="cc-title">Citrus Crush</div>
        <div className="cc-subtitle">Match 3+ to score. Reach the target to level up.</div>
      </div>

      <div className="cc-stats" aria-label="Game stats">
        <div className="cc-statCard" aria-label={`Level ${level}`}>
          <div className="cc-statLabel">Level</div>
          <div className="cc-statValue">{level}</div>
        </div>
        <div className="cc-statCard" aria-label={`Score ${score}`}>
          <div className="cc-statLabel">Score</div>
          <div className="cc-statValue">{score}</div>
        </div>
        <div className="cc-statCard" aria-label={`Target score ${targetScore}`}>
          <div className="cc-statLabel">Target</div>
          <div className="cc-statValue">{targetScore}</div>
        </div>
      </div>
    </header>
  );
}
