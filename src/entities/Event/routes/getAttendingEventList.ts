import EventModel from '../model';
import { WithAuth } from 'decentraland-gatsby/dist/entities/Auth/middleware';


export async function getAttendingEventList(req: WithAuth) {
  const events = await EventModel.getAttending(req.auth!);
  return events.map((event) => EventModel.toPublic(event, req.auth));
}
