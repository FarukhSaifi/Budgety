"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { CURRENCY_SYMBOL, STITCH_CHART_COLORS, UI_TEXT, CHART_CONFIG } from "@constants";

import { cn } from "@utils/cn";

import { CHART_THEME_COLORS } from "@/lib/theme";

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
}

export interface DonutChartCardProps {
  slices: DonutSlice[];
  spent: number;
  limit: number;
  formatCurrency: (n: number) => string;
  className?: string;
  activeLabel?: string | null;
}

const RADIAN = Math.PI / 180;

function exteriorPercentLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
}) {
  if (
    cx == null ||
    cy == null ||
    midAngle == null ||
    outerRadius == null ||
    percent == null ||
    percent < 0.03
  ) {
    return null;
  }
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill={CHART_THEME_COLORS.TICK}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export function DonutChartCard({
  slices,
  spent,
  limit,
  formatCurrency,
  className,
  activeLabel,
}: DonutChartCardProps) {
  const data = slices.map((s, i) => ({
    ...s,
    color: s.color ?? STITCH_CHART_COLORS[i % STITCH_CHART_COLORS.length],
  }));
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const total = data.reduce((a, s) => a + s.value, 0) || 1;

  return (
    <div className={cn("rounded-card bg-white p-4 shadow-card", className)}>
      <div className="relative mx-auto h-64 w-full max-w-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={CHART_CONFIG.PIE_INNER_RADIUS}
              outerRadius={CHART_CONFIG.PIE_OUTER_RADIUS - 12}
              paddingAngle={2}
              strokeWidth={1}
              label={exteriorPercentLabel}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  stroke={CHART_THEME_COLORS.SEGMENT_STROKE}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-brand-deep">{pct}%</p>
          <p className="mt-0.5 text-xs font-medium text-gray-400">
            {UI_TEXT.YOUVE_SPENT}
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-brand-deep">
            {CURRENCY_SYMBOL}
            {formatCurrency(spent)}
          </p>
          <p className="text-xs text-gray-400">
            {UI_TEXT.OF} {CURRENCY_SYMBOL}
            {formatCurrency(limit)}
          </p>
        </div>
        {activeLabel && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-medium text-white shadow-md">
            {activeLabel}
          </div>
        )}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {data.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-xs text-gray-600">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            <span className="truncate font-medium">{s.name}</span>
            <span className="sr-only">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
