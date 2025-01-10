export const operationTypes = ['connect', 'newEmail'] as const
export type OperationType = (typeof operationTypes)[number]
