import API from "decentraland-gatsby/dist/utils/api/API"
import Options from "decentraland-gatsby/dist/utils/api/Options"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import env from "decentraland-gatsby/dist/utils/env"

export type SceneParticipantsResponse = {
  ok: boolean
  data: {
    addresses: string[]
  }
}

type CachedParticipants = {
  addresses: string[]
  expiresAt: number
}

export default class CommsGatekeeper extends API {
  static Url = env(
    `COMMS_GATEKEEPER_URL`,
    "https://comms-gatekeeper.decentraland.zone"
  )

  static Cache = new Map<string, CommsGatekeeper>()

  // Cache for participant addresses with 5-minute TTL
  private static participantsCache = new Map<string, CachedParticipants>()
  private static readonly CACHE_TTL_MS = Time.Minute * 5 // 5 minutes

  static from(url: string) {
    if (!this.Cache.has(url)) {
      this.Cache.set(url, new CommsGatekeeper(url))
    }
    return this.Cache.get(url)!
  }

  static get() {
    return this.from(env("COMMS_GATEKEEPER_URL", this.Url))
  }

  /**
   * Get the list of participant wallet addresses in a scene room.
   * @param pointer - Scene base parcel (e.g., "-7,-2"). The scene ID is resolved from the catalyst.
   * @param realmName - Realm name (default: "main")
   * @returns List of wallet addresses connected to the room
   */
  async getSceneParticipants(
    pointer: string,
    realmName = "main"
  ): Promise<string[]> {
    const cacheKey = `scene:${pointer}:${realmName}`
    const cached = CommsGatekeeper.participantsCache.get(cacheKey)

    // Return cached value if it exists and hasn't expired
    if (cached && cached.expiresAt > Date.now()) {
      return cached.addresses
    }

    const { signal, abort } = new AbortController()
    const fetchOptions = new Options({ signal })

    const timeoutId = setTimeout(() => {
      abort()
    }, Time.Second * 10)

    try {
      const params = new URLSearchParams({
        pointer,
        realm_name: realmName,
      })
      const response = await this.fetch<SceneParticipantsResponse>(
        `/scene-participants?${params}`,
        fetchOptions
      )
      const addresses = response.data.addresses

      // Cache the result with expiration
      CommsGatekeeper.participantsCache.set(cacheKey, {
        addresses,
        expiresAt: Date.now() + CommsGatekeeper.CACHE_TTL_MS,
      })

      return addresses
    } catch (error) {
      console.error(
        `Error fetching scene participants for pointer ${pointer}:`,
        error
      )
      return []
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Get the list of participant wallet addresses in a world room.
   * Uses realm_name parameter which is treated as a world name when no pointer is provided.
   * @param worldName - World name (e.g., "mycoolworld.dcl.eth")
   * @returns List of wallet addresses connected to the room
   */
  async getWorldParticipants(worldName: string): Promise<string[]> {
    const cacheKey = `world:${worldName}`
    const cached = CommsGatekeeper.participantsCache.get(cacheKey)

    // Return cached value if it exists and hasn't expired
    if (cached && cached.expiresAt > Date.now()) {
      return cached.addresses
    }

    const { signal, abort } = new AbortController()
    const fetchOptions = new Options({ signal })

    const timeoutId = setTimeout(() => {
      abort()
    }, Time.Second * 10)

    try {
      const params = new URLSearchParams({ realm_name: worldName })
      const response = await this.fetch<SceneParticipantsResponse>(
        `/scene-participants?${params}`,
        fetchOptions
      )
      const addresses = response.data.addresses

      // Cache the result with expiration
      CommsGatekeeper.participantsCache.set(cacheKey, {
        addresses,
        expiresAt: Date.now() + CommsGatekeeper.CACHE_TTL_MS,
      })

      return addresses
    } catch (error) {
      console.error(
        `Error fetching world participants for ${worldName}:`,
        error
      )
      return []
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
