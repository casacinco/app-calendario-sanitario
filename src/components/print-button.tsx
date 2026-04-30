"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: "#1d3a12",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "6px 16px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        letterSpacing: "0.01em",
      }}
    >
      Imprimir (Ctrl+P)
    </button>
  );
}
