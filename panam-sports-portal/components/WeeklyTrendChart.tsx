"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function WeeklyTrendChart({
  data,
}: {
  data: { week: string; avgProgress: number; period: string | null }[];
}) {
  if (data.length < 2) return null;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#E3E5EA" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "#8891A3" }}
            axisLine={{ stroke: "#E3E5EA" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 11, fill: "#8891A3" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E3E5EA",
              fontSize: 12,
              fontFamily: "var(--font-montserrat), sans-serif",
            }}
            labelStyle={{ color: "#1E3058", fontWeight: 600 }}
            labelFormatter={(label, payload) => {
              const period = payload?.[0]?.payload?.period as string | null | undefined;
              return period ? `${label} · ${period}` : label;
            }}
            formatter={(value) => [`${value}/10`, "Avg. progress"]}
          />
          <Line
            type="monotone"
            dataKey="avgProgress"
            stroke="#1E3058"
            strokeWidth={2}
            dot={{ r: 3, fill: "#A39161", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
