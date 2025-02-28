export const waveSteps = ['list', 'items', 'details', 'stats', 'done', 'wait'] as const
export type WaveStep = (typeof waveSteps)[number]
