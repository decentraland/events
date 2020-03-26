import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
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
  .then(() => {
    const server = app.listen(process.env.PORT || 3001, () => {
      console.log('server initiated: ', server.address())
    })
  })
