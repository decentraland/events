import type * as awsx from "@pulumi/awsx";

export type GatsbyOptions = {
  /**
   * service name
   *
   * > This value will be injected as SERVICE_NAME env.
   * > SERVICE_VERSION, SERVICE_DOMAIN, SERVICE_TLD, SERVICE_URL will be also injected
   */
  name: string;

  /**
   * define which tld (top level domain will be used)
   * - if `true` will use `.org`, `.today`, `.zone` and `.system`
   * - if `false` will use `.co`, `.net`, `.io` and `.system`
   *
   * @default false
   */
  usePublicTLD?: boolean

  /**
   * define a list of additional domains accepted as alias in cloufront and alb
   *
   * @default []
   */
  additionalDomains?: string[]

  /**
   * Docker image used to create a fargate service
   *
   * > This value will be injected as IMAGE env
   */
  serviceImage?: string | null | undefined | false

  /**
   * (only if serviceImage it's defined)
   * The number of instantiations of the service to place and keep running (only if serviceImage it's defined)
   *
   * @default 1
   */
  serviceDesiredCount?: number

  /**
   * (only if serviceImage it's defined)
   * Memory reserved to the fargare service (in MB)
   *
   * @default 256
   */
  serviceMemory?: number

  /**
   * (only if serviceImage it's defined)
   * Port exposed from fargate service (only if serviceImage it's defined)
   *
   * > This value will be injected as PORT env
   *
   * @default 4000
   */
  servicePort?: number

  /**
   * (only if serviceImage it's defined)
   * Paths mapped from cloudfront into the fargate service
   * if `false` service will be private
   *
   * @default ["/api/*"]
   */
  servicePaths?: string[] | false

  /**
   * (only if serviceImage it's defined)
   * Custom health check path, this endpoint should return a http 200 code
   *
   * @default "/api/status"
   */
  serviceHealthCheck?: string

  /**
   * (only if serviceImage it's defined)
   * Adsitional environment variables exposed into the service
   */
  serviceEnvironment?: awsx.ecs.KeyValuePair[]

  /**
   * (only if serviceImage it's defined)
   * Create a bucket and inject a AWS_ACCESS_{KEY/SECRET} env with read/create access to that bucket
   *  - if `true` the bucket wont be accesible from the web
   *  - if `string[]` paths will be mapped on cloudfront
   *      @example [ '/poster/*' ] => service.decentraland.org/poster/* will map to s3.amazonaws.com/bucket/poster/*
   *
   * it can be used with others `use*` options
   *
   * > This value will be injected as AWS_BUCKET_NAME env
   *
   *  @default false
   */
  useBucket?: boolean | string[]

  /**
   * (only if serviceImage it's defined)
   * Inject AWS_ACCESS_{KEY/SECRET} env with access to send emails
   *  - if `true` will grant access to send emails using the current domain
   *  - if `string[]` will gran access to end emails using any domain in that list
   *
   * > Note: deploy will fail if that domain is not configured in the account
   *
   * it can be used with others `use*` options
   *
   * > The first value will be injected as AWS_EMAIL_DOMAIN env
   *
   * @default false
   */
  useEmail?: boolean | string[]
};