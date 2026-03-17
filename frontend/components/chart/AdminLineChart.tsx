'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export type AdminLineChartProps<T extends Record<string, unknown>> = {
  data: T[];
  xDataKey: keyof T & string;
  yDataKey: keyof T & string;
  /** Y축 눈금 포맷 (예: v => `${(v/10000).toFixed(0)}만`) */
  yTickFormatter?: (v: number) => string;
  /** 툴팁 라벨 (예: "입찰가", "결제액", "신규 가입") */
  tooltipLabel: string;
  /** 툴팁 라벨 접두사 (예: "시간", "날짜") */
  labelPrefix?: string;
  /** 툴팁 값 포맷 (예: formatPrice) - 없으면 숫자 그대로 */
  tooltipValueFormatter?: (value: number) => string;
  height?: number;
  emptyMessage?: string;
};

const CHART_STYLE = {
  margin: { top: 5, right: 20, left: 0, bottom: 5 },
  grid: { strokeDasharray: '3 3', stroke: 'var(--border-main)' },
  axis: { stroke: 'var(--text-muted)', fontSize: 12, tickLine: false },
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-main)',
      borderRadius: '12px',
    },
    labelStyle: { color: 'var(--text-main)' as const },
  },
  line: {
    stroke: 'var(--brand-primary)',
    strokeWidth: 2,
    dot: false,
    activeDot: { r: 4, fill: 'var(--brand-primary)' },
  },
};

export function AdminLineChart<T extends Record<string, unknown>>({
  data,
  xDataKey,
  yDataKey,
  yTickFormatter,
  tooltipLabel,
  labelPrefix = '날짜',
  tooltipValueFormatter = (v) => v.toLocaleString(),
  height = 280,
  emptyMessage = '데이터가 없습니다.',
}: AdminLineChartProps<T>) {
  if (data.length === 0) {
    return (
      <div
        className="w-full rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main p-4 flex items-center justify-center text-text-muted text-sm"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main p-4"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_STYLE.margin}>
          <CartesianGrid
            strokeDasharray={CHART_STYLE.grid.strokeDasharray}
            stroke={CHART_STYLE.grid.stroke}
          />
          <XAxis
            dataKey={xDataKey}
            stroke={CHART_STYLE.axis.stroke}
            fontSize={CHART_STYLE.axis.fontSize}
            tickLine={CHART_STYLE.axis.tickLine}
          />
          <YAxis
            stroke={CHART_STYLE.axis.stroke}
            fontSize={CHART_STYLE.axis.fontSize}
            tickLine={CHART_STYLE.axis.tickLine}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            contentStyle={CHART_STYLE.tooltip.contentStyle}
            labelStyle={CHART_STYLE.tooltip.labelStyle}
            formatter={(value: number | undefined) =>
              value != null ? [tooltipValueFormatter(value), tooltipLabel] : ['-', tooltipLabel]
            }
            labelFormatter={(label) => `${labelPrefix}: ${label}`}
          />
          <Line
            type="monotone"
            dataKey={yDataKey}
            stroke={CHART_STYLE.line.stroke}
            strokeWidth={CHART_STYLE.line.strokeWidth}
            dot={CHART_STYLE.line.dot}
            activeDot={CHART_STYLE.line.activeDot}
            name={yDataKey}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
