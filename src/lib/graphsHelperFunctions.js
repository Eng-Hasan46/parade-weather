export function calculateSlopeAndIntercept(dataPoints) {
  if (!dataPoints) return { slope: 0, intercept: 0 };
  const years = Object.keys(dataPoints).map(Number);
  const values = Object.values(dataPoints);

  const n = years.length;

  const meanX = years.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (years[i] - meanX) * (values[i] - meanY);
    denominator += (years[i] - meanX) ** 2;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

export function calculateMeanAndStandardDeviation(data) {
  if (!data) return { mean: 0, standardDeviation: 0 };
  const years = Object.keys(data).map(Number);

  let year = years[0];
  let sum = 0;

  Array.from({ length: years.length }).map(() => {
    sum = sum + data[year];

    year++;
  });
  let mean = sum / years.length;

  year = years[0];
  sum = 0;
  Array.from({ length: years.length }).map(() => {
    sum = sum + (data[year] - mean) ** 2;
    year++;
  });

  let variance = sum / years.length;
  let standardDeviation = Math.sqrt(variance);
  return { mean, standardDeviation };
}
