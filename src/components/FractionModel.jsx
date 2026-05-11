import React from "react";

export default function FractionModel({
  total = 4,
  shaded = 1,
  model = "bar",
  size = 150,
}) {
  const parts = Array.from({ length: total });

  if (model === "circle") {
    const radius = 45;
    const center = 50;
    const angle = 360 / total;

    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        {parts.map((_, index) => {
          const startAngle = (index * angle - 90) * (Math.PI / 180);
          const endAngle = ((index + 1) * angle - 90) * (Math.PI / 180);

          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);

          const largeArc = angle > 180 ? 1 : 0;

          return (
            <path
              key={index}
              d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={index < shaded ? "#60a5fa" : "#ffffff"}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${total}, 1fr)`,
        width: size * 1.4,
        height: 46,
        border: "2px solid #0f172a",
        borderRadius: 10,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      {parts.map((_, index) => (
        <div
          key={index}
          style={{
            background: index < shaded ? "#60a5fa" : "#ffffff",
            borderRight: index < total - 1 ? "2px solid #0f172a" : "none",
          }}
        />
      ))}
    </div>
  );
}