import React, { useEffect, useRef } from "react";

// PUBLIC_INTERFACE
export default function SettingsModal({
  open,
  muted,
  volume,
  reducedMotion,
  onClose,
  onMutedChange,
  onVolumeChange,
  onReducedMotionChange
}) {
  /** Simple modal overlay for settings. */
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cc-modalOverlay" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="cc-modal">
        <div className="cc-modalHeader">
          <div className="cc-modalTitle">Settings</div>
          <button
            type="button"
            className="cc-iconBtn"
            onClick={onClose}
            aria-label="Close settings"
            ref={closeBtnRef}
          >
            ×
          </button>
        </div>

        <div className="cc-modalBody">
          <label className="cc-settingRow">
            <span className="cc-settingLabel">Mute</span>
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => onMutedChange(e.target.checked)}
            />
          </label>

          <label className="cc-settingRow">
            <span className="cc-settingLabel">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              disabled={muted}
              aria-label="Sound volume"
            />
          </label>

          <label className="cc-settingRow">
            <span className="cc-settingLabel">Reduced motion</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => onReducedMotionChange(e.target.checked)}
            />
          </label>

          <p className="cc-modalHint">
            Audio uses simple synthesized tones and starts after your first interaction.
          </p>
        </div>
      </div>
    </div>
  );
}
