import AWS from "aws-sdk"
import { promisify } from "util"
import fileUpload, { UploadedFile } from "express-fileupload"
import { requiredEnv } from "decentraland-gatsby/dist/utils/env"
import routes from "decentraland-gatsby/dist/entities/Route/routes"
import {
  auth,
  WithAuth,
} from "decentraland-gatsby/dist/entities/Auth/middleware"
import handle from "decentraland-gatsby/dist/entities/Route/handle"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import {
  POSTER_FILE_SIZE,
  POSTER_FILE_TYPES,
  PosterAttributes,
  extension,
} from "./types"
import { withAuthProfile } from "decentraland-gatsby/dist/entities/Profile/middleware"
import logger from "decentraland-gatsby/dist/entities/Development/logger"

let BUCKET_CHECKED = false
let BUCKET_CHECKED_JOB: Promise<void> | null = null
const ACCESS_KEY = requiredEnv("AWS_ACCESS_KEY")
const ACCESS_SECRET = requiredEnv("AWS_ACCESS_SECRET")
const BUCKET_NAME = requiredEnv("AWS_BUCKET_NAME")
const BUCKET_URL = requiredEnv("AWS_BUCKET_URL")
const BUCKET_DIR = "poster"

const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: ACCESS_SECRET,
})

export default routes((router) => {
  const withAuth = auth()
  const withFile = fileUpload({
    limits: { fileSize: POSTER_FILE_SIZE },
    abortOnLimit: true,
    limitHandler: handle(async () => {
      throw new RequestError(
        `File size limit has been reached`,
        RequestError.PayloadTooLarge
      )
    }),
  })
  router.post(
    "/poster",
    withAuth,
    withAuthProfile(),
    withFile,
    handle(uploadPoster)
  )
})

export async function uploadPoster(req: WithAuth): Promise<PosterAttributes> {
  if (!req.files || !req.files.poster) {
    throw new RequestError(`Poster param is required`, RequestError.BadRequest)
  }

  const poster = req.files.poster as UploadedFile
  if (Array.isArray(poster)) {
    throw new RequestError(
      `Multiple files are not allowed`,
      RequestError.BadRequest
    )
  }

  if (poster.size === 0) {
    throw new RequestError(
      `Empty files are not allowed`,
      RequestError.BadRequest
    )
  }

  const [type] = poster.mimetype.split(";")
  if (!POSTER_FILE_TYPES.includes(type)) {
    throw new RequestError(`Invalid file type ${type}`, RequestError.BadRequest)
  }

  const initial = Date.now()
  const auth = req.auth as string
  const size = poster.size
  const ext = extension(type)
  const timeHash = Math.floor(initial / 1000)
    .toString(16)
    .toLowerCase()
  const userHash = auth.slice(-8).toLowerCase()
  const filename = BUCKET_DIR + "/" + userHash + timeHash + ext
  await ensure()

  const params: AWS.S3.Types.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: poster.data,
    ACL: "public-read",
    CacheControl: "public, max-age=31536000, immutable",
  }

  await new Promise((resolve, reject) =>
    s3.upload(params, (err: Error | null | undefined, data?: any) =>
      err ? reject(err) : resolve(data)
    )
  )

  const time = ((Date.now() - initial) / 1000).toFixed(3)
  const result = {
    filename,
    url: BUCKET_URL + "/" + filename,
    size,
    type,
  }

  logger.log(`new poster created: ${JSON.stringify(result)} (time: ${time}s)`, {
    poster: result,
    time,
  })
  return result
}

async function ensure() {
  if (BUCKET_CHECKED) {
    return BUCKET_CHECKED
  }

  if (BUCKET_CHECKED_JOB) {
    return BUCKET_CHECKED_JOB
  }

  BUCKET_CHECKED_JOB = (async () => {
    try {
      await headBucket({ Bucket: BUCKET_NAME })
      const bucketExists = await headObject({
        Bucket: BUCKET_NAME,
        Key: BUCKET_DIR,
      })
      if (!bucketExists) {
        await putObject({
          Bucket: BUCKET_NAME,
          Key: BUCKET_DIR,
          ACL: "public-read",
        })
      }

      BUCKET_CHECKED = true
    } catch (err) {
      BUCKET_CHECKED_JOB = null
      throw new RequestError(
        `Service unavailable`,
        RequestError.ServiceUnavailable,
        { ...(err as any) }
      )
    }
  })()

  return BUCKET_CHECKED_JOB
}

async function headBucket(options: AWS.S3.HeadBucketRequest) {
  return promisify((cb) => s3.headBucket(options, cb))().catch((err) => {
    err.operation = "headBucket"
    err.options = options
    throw err
  })
}

async function headObject(options: AWS.S3.HeadObjectRequest) {
  return promisify((cb) => s3.headObject(options, cb))().catch((err) => {
    if (err.statusCode === 404) {
      return false
    }

    err.operation = "headObject"
    err.options = options
    throw err
  })
}

async function putObject(options: AWS.S3.PutObjectRequest) {
  return promisify((cb) => s3.putObject(options, cb))().catch((err) => {
    err.operation = "putObject"
    err.options = options
    throw err
  })
}
