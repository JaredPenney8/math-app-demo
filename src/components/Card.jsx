export default function Card({ title, children, style = {} }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      border: "1px solid #e2e8f0",
      ...style
    }}>
      {title && (
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}