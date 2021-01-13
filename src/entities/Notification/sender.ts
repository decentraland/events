import Sender from 'decentraland-gatsby/dist/entities/Mail/sender'
import env, { requiredEnv } from 'decentraland-gatsby/dist/utils/env'

const AWS_ACCESS_KEY = requiredEnv('AWS_ACCESS_KEY')
const AWS_ACCESS_SECRET = requiredEnv('AWS_ACCESS_SECRET')
const SES_SOURCE = requiredEnv('SES_SOURCE')
const SES_REGION = env('SES_REGION', 'us-east-1')

export default new Sender({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_ACCESS_SECRET,
  region: SES_REGION,
  source: SES_SOURCE,
  bulk: process.env.NODE_ENV === 'production',
  path: 'templates'
})