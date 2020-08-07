import express, { Response, Request } from 'express'
import bodyParser from 'body-parser'
import cache from 'apicache'
import Manager from 'decentraland-gatsby/dist/entities/Job/job'
import { listen } from 'decentraland-gatsby/dist/entities/Server/utils'
import { status, logger, file, ddos } from 'decentraland-gatsby/dist/entities/Route/routes'
import database from './entities/Database/index'
import events from './entities/Event/routes'
import attendees from './entities/EventAttendee/routes'
import profiles from './entities/Profile/routes'
import social from './entities/Social/routes'
import poster from './entities/Poster/routes'
import realms from './entities/Realm/routes'
import profileSettings, { verifySubscription, removeSubscription } from './entities/ProfileSettings/routes'
import profileSubscription from './entities/ProfileSubscription/routes'
import { SUBSCRIPTION_PATH, UNSUBSCRIBE_PATH } from './entities/ProfileSettings/types'
import { notifyUpcomingEvents } from './entities/Event/cron'
import Datetime from 'decentraland-gatsby/dist/utils/Datetime'

const jobs = new Manager({ concurrency: 10 })
jobs.cron('0 * * * * *', notifyUpcomingEvents)

const app = express()
app.use(social)
app.use('/api', [
  ddos(),
  status(),
  logger(),
  bodyParser.json(),
  events,
  poster,
  attendees,
  profiles,
  profileSettings,
  profileSubscription,
  realms
])

app.get(SUBSCRIPTION_PATH, verifySubscription)
app.get(UNSUBSCRIBE_PATH, removeSubscription)

const staticCache = cache.middleware(
  7 * Datetime.Day,
  (req: Request, res: Response) => {
    return req.method === 'GET' && res.statusCode === 200
  }
)
app.use(staticCache, express.static('public', { maxAge: 1000 * 60 * 60 }))
app.use(file(process.cwd() + '/public/404.html', 404))

Promise.resolve()
  .then(() => database.connect())
  .then(() => jobs.start())
  .then(() => listen(
    app,
    process.env.PORT || 3001,
    process.env.HOST
  ))
