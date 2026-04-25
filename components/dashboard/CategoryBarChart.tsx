'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type CategoryAmount = {
  category: string;
  amount: number;
  count: number;
};

const COLOR_BY_CATEGORY: Record<string, string> = {
  펌프: '#1e4a7a',
  제진기: '#b16a1b',
  전기: '#c53030',
  기계: '#4a5568',
  통신: '#2f855a',
  기타: '#718096',
};

export function CategoryBarChart({ data }: { data: CategoryAmount[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ed" vertical={false} />
        <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#4a5568" />
        <YAxis
          tick={{ fontSize: 10 }}
          stroke="#4a5568"
          tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}백만`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(v: number) => [
            `${v.toLocaleString('ko-KR')}원`,
            '집행액',
          ]}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.category}
              fill={COLOR_BY_CATEGORY[d.category] ?? '#1e4a7a'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
