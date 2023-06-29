import EntityStore from "decentraland-gatsby/dist/utils/EntityStore"
import { SessionEventAttributes } from "events-type/src/types/Event"

export default {
  event: new EntityStore<SessionEventAttributes>({
    initialState: { loading: true },
  }),
}
