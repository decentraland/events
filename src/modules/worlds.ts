import Dataloader from "dataloader"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { memo } from "radash/dist/curry"

import Places, { AggregatePlaceAttributes } from "../api/Places"

const CACHE = new Map<string, AggregatePlaceAttributes>()
export const worlds = new Dataloader(async (worlds_name: readonly string[]) => {
  CACHE.size === 0 && Promise.resolve(await getWorlds())
  return worlds_name.map((name) => CACHE.get(name) || null)
})

export const getWorlds = memo(
  async () => {
    try {
      const sortedWorlds = (await Places.get().getWorlds()).sort((a, b) =>
        a.world_name!.localeCompare(b.world_name!)
      )
      CACHE.clear()
      for (const world of sortedWorlds) {
        CACHE.set(world.world_name!, world)
      }

      return sortedWorlds
    } catch (error) {
      return []
    }
  },
  { ttl: Time.Minute * 10 }
)

export const getWorldsOptions = (worlds: AggregatePlaceAttributes[] | null) =>
  worlds
    ? worlds.map((world) => ({
        key: world.world_name!,
        value: world.world_name!,
        text: world.world_name!,
      }))
    : []
