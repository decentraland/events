import Dataloader from "dataloader"
import Places, { AggregatePlaceAttributes } from "events-api/src/Places"

const CACHE = new Map<string, AggregatePlaceAttributes>()
export const places = new Dataloader(async (positions: readonly string[]) => {
  const missingPlaces = await Places.get().getPlaceByPositions(
    positions.filter((position) => !CACHE.has(position))
  )

  for (const place of missingPlaces) {
    CACHE.set(place.base_position, place)
    for (const position of place.positions) {
      CACHE.set(position, place)
    }
  }

  return positions.map((position) => CACHE.get(position) || null)
})
