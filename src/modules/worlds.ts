import Dataloader from "dataloader"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { memo } from "radash/dist/curry"

import Places, { AggregatePlaceAttributes } from "../api/Places"

const CACHE = new Map<string, AggregatePlaceAttributes>()
export const worlds = new Dataloader(async (worlds_name: readonly string[]) => {
  CACHE.size === 0 && Promise.resolve(await getWorlds(worlds_name))
  return worlds_name.map((name) => CACHE.get(name) || null)
})

export const getWorlds = memo(
  async (worlds_name: readonly string[]) => {
    try {
      const missingWorlds = await Places.get().getWorldByName(
        worlds_name.filter((name) => !CACHE.has(name))
      )

      for (const world of missingWorlds) {
        CACHE.set(world.world_name!, world)
      }

      return missingWorlds
    } catch (error) {
      return []
    }
  },
  { ttl: Time.Minute * 10 }
)

export const getWorldNames = memo(
  async () => await Places.get().getWorldNames(),
  { ttl: Time.Minute * 10 }
)

export const getWorldNamesOptions = (worlds: string[] | null) =>
  worlds
    ? worlds.map((world) => ({
        key: world!,
        value: world!,
        text: world!,
      }))
    : []
