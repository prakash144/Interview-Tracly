"use client";

interface ReadinessGaugeProps {
  score: number;
  size?: number;
}

export function ReadinessGauge({ score, size = 140 }: ReadinessGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const level =
    clamped >= 90 ? "Excellent" :
    clamped >= 75 ? "Strong" :
    clamped >= 60 ? "Ready" :
    clamped >= 40 ? "Improving" :
    "Beginner";

  const color =
    clamped >= 75 ? "stroke-success" :
    clamped >= 60 ? "stroke-info" :
    clamped >= 40 ? "stroke-warning" :
    "stroke-destructive";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Readiness score: ${clamped}%`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className={color}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground" style={{ fontSize: `${size * 0.16}px`, fontWeight: 700, fontFamily: "inherit" }}>
          {clamped}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: `${size * 0.09}px`, fontFamily: "inherit" }}>
          {level}
        </text>
      </svg>
    </div>
  );
}
