"use client";

/**
 * All Recharts code lives in this module, which the dashboard loads with next/dynamic,
 * so the charting library is split out of every other page's bundle.
 *
 * Mark specs follow the dataviz guidance: 2px lines, ~10% area wash, ≤20px bars with a
 * 4px rounded data-end (square at the baseline), hairline solid grid, surface-gap
 * separation on the donut, values at bar tips, text in text tokens (never series colors).
 */
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { TrendInterval } from "@/lib/api/dashboard";
import { formatBucketLabel, formatBucketTick } from "@/lib/dashboard-period";

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
const ACCENT = "var(--chart-accent)";

/** Tooltip shell: value leads (strong), label follows (muted); line key, not a box. */
function TooltipShell({ title, rows }: { title: string; rows: Array<{ key?: string; value: string; label: string }> }) {
  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1.5 text-xs text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            {row.key && <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.key }} aria-hidden />}
            <span className="text-sm font-semibold tabular-nums">{row.value}</span>
            <span className="text-xs text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- trend (area)

export function TrendChart({
  points,
  interval,
  height,
}: {
  points: Array<{ bucket: string; count: number }>;
  interval: TrendInterval;
  height: number;
}) {
  const spansYears = points.length > 0 && points[0]!.bucket.slice(0, 4) !== points.at(-1)!.bucket.slice(0, 4);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.14} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="bucket"
          tickFormatter={(b: string) => formatBucketTick(b, interval, spansYears)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          minTickGap={24}
          tickMargin={8}
        />
        <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeOpacity: 0.4 }}
          content={({ active, payload }: TooltipContentProps) => {
            const point = payload?.[0]?.payload as { bucket: string; count: number } | undefined;
            if (!active || !point) return null;
            return (
              <TooltipShell
                // The last bucket is the current, still-open period — say so, so a dip isn't misread.
                title={`${formatBucketLabel(point.bucket, interval)}${point.bucket === points.at(-1)?.bucket ? " (to date)" : ""}`}
                rows={[{ key: ACCENT, value: point.count.toLocaleString(), label: point.count === 1 ? "registration" : "registrations" }]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Registrations"
          stroke={ACCENT}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#trend-fill)"
          dot={false}
          activeDot={{ r: 4.5, fill: ACCENT, stroke: "var(--card)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------- ranked horizontal bars

export interface RankedBarDatum {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  /** Extra tooltip line, e.g. "57 patients". */
  detail?: string;
  href?: string;
}

const BAR_ROW = 34;

export function rankedBarsHeight(count: number) {
  return Math.max(count, 1) * BAR_ROW + 8;
}

const MAX_LABEL = 22;

/** Single-line category label (Recharts' default tick wraps long names); full name on hover. */
function CategoryTick({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value: string } }) {
  const value = payload?.value ?? "";
  const text = value.length > MAX_LABEL ? `${value.slice(0, MAX_LABEL - 1)}…` : value;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="var(--foreground)" fontSize={12}>
      <title>{value}</title>
      {text}
    </text>
  );
}

export function RankedBarChart({ data, valueLabel }: { data: RankedBarDatum[]; valueLabel: [string, string] }) {
  const router = useRouter();
  const longest = Math.min(MAX_LABEL, Math.max(...data.map((d) => d.label.length), 8));
  // ~6.6px per character at 12px, plus the tick margin.
  const labelWidth = Math.round(longest * 6.6 + 16);
  const clickable = data.some((d) => d.href);

  return (
    <ResponsiveContainer width="100%" height={rankedBarsHeight(data.length)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
        barCategoryGap={8}
        className={clickable ? "cursor-pointer" : undefined}
        // Chart-level click: the hovered row is the hit target (bigger than the bar, and not
        // blocked by the tooltip's highlight band, which renders above the bars on hover).
        onClick={(state) => {
          const href = data[Number(state.activeTooltipIndex)]?.href;
          if (href) router.push(href);
        }}
      >
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="label"
          width={labelWidth}
          tick={CategoryTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={({ active, payload }: TooltipContentProps) => {
            const d = payload?.[0]?.payload as RankedBarDatum | undefined;
            if (!active || !d) return null;
            return (
              <TooltipShell
                title={d.sublabel ? `${d.label} · ${d.sublabel}` : d.label}
                rows={[
                  { key: ACCENT, value: d.value.toLocaleString(), label: d.value === 1 ? valueLabel[0] : valueLabel[1] },
                  ...(d.detail ? [{ value: "", label: d.detail }] : []),
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="value"
          fill={ACCENT}
          maxBarSize={20}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
          activeBar={{ fillOpacity: 0.8 }}
        >
          <LabelList dataKey="value" position="right" offset={8} className="fill-muted-foreground text-xs tabular-nums" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------- donut (≤ 6 segments)

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({ data, total, centerLabel }: { data: DonutDatum[]; total: number; centerLabel: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[11rem]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }: TooltipContentProps) => {
              const d = payload?.[0]?.payload as DonutDatum | undefined;
              if (!active || !d) return null;
              const share = total ? Math.round((d.value / total) * 100) : 0;
              return <TooltipShell title={d.name} rows={[{ key: d.color, value: d.value.toLocaleString(), label: `patients · ${share}%` }]} />;
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="96%"
            startAngle={90}
            endAngle={-270}
            // 2px surface-colored stroke = the surface gap between segments.
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold">{total.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}
