"use client";

import { useMemo } from "react";

interface TopicStrength {
  name: string;
  strength: number;
}

interface WeaknessRadarChartProps {
  topics: TopicStrength[];
  size?: number;
}

export function WeaknessRadarChart({ topics, size = 200 }: WeaknessRadarChartProps) {
  const data = useMemo(() => {
    const sorted = [...topics].sort((a, b) => b.strength - a.strength).slice(0, 6);
    if (sorted.length < 3 && topics.length > 0) {
      return topics.slice(0, 3);
    }
    return sorted;
  }, [topics]);

  if (data.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = 4;

  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const pct = ((level + 1) / levels) * 100;
    const points = data
      .map((_, i) => {
        const p = getPoint(i, pct);
        return `${p.x},${p.y}`;
      })
      .join(" ");
    return <polygon key={level} points={points} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />;
  });

  const axes = data.map((_, i) => {
    const p = getPoint(i, 100);
    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />;
  });

  const dataPoints = data.map((_, i) => getPoint(i, data[i].strength));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const dataDots = dataPoints.map((p, i) => (
    <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--info))" stroke="hsl(var(--background))" strokeWidth="1.5" />
  ));

  const labels = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelR = radius + 18;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);
    const anchor =
      Math.abs(angle) < 0.1 ? "middle" : angle > 0 ? "start" : "end";
    const dy = Math.abs(angle - Math.PI / 2) < 0.1 || Math.abs(angle + Math.PI / 2) < 0.1 ? "0.3em" : "0.3em";
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor={anchor}
        dy={dy}
        className="fill-muted-foreground"
        style={{ fontSize: "8px", fontFamily: "inherit" }}
      >
        {d.name} {Math.round(d.strength)}%
      </text>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label="Weakness radar chart">
      {gridPolygons}
      {axes}
      <polygon points={dataPolygon} fill="hsl(var(--info))" fillOpacity="0.15" stroke="hsl(var(--info))" strokeWidth="1.5" />
      {dataDots}
      {labels}
    </svg>
  );
}
