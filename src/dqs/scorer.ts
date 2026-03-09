import type { TokenScoreResult } from './collectors/token-score';
import type { CodeStructureResult } from './collectors/code-structure';
import type { ComponentReuseResult } from './collectors/component-reuse';

export interface DimensionScore {
  name: string;
  score: number | null;    // null = N/A (tool not available)
  weight: number;          // relative weight (0-1)
  details: string;
  runHint?: string;        // command to enable this dimension
}

export interface DQSResult {
  overall: number;
  dimensions: DimensionScore[];
  availableDimensions: number;
  totalDimensions: number;
  timestamp: string;
}

export interface ExternalScore {
  score: number;
  details: string;
}

/**
 * Generic DQS computation from an arbitrary set of dimensions.
 * Each profile (frontend / backend / fullstack) builds its own DimensionScore[]
 * and passes it here.
 */
export function computeDQSFromDimensions(dimensions: DimensionScore[]): DQSResult {
  const available = dimensions.filter(d => d.score !== null);
  const totalWeight = available.reduce((sum, d) => sum + d.weight, 0);

  const overall = totalWeight === 0
    ? 0
    : Math.round(
        available.reduce((sum, d) => sum + d.score! * (d.weight / totalWeight), 0),
      );

  return {
    overall,
    dimensions,
    availableDimensions: available.length,
    totalDimensions: dimensions.length,
    timestamp: new Date().toISOString(),
  };
}

/** Frontend DQS — backward-compatible wrapper */
export function computeDQS(
  token: TokenScoreResult,
  structure: CodeStructureResult,
  reuse: ComponentReuseResult,
  axe: ExternalScore | null = null,
  lighthouse: ExternalScore | null = null,
  chromatic: ExternalScore | null = null,
): DQSResult {
  const dimensions: DimensionScore[] = [
    {
      name: 'Token Compliance',
      score: token.score,
      weight: 0.35,
      details: token.details,
    },
    {
      name: 'Component Reuse',
      score: reuse.score,
      weight: 0.25,
      details: reuse.details,
    },
    {
      name: 'Code Structure',
      score: structure.score,
      weight: 0.10,
      details: structure.details,
    },
    {
      name: 'Accessibility',
      score: axe?.score ?? null,
      weight: 0.30,
      details: axe?.details ?? 'Not measured',
      runHint: axe ? undefined : '--html <path> で有効化',
    },
    {
      name: 'Performance',
      score: lighthouse?.score ?? null,
      weight: 0.15,
      details: lighthouse?.details ?? 'Not measured',
      runHint: lighthouse ? undefined : '--url <url> で有効化 (要: 起動済みサーバー)',
    },
    {
      name: 'Visual Consistency',
      score: chromatic?.score ?? null,
      weight: 0.10,
      details: chromatic?.details ?? 'Not measured',
      runHint: chromatic ? undefined : 'npx chromatic --project-token=<token>',
    },
  ];

  return computeDQSFromDimensions(dimensions);
}
