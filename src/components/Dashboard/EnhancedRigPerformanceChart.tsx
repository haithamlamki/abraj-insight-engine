import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { RigPerformanceData } from "@/hooks/useRigPerformanceData";

interface EnhancedRigPerformanceChartProps {
  rigs: RigPerformanceData[];
  metric: "efficiency" | "npt" | "compliance";
}

export function EnhancedRigPerformanceChart({
  rigs,
  metric,
}: EnhancedRigPerformanceChartProps) {
  // Prepare data for the chart
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthData: any = {
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
      monthNumber: i + 1,
    };

    rigs.forEach((rig) => {
      const data = rig.monthlyData.find((m) => m.month === i + 1);
      if (data) {
        if (metric === "efficiency") {
          monthData[rig.rigName] = data.efficiency;
        } else if (metric === "npt") {
          monthData[rig.rigName] = data.actualNPT;
          monthData[`${rig.rigName}_allowable`] = data.allowableNPT;
        } else if (metric === "compliance") {
          monthData[rig.rigName] = data.complianceRate;
        }
      }
    });

    return monthData;
  });

  const getYAxisLabel = () => {
    switch (metric) {
      case "efficiency":
        return "Efficiency (%)";
      case "npt":
        return "NPT (days)";
      case "compliance":
        return "Compliance Rate (%)";
      default:
        return "";
    }
  };

  const getTooltipLabel = (value: number) => {
    switch (metric) {
      case "efficiency":
        return `${value.toFixed(1)}%`;
      case "npt":
        return `${value.toFixed(1)} days`;
      case "compliance":
        return `${value.toFixed(1)}%`;
      default:
        return value.toFixed(1);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          label={{
            value: getYAxisLabel(),
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12 },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
          formatter={(value: number) => getTooltipLabel(value)}
          labelStyle={{ fontWeight: "bold", marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="line"
        />

        {/* Reference lines for targets */}
        {metric === "efficiency" && (
          <ReferenceLine
            y={85}
            stroke="hsl(var(--chart-4))"
            strokeDasharray="5 5"
            label={{
              value: "Target 85%",
              position: "right",
              fontSize: 10,
            }}
          />
        )}
        {metric === "compliance" && (
          <ReferenceLine
            y={90}
            stroke="hsl(var(--chart-4))"
            strokeDasharray="5 5"
            label={{
              value: "Target 90%",
              position: "right",
              fontSize: 10,
            }}
          />
        )}

        {/* Render lines for each rig */}
        {rigs.map((rig, index) => (
          <Line
            key={rig.rigId}
            type="monotone"
            dataKey={rig.rigName}
            stroke={rig.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={rig.rigName}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
