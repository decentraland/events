import { fetchFlags } from "@dcl/feature-flags"
import { EthAddress } from "@dcl/schemas/dist/misc"
import logger from "decentraland-gatsby/dist/entities/Development/logger"

import { Flags } from "./features"

const FOUNDATION_NAME = "Decentraland Foundation"

let cachedAddresses: string[] = []

function parseAddressesFromVariantPayload(value: string | undefined): string[] {
  if (!value || typeof value !== "string") {
    return []
  }
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((a): a is string => typeof a === "string")
      .map((a) => a.toLowerCase().trim())
      .filter((a) => EthAddress.validate(a))
  } catch {
    return []
  }
}

export async function refreshFoundationAddresses() {
  try {
    const result = await fetchFlags({ applicationName: ["events", "dapps"] })
    if (result.error) {
      throw result.error
    }
    const variant = result.variants?.[Flags.DCLFoundationAddresses]
    cachedAddresses =
      !variant?.enabled || !variant.payload?.value
        ? []
        : parseAddressesFromVariantPayload(variant.payload.value)
    logger.log("Refreshed foundation addresses", {
      count: cachedAddresses.length,
    })
  } catch (error) {
    logger.error("Failed to refresh foundation addresses", {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export function getEventCreatorDisplayName(
  address: string,
  currentName: string | null
): string | null {
  if (cachedAddresses.length === 0) {
    return currentName
  }
  if (cachedAddresses.includes(address.toLowerCase())) {
    return FOUNDATION_NAME
  }
  return currentName
}
