import React from "react";
import { getCandyTypes } from "../utils/gameUtils";

const typeMap = Object.fromEntries(getCandyTypes().map((t) => [t.id, t]));

// PUBLIC_INTERFACE
const Candy = React.forwardRef(function Candy(
  { cell, index, isSelected, isClearing, onActivate, disabled },
  ref
) {
  /** Render a single candy cell as an accessible button. */

  const type = cell?.type;
  const meta = type ? typeMap[type] : null;
  const label = meta ? meta.label : "Empty";

  return (
    <button
      ref={ref}
      type="button"
      className={[
        "cc-cell",
        isSelected ? "is-selected" : "",
        isClearing ? "is-clearing" : "",
        cell?.isNew ? "is-new" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onActivate(index)}
      disabled={disabled}
      aria-label={`Row ${Math.floor(index / 8) + 1}, Column ${(index % 8) + 1}, ${label}`}
      aria-pressed={isSelected ? "true" : "false"}
    >
      <span className="cc-candy" data-type={type || "empty"} aria-hidden="true" />
    </button>
  );
});

export default Candy;
