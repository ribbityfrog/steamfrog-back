import { Request } from '@adonisjs/core/http'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import type { ProcessedFile } from '#utils/process_file/types'
import path from 'node:path'
import Except from './except.js'

export default class ProcessFile {
  static async consume(request: Request): Promise<Record<string, MultipartFile | MultipartFile[]>> {
    request.multipart.onFile('file', {}, async (part, reporter) => {
      part.pause()

      const buffer: { parts: Buffer[]; totalSize: number; partsNumber: number } = {
        parts: [],
        totalSize: 0,
        partsNumber: 0,
      }

      part.on('data', reporter)
      part.on('data', (chunk) => {
        buffer.partsNumber++
        buffer.totalSize += chunk.length
        buffer.parts.push(Buffer.from(chunk))
      })
      part.on('end', () => {})

      part.on('error', () => {})

      part.resume()
      return { buffer }
    })

    await request.multipart.process().catch((err) => {
      if (err.status === 413) Except.contentTooLarge({ debug: err })
      else Except.expectationFailed({ debug: err })
    })
    return request.allFiles()
  }

  private static processMultipartFile(file: MultipartFile): ProcessedFile {
    return {
      basics: {
        name: path.parse(file.clientName).name,
        ext: file.extname ?? '',
        type: file.type ?? '',
        subtype: file.subtype ?? '',
        size: file.meta.buffer.totalSize / 1000,
      },
      path: file.filePath,
      buffer: Buffer.concat(
        file.meta.buffer.parts.length > 0 ? file.meta.buffer.parts : [Buffer.from('')]
      ),
    }
  }

  private static processRecordOfMultipartFiles(
    files: Record<string, MultipartFile | MultipartFile[]>
  ): ProcessedFile[] {
    const processedFiles: ProcessedFile[] = []

    Object.values(files).forEach((multipartFile) => {
      if (Array.isArray(multipartFile))
        multipartFile.forEach((file) => processedFiles.push(ProcessFile.processMultipartFile(file)))
      else processedFiles.push(ProcessFile.processMultipartFile(multipartFile))
    })

    return processedFiles
  }

  static async process(
    request: Request,
    options?: {
      maxSizeInKb?: number
      acceptedTypes?: string[]
      acceptedSubtypes?: string[]
      acceptedAspectRatio?: number
    }
  ): Promise<ProcessedFile[]> {
    const consumedFiles = await ProcessFile.consume(request)
    const processedFiles = ProcessFile.processRecordOfMultipartFiles(consumedFiles)

    if (processedFiles.length === 0) Except.unprocessableEntity()

    if (options !== undefined) {
      for (const file of processedFiles) {
        if (options.maxSizeInKb && file.basics.size > options.maxSizeInKb)
          Except.contentTooLarge({ debug: { received: file.basics, excepted: options } })
        if (options.acceptedTypes && !options.acceptedTypes.includes(file.basics.type))
          Except.unsupportedMediaType({ debug: { received: file.basics, excepted: options } })
        if (options.acceptedSubtypes && !options.acceptedSubtypes.includes(file.basics.subtype))
          Except.unsupportedMediaType({ debug: { received: file.basics, excepted: options } })
      }
    }

    return processedFiles
  }
}
