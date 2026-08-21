"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function StakeholderLevelChart({
  data,
}: {
  data: { level: string; count: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <div style={{ height: Math.max(data.length * 36, 90) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#E3E5EA" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#8891A3" }}
            axisLine={{ stroke: "#E3E5EA" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="level"
            width={90}
            tick={{ fontSize: 12, fill: "#1E3058" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E3E5EA",
              fontSize: 12,
              fontFamily: "var(--font-montserrat), sans-serif",
            }}
            labelStyle={{ color: "#1E3058", fontWeight: 600 }}
            formatter={(value) => [value, "Engagements"]}
          />
          <Bar dataKey="count" fill="#2D4C8D" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
