/**
 * Simple Moving Average (SMA) Forecast
 */
export function calculateSMA(data: number[], period: number = 3): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Exponential Smoothing Forecast
 */
export function calculateExponentialSmoothing(
  data: number[],
  alpha: number = 0.3
): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];

  let forecast = data[0];
  for (let i = 1; i < data.length; i++) {
    forecast = alpha * data[i] + (1 - alpha) * forecast;
  }
  return forecast;
}

/**
 * Linear Regression Forecast
 */
export function calculateLinearRegression(
  data: number[]
): { slope: number; intercept: number; nextValue: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, nextValue: 0 };

  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const nextValue = slope * n + intercept;

  return { slope, intercept, nextValue };
}

/**
 * Calculate Standard Deviation
 */
export function calculateStdDev(data: number[]): number {
  if (data.length === 0) return 0;

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;

  return Math.sqrt(variance);
}

/**
 * Hybrid Forecast: Combines SMA, Exponential Smoothing, and Linear Regression
 */
export function calculateHybridForecast(
  data: number[],
  weights: { sma: number; exponential: number; linear: number } = {
    sma: 0.3,
    exponential: 0.4,
    linear: 0.3,
  }
): number {
  const smaValue = calculateSMA(data, 3);
  const expValue = calculateExponentialSmoothing(data, 0.3);
  const { nextValue: linearValue } = calculateLinearRegression(data);

  return (
    weights.sma * smaValue +
    weights.exponential * expValue +
    weights.linear * linearValue
  );
}

/**
 * Generate Forecast for Multiple Periods
 */
export function generateForecast(
  historicalData: number[],
  periods: number = 6
): { forecast: number; upper: number; lower: number }[] {
  const forecasts: { forecast: number; upper: number; lower: number }[] = [];
  const stdDev = calculateStdDev(historicalData);
  const confidenceMultiplier = 1.96; // 95% confidence interval

  let currentData = [...historicalData];

  for (let i = 0; i < periods; i++) {
    const forecast = calculateHybridForecast(currentData);
    
    // Confidence interval widens with time
    const uncertainty = stdDev * confidenceMultiplier * Math.sqrt(i + 1);
    
    forecasts.push({
      forecast: Math.max(0, forecast),
      upper: Math.max(0, forecast + uncertainty),
      lower: Math.max(0, forecast - uncertainty),
    });

    // Add forecast to current data for next iteration
    currentData.push(forecast);
  }

  return forecasts;
}

/**
 * Calculate Forecast Metrics
 */
export function calculateForecastMetrics(
  forecasts: { forecast: number; upper: number; lower: number }[]
): {
  projectedTotal: number;
  avgMonthly: number;
  confidenceLevel: number;
  trend: 'up' | 'down' | 'stable';
} {
  const projectedTotal = forecasts.reduce((sum, f) => sum + f.forecast, 0);
  const avgMonthly = projectedTotal / forecasts.length;

  // Calculate average confidence interval width
  const avgConfidenceWidth =
    forecasts.reduce((sum, f) => sum + (f.upper - f.lower), 0) / forecasts.length;
  const confidenceLevel = Math.max(
    0,
    Math.min(100, 100 - (avgConfidenceWidth / avgMonthly) * 50)
  );

  // Determine trend
  const firstHalf = forecasts
    .slice(0, Math.floor(forecasts.length / 2))
    .reduce((sum, f) => sum + f.forecast, 0);
  const secondHalf = forecasts
    .slice(Math.floor(forecasts.length / 2))
    .reduce((sum, f) => sum + f.forecast, 0);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  const difference = secondHalf - firstHalf;
  const threshold = avgMonthly * 0.05; // 5% threshold

  if (difference > threshold) trend = 'up';
  else if (difference < -threshold) trend = 'down';

  return {
    projectedTotal,
    avgMonthly,
    confidenceLevel,
    trend,
  };
}
