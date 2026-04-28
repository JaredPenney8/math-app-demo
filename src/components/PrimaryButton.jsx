export default function PrimaryButton({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        background: "#2563eb",
        color: "white",
        border: "none",
        fontWeight: 700,
        cursor: "pointer",
        ...style
      }}
    >
      {children}
    </button>
  );
}