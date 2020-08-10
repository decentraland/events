import express from 'express'
import bodyParser from 'body-parser'
import Manager from 'decentraland-gatsby/dist/entities/Job/job'
import { listen } from 'decentraland-gatsby/dist/entities/Server/utils'
import { status, logger, ddos, filesystem } from 'decentraland-gatsby/dist/entities/Route/routes'
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
import handle from 'decentraland-gatsby/dist/entities/Route/handle'
import RequestError from 'decentraland-gatsby/dist/entities/Route/error'

const jobs = new Manager({ concurrency: 10 })
jobs.cron('0 * * * * *', notifyUpcomingEvents)

const app = express()
app.set('x-powered-by', false)
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
  realms,
  handle(async () => {
    throw new RequestError('NotFound', RequestError.NotFound)
  })
])

app.get(SUBSCRIPTION_PATH, verifySubscription)
app.get(UNSUBSCRIBE_PATH, removeSubscription)

app.use(filesystem('public', '404.html'))

Promise.resolve()
  .then(() => database.connect())
  .then(() => jobs.start())
  .then(() => listen(
    app,
    process.env.PORT || 3001,
    process.env.HOST
  ))
