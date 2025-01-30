export const waveSteps = ['list', 'items', 'details', 'stats', 'done'] as const
export type WaveStep = (typeof waveSteps)[number]
