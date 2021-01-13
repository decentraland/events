import Sender from 'decentraland-gatsby/dist/entities/Mail/sender'
import env, { requiredEnv } from 'decentraland-gatsby/dist/utils/env'

const SERVICE_DOMAIN = env('SERVICE_DOMAIN', 'decentraland.org')
const AWS_ACCESS_KEY = requiredEnv('AWS_ACCESS_KEY')
const AWS_ACCESS_SECRET = requiredEnv('AWS_ACCESS_SECRET')
const AWS_EMAIL_DOMAIN = requiredEnv('AWS_EMAIL_DOMAIN')
const AWS_REGION = env('AWS_REGION', 'us-east-1')

export default new Sender({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_ACCESS_SECRET,
  region: AWS_REGION,
  source: `Decentraland Events <hello@${SERVICE_DOMAIN}>`,
  bulk: process.env.NODE_ENV === 'production',
  path: 'templates'
})