import Land from 'decentraland-gatsby/dist/utils/api/Land';
import { v4 as uuid } from 'uuid';
import EventModel from '../model';
import { eventTargetUrl, calculateRecurrentProperties } from '../utils';
import RequestError from 'decentraland-gatsby/dist/entities/Route/error';
import { WithAuth } from 'decentraland-gatsby/dist/entities/Auth/middleware';
import { EventAttributes, DeprecatedEventAttributes } from '../types';
import { WithAuthProfile } from 'decentraland-gatsby/dist/entities/Profile/middleware';
import { notifyNewEvent } from '../../Slack/utils';
import API from 'decentraland-gatsby/dist/utils/api/API';
import { createValidator } from 'decentraland-gatsby/dist/entities/Route/validate';
import { newEventSchema } from '../schemas';
import { AjvObjectSchema } from 'decentraland-gatsby/dist/entities/Schema/types';

const validateNewEvent = createValidator<EventAttributes>(newEventSchema as AjvObjectSchema)
export async function createEvent(req: WithAuthProfile<WithAuth>) {
  const user = req.auth!;
  const userProfile = req.authProfile!;
  let data = req.body as EventAttributes;

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    const { authorization, ...headers } = req.headers;
    throw new RequestError('Empty event data', RequestError.BadRequest, { body: data, headers, user });
  }

  if (!data.image) {
    data.image = null;
  }

  if (!data.server) {
    data.server = null;
  }

  if (!data.url) {
    data.url = eventTargetUrl(data);
  }

  data = validateNewEvent(data);

  const recurrent = calculateRecurrentProperties(data);
  const now = new Date();
  const event_id = uuid();
  const x = data.x;
  const y = data.y;
  const tiles = await API.catch(Land.get().getTiles([x, y], [x, y]));
  const tile = tiles && tiles[[x, y].join(',')];
  const estate_id = tile?.estateId || null;
  const estate_name = tile?.name || null;
  const image = data.image || (estate_id ? Land.get().getEstateImage(estate_id) : Land.get().getParcelImage([x, y]));
  const user_name = userProfile.name || null;
  const next_start_at = EventModel.selectNextStartAt(recurrent.duration, recurrent.start_at, recurrent.recurrent_dates);

  const event: DeprecatedEventAttributes = {
    ...data,
    ...recurrent,
    id: event_id,
    image,
    user: user.toLowerCase(),
    next_start_at,
    user_name,
    estate_id,
    estate_name,
    coordinates: [x, y],
    scene_name: estate_name,
    approved: false,
    rejected: false,
    highlighted: false,
    trending: false,
    total_attendees: 0,
    latest_attendees: [],
    created_at: now
  };

  await EventModel.create(event);
  await notifyNewEvent(event);

  return EventModel.toPublic(event, user);
}
