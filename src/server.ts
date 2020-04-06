import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import { listen } from 'decentraland-gatsby/dist/entities/Server/utils'
import database from './entities/Database/index'
import events from './entities/Event/routes'
import attendees from './entities/EventAttendee/routes'
import profiles from './entities/Profile/routes'
import social from './entities/Social/routes'
import { status } from './entities/Route/routes'

const app = express()

app.use(social)

app.use('/api', [
  status(),
  (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    res.on('close', () => {
      const diff = (Date.now() - start) / 1000
      console.log(`[${req.method}] ${req.path} (status: ${res.statusCode}, time: ${diff}s)`)
    })
    next()
  },
  bodyParser.json(),
  events,
  attendees,
  profiles
])

app.use(express.static('public'))

Promise.resolve()
  .then(() => database.connect())
  .then(() => listen(
    app,
    process.env.PORT,
    process.env.HOST
  ))
