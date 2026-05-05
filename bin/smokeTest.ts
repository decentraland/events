import fetch from "node-fetch"

type EnvName = "zone" | "prod"

const ENVS: Record<EnvName, string> = {
  zone: "https://events.decentraland.zone",
  prod: "https://events.decentraland.org",
}

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
}

type Check = {
  name: string
  path: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
  expectedStatus: number | number[]
  expectJson?: boolean
  expectKeys?: string[]
  expectArrayMin?: number
  category: "public" | "auth-required" | "admin" | "social"
  optional?: boolean
}

const FAKE_UUID = "00000000-0000-0000-0000-000000000000"

// Resolved at runtime by `discoverFixtures()`. Each env keeps its own pair
// because zone and prod hold different datasets — there's no guarantee any
// given event_id exists in both — so we let each env answer for its own
// fixture instead of forcing an intersection.
const FIXTURES: Record<EnvName, { event_id: string; schedule_id: string }> = {
  zone: { event_id: FAKE_UUID, schedule_id: FAKE_UUID },
  prod: { event_id: FAKE_UUID, schedule_id: FAKE_UUID },
}

const CHECKS: Check[] = [
  {
    name: "GET /api/status",
    path: "/api/status",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /metrics",
    path: "/metrics",
    expectedStatus: [200, 301, 401, 403, 502, 522],
    expectJson: false,
    category: "public",
    optional: true,
  },
  {
    name: "GET /api/events",
    path: "/api/events?limit=5",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events (paginated)",
    path: "/api/events?limit=10&offset=0",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events (upcoming)",
    path: "/api/events?limit=5&list=upcoming",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events (active)",
    path: "/api/events?limit=5&list=active",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events (live)",
    path: "/api/events?limit=5&list=live",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events (search)",
    path: "/api/events?limit=5&search=festival",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events/:id (sample)",
    path: "/api/events/{{event_id}}",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events/:id (404)",
    path: `/api/events/${FAKE_UUID}`,
    expectedStatus: 404,
    expectJson: true,
    category: "public",
  },
  {
    name: "GET /api/events/:id/attendees (sample)",
    path: "/api/events/{{event_id}}/attendees",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/events/categories",
    path: "/api/events/categories",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    expectArrayMin: 1,
    category: "public",
  },
  {
    name: "POST /api/events/search",
    path: "/api/events/search",
    method: "POST",
    body: { limit: 5, list: "upcoming" },
    expectedStatus: [200, 201],
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "POST /api/events/search (no body)",
    path: "/api/events/search",
    method: "POST",
    body: {},
    expectedStatus: [200, 201],
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "POST /api/events/search (malformed)",
    path: "/api/events/search",
    method: "POST",
    body: "not json",
    expectedStatus: 400,
    expectJson: false,
    category: "public",
  },
  {
    name: "GET /api/schedules",
    path: "/api/schedules",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
  },
  {
    name: "GET /api/schedules/:id (sample)",
    path: "/api/schedules/{{schedule_id}}",
    expectedStatus: 200,
    expectJson: true,
    expectKeys: ["data", "ok"],
    category: "public",
    optional: true,
  },
  {
    name: "GET /api/schedules/:id (404)",
    path: `/api/schedules/${FAKE_UUID}`,
    expectedStatus: 404,
    expectJson: true,
    category: "public",
  },
  {
    name: "GET /events/sitemap.xml",
    path: "/events/sitemap.xml",
    expectedStatus: 200,
    expectJson: false,
    category: "social",
  },
  {
    name: "POST /api/events (no auth)",
    path: "/api/events",
    method: "POST",
    body: {},
    expectedStatus: [400, 401],
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "PATCH /api/events/:id (no auth)",
    path: `/api/events/${FAKE_UUID}`,
    method: "PATCH",
    body: {},
    expectedStatus: [400, 401],
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "POST /api/events/:id/attendees (no auth)",
    path: `/api/events/${FAKE_UUID}/attendees`,
    method: "POST",
    expectedStatus: [400, 401, 404],
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "DELETE /api/events/:id/attendees (no auth)",
    path: `/api/events/${FAKE_UUID}/attendees`,
    method: "DELETE",
    expectedStatus: [400, 401, 404],
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "GET /api/events/attending (no auth)",
    path: "/api/events/attending",
    expectedStatus: 401,
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "GET /api/profiles/me/settings (no auth)",
    path: "/api/profiles/me/settings",
    expectedStatus: 401,
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "GET /api/profiles/subscriptions (no auth)",
    path: "/api/profiles/subscriptions",
    expectedStatus: 401,
    expectJson: true,
    category: "auth-required",
  },
  {
    name: "POST /api/poster (no auth)",
    path: "/api/poster",
    method: "POST",
    expectedStatus: [400, 401],
    expectJson: true,
    category: "auth-required",
  },
]

type Result = {
  status: number
  ok: boolean
  contentType: string
  ms: number
  body: unknown
  raw: string
  topKeys: string[]
  arrayLen?: number
  error?: string
}

function fillPlaceholders(value: string, env: EnvName): string {
  return value
    .replace(/{{event_id}}/g, FIXTURES[env].event_id)
    .replace(/{{schedule_id}}/g, FIXTURES[env].schedule_id)
}

function fillBody(body: unknown, env: EnvName): unknown {
  if (typeof body === "string") return fillPlaceholders(body, env)
  if (Array.isArray(body)) return body.map((v) => fillBody(v, env))
  if (body && typeof body === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      out[k] = fillBody(v, env)
    }
    return out
  }
  return body
}

// Cloudflare WAF / rate-limit responses come with this exact key. We use it
// to (a) retry once with the suggested backoff, (b) downgrade to "warn" so a
// transient edge block doesn't break the whole run.
function isCloudflareBlock(
  body: unknown
): body is { cloudflare_error?: unknown; retry_after?: number } {
  return (
    !!body &&
    typeof body === "object" &&
    "cloudflare_error" in (body as Record<string, unknown>)
  )
}

async function runOneOnce(env: EnvName, check: Check): Promise<Result> {
  const baseUrl = ENVS[env]
  const url = `${baseUrl}${fillPlaceholders(check.path, env)}`
  const started = Date.now()
  try {
    const init: Parameters<typeof fetch>[1] = {
      method: check.method ?? "GET",
      headers: {
        accept:
          check.expectJson === false
            ? "text/html,application/xml"
            : "application/json",
        ...(check.body !== undefined
          ? { "content-type": "application/json" }
          : {}),
        ...check.headers,
      },
      timeout: 30_000,
    } as never
    if (check.body !== undefined) {
      init.body =
        typeof check.body === "string"
          ? (check.body as string)
          : JSON.stringify(fillBody(check.body, env))
    }
    const res = await fetch(url, init)
    const ms = Date.now() - started
    const raw = await res.text()
    const contentType = res.headers.get("content-type") ?? ""
    let body: unknown = raw
    let topKeys: string[] = []
    let arrayLen: number | undefined
    if (contentType.includes("application/json")) {
      try {
        body = JSON.parse(raw)
        if (Array.isArray((body as { data?: unknown }).data)) {
          arrayLen = (body as { data: unknown[] }).data.length
        } else if (Array.isArray(body)) {
          arrayLen = (body as unknown[]).length
        }
        topKeys =
          body && typeof body === "object" && !Array.isArray(body)
            ? Object.keys(body as Record<string, unknown>).sort()
            : []
      } catch {
        // not JSON despite header
      }
    }
    return {
      status: res.status,
      ok: res.ok,
      contentType,
      ms,
      body,
      raw,
      topKeys,
      arrayLen,
    }
  } catch (error) {
    return {
      status: 0,
      ok: false,
      contentType: "",
      ms: Date.now() - started,
      body: null,
      raw: "",
      topKeys: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function runOne(env: EnvName, check: Check): Promise<Result> {
  let result = await runOneOnce(env, check)
  if (result.status === 429 && isCloudflareBlock(result.body)) {
    const wait = Math.min(
      ((result.body as { retry_after?: number }).retry_after ?? 1) * 1000,
      5000
    )
    await new Promise((r) => setTimeout(r, wait))
    result = await runOneOnce(env, check)
  }
  return result
}

function statusOk(actual: number, expected: number | number[]): boolean {
  return Array.isArray(expected)
    ? expected.includes(actual)
    : actual === expected
}

function color(text: string, c: keyof typeof COLORS): string {
  return `${COLORS[c]}${text}${COLORS.reset}`
}

function pad(text: string, width: number): string {
  if (text.length >= width) return text
  return text + " ".repeat(width - text.length)
}

type Diff = {
  check: Check
  zone: Result
  prod: Result
  issues: string[]
  severity: "ok" | "warn" | "fail"
}

function compare(check: Check, zone: Result, prod: Result): Diff {
  const issues: string[] = []
  let severity: Diff["severity"] = "ok"
  // If the edge (Cloudflare WAF) blocked the request, the API itself never
  // got a chance to answer — that's environmental, not a real contract drift,
  // so we downgrade fails to warns instead of failing the run.
  const cloudflareBlocked =
    isCloudflareBlock(zone.body) || isCloudflareBlock(prod.body)
  const failSeverity: Diff["severity"] =
    check.optional || cloudflareBlocked ? "warn" : "fail"

  for (const [envName, res] of [
    ["zone", zone],
    ["prod", prod],
  ] as const) {
    if (res.error) {
      issues.push(`${envName}: network error: ${res.error}`)
      severity = failSeverity
      continue
    }
    if (!statusOk(res.status, check.expectedStatus)) {
      issues.push(
        `${envName}: status ${res.status} not in expected ${JSON.stringify(
          check.expectedStatus
        )}`
      )
      severity = failSeverity
    }
    if (check.expectJson && !res.contentType.includes("application/json")) {
      issues.push(
        `${envName}: expected JSON but got content-type "${res.contentType}"`
      )
      severity = severity === "fail" ? "fail" : "warn"
    }
    if (
      check.expectJson === false &&
      !res.contentType.includes("text/html") &&
      !res.contentType.includes("application/xml") &&
      !res.contentType.includes("text/xml") &&
      !res.contentType.includes("text/plain")
    ) {
      issues.push(
        `${envName}: expected non-JSON but got content-type "${res.contentType}"`
      )
      severity = severity === "fail" ? "fail" : "warn"
    }
    if (check.expectKeys && res.topKeys.length > 0) {
      for (const key of check.expectKeys) {
        if (!res.topKeys.includes(key)) {
          issues.push(
            `${envName}: missing top-level key "${key}" (got ${JSON.stringify(
              res.topKeys
            )})`
          )
          severity = failSeverity
        }
      }
    }
    if (
      check.expectArrayMin !== undefined &&
      res.arrayLen !== undefined &&
      res.arrayLen < check.expectArrayMin
    ) {
      issues.push(
        `${envName}: array length ${res.arrayLen} below minimum ${check.expectArrayMin}`
      )
      severity = severity === "fail" ? "fail" : "warn"
    }
  }

  if (zone.status !== prod.status && severity !== "fail") {
    issues.push(`status mismatch zone=${zone.status} vs prod=${prod.status}`)
    severity = "warn"
  }

  if (
    zone.topKeys.length > 0 &&
    prod.topKeys.length > 0 &&
    JSON.stringify(zone.topKeys) !== JSON.stringify(prod.topKeys)
  ) {
    issues.push(
      `top-level shape mismatch: zone=${JSON.stringify(
        zone.topKeys
      )} prod=${JSON.stringify(prod.topKeys)}`
    )
    severity = failSeverity
  }
  if (cloudflareBlocked) {
    issues.push(
      `cloudflare WAF blocked one env (status=${
        isCloudflareBlock(zone.body)
          ? `zone=${zone.status}`
          : `prod=${prod.status}`
      }) — re-run to recover`
    )
  }

  return { check, zone, prod, issues, severity }
}

function fmtRow(d: Diff): string {
  const sevIcon =
    d.severity === "ok"
      ? color("✓", "green")
      : d.severity === "warn"
      ? color("!", "yellow")
      : color("✗", "red")
  const zoneStatus = d.zone.error
    ? color("ERR", "red")
    : color(String(d.zone.status), d.zone.ok ? "green" : "yellow")
  const prodStatus = d.prod.error
    ? color("ERR", "red")
    : color(String(d.prod.status), d.prod.ok ? "green" : "yellow")
  const zoneLen = d.zone.arrayLen !== undefined ? `[${d.zone.arrayLen}]` : ""
  const prodLen = d.prod.arrayLen !== undefined ? `[${d.prod.arrayLen}]` : ""
  return `${sevIcon} ${pad(d.check.name, 50)}  zone:${zoneStatus}${zoneLen} ${
    d.zone.ms
  }ms  prod:${prodStatus}${prodLen} ${d.prod.ms}ms`
}

async function discoverFixturesFor(env: EnvName) {
  const [events, schedules] = await Promise.all([
    fetch(`${ENVS[env]}/api/events?limit=1`)
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
    fetch(`${ENVS[env]}/api/schedules`)
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
  ])
  const firstEvent = ((events as { data?: { id?: string }[] }).data ?? [])[0]
  const firstSchedule = ((schedules as { data?: { id?: string }[] }).data ??
    [])[0]
  if (firstEvent?.id) FIXTURES[env].event_id = firstEvent.id
  if (firstSchedule?.id) FIXTURES[env].schedule_id = firstSchedule.id
}

async function discoverFixtures() {
  await Promise.all([discoverFixturesFor("zone"), discoverFixturesFor("prod")])
}

function printFixtures() {
  console.log(
    color(
      `Resolved fixtures:\n  zone: event_id=${FIXTURES.zone.event_id} schedule_id=${FIXTURES.zone.schedule_id}\n  prod: event_id=${FIXTURES.prod.event_id} schedule_id=${FIXTURES.prod.schedule_id}`,
      "gray"
    )
  )
}

async function main() {
  const filter =
    process.argv[2] && !process.argv[2].startsWith("--")
      ? process.argv[2]
      : undefined
  const verbose = process.argv.includes("--verbose")

  await discoverFixtures()

  const eventResolved =
    FIXTURES.zone.event_id !== FAKE_UUID && FIXTURES.prod.event_id !== FAKE_UUID
  const scheduleResolved =
    FIXTURES.zone.schedule_id !== FAKE_UUID &&
    FIXTURES.prod.schedule_id !== FAKE_UUID

  const checks = (
    filter
      ? CHECKS.filter((c) =>
          c.name.toLowerCase().includes(filter.toLowerCase())
        )
      : CHECKS
  ).filter((c) => {
    if (c.path.includes("{{event_id}}") && !eventResolved) return false
    if (c.path.includes("{{schedule_id}}") && !scheduleResolved) return false
    return true
  })

  console.log(
    color(
      `\nRunning ${checks.length} smoke checks against ${ENVS.zone} and ${ENVS.prod}`,
      "bold"
    )
  )
  printFixtures()
  console.log("")

  const results: Diff[] = []
  for (const check of checks) {
    const [zone, prod] = await Promise.all([
      runOne("zone", check),
      runOne("prod", check),
    ])
    const diff = compare(check, zone, prod)
    results.push(diff)
    console.log(fmtRow(diff))
    if (verbose || diff.severity !== "ok") {
      for (const issue of diff.issues) {
        console.log(
          `    ${color(issue, diff.severity === "fail" ? "red" : "yellow")}`
        )
      }
    }
  }

  const okCount = results.filter((r) => r.severity === "ok").length
  const warnCount = results.filter((r) => r.severity === "warn").length
  const failCount = results.filter((r) => r.severity === "fail").length

  console.log(
    `\n${color("Summary:", "bold")} ${color(`${okCount} ok`, "green")}, ${color(
      `${warnCount} warn`,
      "yellow"
    )}, ${color(`${failCount} fail`, "red")}`
  )

  if (failCount > 0) {
    console.log(color("\nFailing checks:", "red"))
    for (const r of results.filter((x) => x.severity === "fail")) {
      console.log(`  ${color("✗", "red")} ${r.check.name}`)
      for (const issue of r.issues) {
        console.log(`      ${color(issue, "red")}`)
      }
    }
  }

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(color(`Fatal: ${error}`, "red"))
  process.exit(2)
})
