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

export interface StandingPoint {
  date: string;
  eventName: string;
  level: string;
  position: number;
  participants: number;
  standingPct: number;
  smallField: boolean;
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(new Date(`${iso}T00:00:00`));
}

function Dot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: StandingPoint }) {
  if (cx === undefined || cy === undefined || !payload) return null;
  // Hollow dot = small field: the position says less than in a larger field.
  return payload.smallField ? (
    <circle cx={cx} cy={cy} r={4.5} fill="#FFFFFF" stroke="#A39161" strokeWidth={2} />
  ) : (
    <circle cx={cx} cy={cy} r={4} fill="#A39161" />
  );
}

/** Relative position (0-100, 100 = won) of one athlete across events, oldest first. */
export default function StandingChart({ points }: { points: StandingPoint[] }) {
  if (points.length < 2) return null;

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E3E5EA" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 11, fill: "#8891A3" }}
            axisLine={{ stroke: "#E3E5EA" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: "#8891A3" }}
            axisLine={false}
            tickLine={false}
            width={36}
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
              const p = payload?.[0]?.payload as StandingPoint | undefined;
              return p ? `${p.eventName} · ${shortDate(String(label))}` : String(label);
            }}
            formatter={(value, _name, item) => {
              const p = item?.payload as StandingPoint | undefined;
              const detail = p
                ? ` (${p.position} of ${p.participants}${p.smallField ? ", small field" : ""} · ${p.level})`
                : "";
              return [`${value}${detail}`, "Relative position"];
            }}
          />
          <Line
            type="monotone"
            dataKey="standingPct"
            stroke="#1E3058"
            strokeWidth={2}
            dot={<Dot />}
            activeDot={{ r: 6, fill: "#1E3058" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
