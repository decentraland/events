import express from 'express'
import bodyParser from 'body-parser'
import { listen } from 'decentraland-gatsby/dist/entities/Server/utils'
import { status, logger } from 'decentraland-gatsby/dist/entities/Route/routes'
import database from './entities/Database/index'
import events from './entities/Event/routes'
import attendees from './entities/EventAttendee/routes'
import profiles from './entities/Profile/routes'
import social from './entities/Social/routes'
import poster from './entities/Poster/routes'
import realms from './entities/Realm/routes'

const app = express()

app.use(social)

app.use('/api', [
  status(),
  logger(),
  bodyParser.json(),
  events,
  poster,
  attendees,
  profiles,
  realms
])

app.use(express.static('public'))

Promise.resolve()
  .then(() => database.connect())
  .then(() => listen(
    app,
    process.env.PORT || 3001,
    process.env.HOST
  ))
