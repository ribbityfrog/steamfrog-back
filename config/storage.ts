import env from '#start/env'
import { S3DriverOptions } from 'flydrive/drivers/s3/types'

const storageConfig: S3DriverOptions = {
  credentials: {
    accessKeyId: env.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: env.get('S3_SECRET_ACCESS_KEY'),
  },

  endpoint: env.get('S3_ENDPOINT'),
  region: env.get('S3_REGION'),
  bucket: env.get('S3_BUCKET'),

  supportsACL: env.get('S3_ACL'),
  visibility: env.get('S3_VISIBILITY'),
}

export default storageConfig
