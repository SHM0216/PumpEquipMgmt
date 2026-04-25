'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLOR: Record<string, string> = {
  normal: '#2f855a',
  overdue: '#c53030',
  long: '#1e4a7a',
  new: '#b16a1b',
  done: '#48bb78',
};

const LABEL: Record<string, string> = {
  normal: '정상주기',
  overdue: '★ 누적지연',
  long: '장기주기',
  new: '◆ 신설',
  done: '✓ 완료',
};

export function PartStatusDonut({
  data,
}: {
  data: Array<{ status: string; count: number }>;
}) {
  const labeled = data
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, name: LABEL[d.status] ?? d.status }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={labeled}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={88}
          paddingAngle={1}
        >
          {labeled.map((d) => (
            <Cell key={d.status} fill={COLOR[d.status] ?? '#4a5568'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(v: number) => [`${v}건`, '']}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
