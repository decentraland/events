import Dataloader from "dataloader"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { memo } from "radash/dist/curry"

import Places from "../api/Places"

const CACHE = new Map<string, string>()
export const worlds = new Dataloader(async (worlds_name: readonly string[]) => {
  CACHE.size === 0 && Promise.resolve(await getWorlds())
  return worlds_name.map((name) => CACHE.get(name) || null)
})

export const getWorlds = memo(
  async () => {
    try {
      const worldNames = await Places.get().getWorldNames()
      CACHE.clear()
      for (const world of worldNames) {
        CACHE.set(world!, world)
      }

      return worldNames
    } catch (error) {
      return []
    }
  },
  { ttl: Time.Minute * 10 }
)

export const getWorldsOptions = (worlds: string[] | null) =>
  worlds
    ? worlds.map((world) => ({
        key: world!,
        value: world!,
        text: world!,
      }))
    : []
