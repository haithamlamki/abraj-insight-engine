import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { rig: "Rig 101", actual: 25, allowable: 30 },
  { rig: "Rig 204", actual: 42, allowable: 35 },
  { rig: "Rig 301", actual: 177, allowable: 40 },
  { rig: "Rig 405", actual: 18, allowable: 30 },
  { rig: "Rig 508", actual: 28, allowable: 35 },
  { rig: "Rig 612", actual: 54, allowable: 40 },
];

export const NPTChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="rig" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))", 
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)"
          }} 
        />
        <Legend />
        <Bar dataKey="actual" fill="hsl(var(--chart-1))" name="Actual NPT" />
        <Bar dataKey="allowable" fill="hsl(var(--chart-3))" name="Allowable NPT" />
      </BarChart>
    </ResponsiveContainer>
  );
};
