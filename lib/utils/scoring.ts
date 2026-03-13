export function calculateRecencyScore(date: Date | string): number {
  const now = new Date();
  const then = new Date(date);
  const daysDiff = (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 30) return 1.0;
  if (daysDiff <= 90) return 0.85;
  if (daysDiff <= 180) return 0.7;
  if (daysDiff <= 365) return 0.5;
  if (daysDiff <= 730) return 0.3;
  return 0.1;
}

export function calculateCrossSourceRelevance(sourceCount: number): number {
  const base = 0.5;
  const bonus = sourceCount * 0.15;
  return Math.min(1.0, base + bonus);
}

export function compositeScore(recency: number, crossSource: number, confidence: number): number {
  return recency * 0.4 + crossSource * 0.3 + confidence * 0.3;
}
