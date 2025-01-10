export type BasicFile = {
  name: string
  type: string
  subtype: string
  ext: string
  size: number
}

export type ProcessedFile = {
  basics: BasicFile
  path?: string
  buffer: Buffer
}
