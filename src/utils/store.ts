import EntityStore from "decentraland-gatsby/dist/utils/EntityStore";
import { EventAttributes } from "../entities/Event/types";

export default {
  event: new EntityStore<EventAttributes>({ initialState: { loading: true } })
}