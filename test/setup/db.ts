import database from "decentraland-gatsby/dist/entities/Database/database"

const TABLES_TO_CLEAN = [
  "event_attendees",
  "profile_subscriptions",
  "profile_settings",
  "notification_cursors",
  "events",
]

/**
 * Validates that the current environment is safe for destructive database operations.
 * Requires:
 *  1. NODE_ENV=test
 *  2. CONNECTION_STRING pointing to localhost or 127.0.0.1
 *  3. Database name containing "test" (guards against port-forwarded production databases)
 */
function assertTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Refused to run: NODE_ENV is not 'test'. " +
        "Set NODE_ENV=test to use the test database helpers."
    )
  }

  const connectionString = process.env.CONNECTION_STRING || ""
  const isLocalConnection =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")

  if (!isLocalConnection) {
    throw new Error(
      "Refused to run: CONNECTION_STRING is not a local database. " +
        "Use a localhost or 127.0.0.1 connection for tests."
    )
  }

  const dbName = extractDatabaseName(connectionString)
  if (!dbName || !dbName.includes("test")) {
    throw new Error(
      `Refused to run: database name "${
        dbName || ""
      }" does not contain "test". ` +
        "Use a database name like 'events_test' to prevent accidental " +
        "data loss on port-forwarded production databases."
    )
  }
}

function extractDatabaseName(connectionString: string): string | null {
  try {
    const url = new URL(connectionString)
    const dbName = url.pathname.replace(/^\//, "")
    return dbName || null
  } catch {
    const match = connectionString.match(/dbname=(\S+)/)
    return match?.[1] || null
  }
}

export async function initTestDb(): Promise<void> {
  assertTestEnvironment()
  await database.connect()
}

export async function cleanTables(): Promise<void> {
  assertTestEnvironment()
  for (const table of TABLES_TO_CLEAN) {
    await database.query(`TRUNCATE TABLE ${table} CASCADE`)
  }
}

export async function closeTestDb(): Promise<void> {
  await database.close()
}
