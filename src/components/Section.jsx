import { useState } from "react";

export default function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 6
        }}
      >
        {open ? "▼ " : "▶ "} {title}
      </div>

      {open && <div>{children}</div>}
    </div>
  );
}