export const waveSteps = ['list', 'enrich', 'stats', 'done'] as const
export type WaveStep = (typeof waveSteps)[number]
