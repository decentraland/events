import EntityStore from "decentraland-gatsby/dist/utils/EntityStore";
import { SessionEventAttributes } from "../entities/Event/types";

export default {
  event: new EntityStore<SessionEventAttributes>({ initialState: { loading: true } })
}