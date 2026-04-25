'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type YearlyAmount = { year: number; amount: number; count: number };

export function YearlyTrendChart({ data }: { data: YearlyAmount[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ed" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#4a5568" />
        <YAxis
          tick={{ fontSize: 10 }}
          stroke="#4a5568"
          tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}백만`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          labelFormatter={(label: number) => `${label}년`}
          formatter={(v: number, _name, item) => {
            if (item?.dataKey === 'amount') {
              return [`${v.toLocaleString('ko-KR')}원`, '집행액'];
            }
            return [v, '건수'];
          }}
        />
        <Bar dataKey="amount" fill="#1e4a7a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
