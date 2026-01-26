'use client';

import { formatPrice } from '@/lib/format';
import {  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export interface PriceHistory {
  time: string;
  price: number;
}

interface PriceTrendChartProps {
  data: PriceHistory[];
}

export default function PriceTrendChart({ data }: PriceTrendChartProps) {
  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.15;

  return (
    <div className="w-full p-6 bg-card rounded-xl border border-border-main">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-text-main">입찰 가격 트렌드</h3>
        <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-status-urgent rounded-full animate-pulse"></span>
                <span className="text-xs text-text-muted">실시간</span>
              </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3182f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={false}
              interval={Math.floor(data.length / 4)}
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fafafa',
              }}
              labelStyle={{ color: '#a1a1aa' }}
              formatter={(value) => [`${formatPrice(value as number)}`, '입찰가']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3182f6"
              strokeWidth={2}
              fill="url(#priceGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
