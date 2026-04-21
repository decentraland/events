/**
 * Local test script to verify the IDOR fix on the updateEvent endpoint.
 *
 * Usage:
 *   npx ts-node scripts/test-update-event-auth.ts <event_id> <new_title> [port]
 *
 * Example:
 *   npx ts-node scripts/test-update-event-auth.ts 550e8400-e29b-41d4-a716-446655440000 "Hacked Title"
 *   npx ts-node scripts/test-update-event-auth.ts 550e8400-e29b-41d4-a716-446655440000 "Hacked Title" 4000
 *
 * The script creates a random wallet (which will never be the event owner),
 * signs a PATCH request, and sends it to localhost. If the fix is in place,
 * the server should respond with 403 Forbidden.
 */
import { Authenticator } from "@dcl/crypto"
import { Wallet } from "ethers"
import fetch from "node-fetch"

import { signedHeaderFactory } from "decentraland-crypto-fetch"

async function createRandomIdentity() {
  const wallet = Wallet.createRandom()
  const ephemeralWallet = Wallet.createRandom()

  const ephemeralIdentity = {
    privateKey: ephemeralWallet.privateKey,
    publicKey: ephemeralWallet.publicKey,
    address: ephemeralWallet.address,
  }

  const identity = await Authenticator.initializeAuthChain(
    wallet.address,
    ephemeralIdentity,
    60, // 60 minutes expiry
    (message: string) => wallet.signMessage(message)
  )

  console.log(`Wallet address: ${wallet.address}`)
  return identity
}

async function main() {
  const [eventId, newTitle, _portArg] = process.argv.slice(2)

  if (!eventId || !newTitle) {
    console.error(
      "Usage: npx ts-node scripts/test-update-event-auth.ts <event_id> <new_title> [port]"
    )
    process.exit(1)
  }

  // const port = portArg || "4000"
  const baseUrl = `https://events.decentraland.zone`
  const path = `/api/events/${eventId}`
  const url = `${baseUrl}${path}`

  console.log(`Target: PATCH ${url}`)
  console.log(`New title: "${newTitle}"`)
  console.log()

  // Create a random identity (guaranteed non-owner)
  console.log("Creating random wallet identity...")
  const identity = await createRandomIdentity()
  console.log()

  // Build signed headers
  const createHeaders = signedHeaderFactory()
  const headers = createHeaders(identity, "PATCH", path, {})

  // Convert Headers to plain object for node-fetch
  const headerObj: Record<string, string> = {}
  headers.forEach((value: string, key: string) => {
    headerObj[key] = value
  })
  headerObj["Content-Type"] = "application/json"

  const body = JSON.stringify({ name: newTitle })

  console.log(`Sending PATCH request as non-owner...`)
  console.log()

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: headerObj,
      body,
    })

    const responseBody = await response.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(responseBody)
    } catch {
      parsed = responseBody
    }

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Response:`, JSON.stringify(parsed, null, 2))
    console.log()

    if (response.status === 403) {
      console.log(
        "PASS: Server correctly rejected the non-owner update (403 Forbidden)"
      )
      process.exit(0)
    } else if (response.status === 200) {
      console.log("FAIL: Server allowed a non-owner to update the event!")
      console.log("The IDOR vulnerability is still present.")
      process.exit(1)
    } else {
      console.log(
        `INCONCLUSIVE: Unexpected status ${response.status}. ` +
          "Check that the server is running and the event ID exists."
      )
      process.exit(2)
    }
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ECONNREFUSED"
    ) {
      console.error(
        `ERROR: Could not connect to ${baseUrl}. Is the server running?`
      )
    } else {
      console.error("ERROR:", error)
    }
    process.exit(2)
  }
}

main()
