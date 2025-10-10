import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", production: 85, target: 90 },
  { month: "Feb", production: 88, target: 90 },
  { month: "Mar", production: 92, target: 90 },
  { month: "Apr", production: 87, target: 90 },
  { month: "May", production: 94, target: 90 },
  { month: "Jun", production: 96, target: 90 },
];

export const RigPerformanceChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: '% Efficiency', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))", 
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)"
          }} 
        />
        <Legend />
        <Line type="monotone" dataKey="production" stroke="hsl(var(--chart-2))" strokeWidth={3} name="Actual Performance" />
        <Line type="monotone" dataKey="target" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 5" name="Target" />
      </LineChart>
    </ResponsiveContainer>
  );
};
