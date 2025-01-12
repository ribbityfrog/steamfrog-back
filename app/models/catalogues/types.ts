export const appTypes = ['new', 'game', 'dlc'] as const
export type AppType = (typeof appTypes)[number]
