import { Model } from "decentraland-gatsby/dist/entities/Database/model"
import {
  SQL,
  columns,
  conditional,
  createSearchableMatches,
  join,
  limit,
  objectValues,
  offset,
  table,
  tsquery,
} from "decentraland-gatsby/dist/entities/Database/utils"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { QueryPart } from "decentraland-server/dist/db/types"
import isEthereumAddress from "validator/lib/isEthereumAddress"

import { utils } from "decentraland-commons"

import {
  DeprecatedEventAttributes,
  EventAttributes,
  EventListOptions,
  EventListType,
  SITEMAP_ITEMS_PER_PAGE,
  SessionEventAttributes,
} from "./types"
import EventAttendee from "../EventAttendee/model"
import { ProfileSettingsAttributes } from "../ProfileSettings/types"

export default class EventModel extends Model<DeprecatedEventAttributes> {
  static tableName = "events"

  static textsearch(event: DeprecatedEventAttributes) {
    // return null
    return SQL`(${join(
      [
        SQL`setweight(to_tsvector(${event.name}), 'A')`,
        SQL`setweight(to_tsvector(${event.user_name || ""}), 'B')`,
        SQL`setweight(to_tsvector(${event.estate_name || ""}), 'B')`,
        SQL`setweight(to_tsvector(${createSearchableMatches(
          event.description || ""
        )}), 'C')`,
      ],
      SQL` || `
    )})`
  }

  static create<U extends QueryPart = any>(event: U): Promise<U> {
    const keys = Object.keys(event).map((key) => key.replace(/\W/gi, ""))

    const sql = SQL`
      INSERT INTO ${table(this)} ${columns(keys)}
      VALUES ${objectValues(keys, [event])}
    `

    return this.query(sql) as any
  }

  static update<U extends QueryPart = any, P extends QueryPart = any>(
    changes: Partial<U>,
    conditions: Partial<P>
  ): Promise<U> {
    const changesKeys = Object.keys(changes).map((key) =>
      key.replace(/\W/gi, "")
    )
    const conditionsKeys = Object.keys(conditions).map((key) =>
      key.replace(/\W/gi, "")
    )
    if (changesKeys.length === 0) {
      throw new Error(`Missing update changes`)
    }

    if (conditionsKeys.length === 0) {
      throw new Error(`Missing update conditions`)
    }

    const updatedChanges = {
      ...changes,
      updated_at: new Date(),
    }

    const sql = SQL`
    UPDATE ${table(this)}
    SET
      ${join(
        Object.keys(updatedChanges).map(
          (key) => SQL`"${SQL.raw(key)}" = ${updatedChanges[key]}`
        ),
        SQL`,`
      )}
    WHERE
      ${join(
        conditionsKeys.map(
          (key) => SQL`"${SQL.raw(key)}" = ${conditions[key]}`
        ),
        SQL`,`
      )}
  `

    return this.query(sql) as any
  }

  static selectNextStartAt(
    duration: number,
    next_start_at: Date | null,
    recurrent_dates: Date[]
  ): Date {
    const now = Date.now()
    if (next_start_at && next_start_at.getTime() + duration > now) {
      return next_start_at
    }

    return (
      recurrent_dates.find((date) => date.getTime() + duration > now) ||
      recurrent_dates[recurrent_dates.length - 1]
    )
  }

  static build(
    event: EventAttributes | null | undefined
  ): DeprecatedEventAttributes | null | undefined {
    if (!event) {
      return event
    }

    const start_at = Time.date(event.start_at)
    const finish_at = Time.date(event.finish_at)
    // TODO: remove
    const duration =
      Number(event.duration) || finish_at.getTime() - start_at.getTime()
    const recurrent_dates =
      Array.isArray(event.recurrent_dates) && event.recurrent_dates.length > 0
        ? event.recurrent_dates.map((date) => Time.date(date))
        : [start_at]

    if (recurrent_dates[0].getTime() !== start_at.getTime()) {
      recurrent_dates.unshift(start_at)
    }

    const next_start_at = this.selectNextStartAt(
      duration,
      event.next_start_at && Time.date(event.next_start_at),
      recurrent_dates
    )

    return {
      ...event,
      duration,
      recurrent_dates,
      next_start_at,
      scene_name: event.estate_name,
      coordinates: [event.x, event.y],
      textsearch: undefined,
    }
  }

  static buildAll(events: EventAttributes[]): DeprecatedEventAttributes[] {
    return events.map(
      (event) => EventModel.build(event) as DeprecatedEventAttributes
    )
  }

  private static buildEventFilterConditions(
    options: Partial<EventListOptions> = {}
  ) {
    // Prioritizes "x" && "y" options params over positions
    let positionsFilter = ""
    if (
      !Number.isFinite(options.x) &&
      !Number.isFinite(options.y) &&
      options.positions &&
      options.positions.length > 0
    ) {
      positionsFilter = options.positions
        .map((position) => `(${position.join(",")})`)
        .join(",")
    }

    return [
      SQL`e.rejected IS FALSE`,
      conditional(options.list === EventListType.All, SQL``),
      conditional(
        options.list === EventListType.Active,
        SQL`AND e.next_finish_at > now()`
      ),
      conditional(
        options.list === EventListType.Live,
        SQL`AND e.next_finish_at > now() AND e.next_start_at < now()`
      ),
      conditional(
        options.list === EventListType.Upcoming,
        SQL`AND e.next_finish_at > now() AND e.next_start_at > now()`
      ),
      conditional(!!options.search, SQL`AND "rank" > 0`),
      conditional(
        !!options.creator,
        SQL`AND lower(e.user) = ${options.creator}`
      ),
      conditional(
        !options.allow_pending && !options.user,
        SQL`AND e.approved IS TRUE`
      ),
      conditional(!!options.world === true, SQL`AND e.world IS TRUE`),
      conditional(
        options.world !== undefined && !!options.world === false,
        SQL`AND e.world IS FALSE`
      ),
      conditional(
        !options.allow_pending && !!options.user,
        SQL`AND (e.approved IS TRUE OR lower(e.user) = ${options.user})`
      ),
      conditional(
        Number.isFinite(options.x) && Number.isFinite(options.y),
        SQL`AND e.x = ${options.x} AND e.y = ${options.y}`
      ),
      conditional(
        !!positionsFilter,
        SQL`AND (e.x, e.y) = ANY(Array[${SQL.raw(positionsFilter)}])`
      ),
      conditional(
        !!options.estate_id,
        SQL`AND e.estate_id = ${options.estate_id}`
      ),
      conditional(
        !!options.schedule,
        SQL`AND ${options.schedule} = ANY(e.schedules)`
      ),
      conditional(
        !!options.world_names,
        SQL`AND e.server = ANY(${options.world_names})`
      ),
      conditional(
        !!options.places_ids,
        SQL`AND e.place_id = ANY(${options.places_ids})`
      ),
    ].filter((condition) => !!condition.text)
  }

  static async countEvents() {
    return this.count<EventAttributes>({ approved: true })
  }

  static async getSitemapEvents(page: number) {
    const query = SQL`
      SELECT id
      FROM ${table(EventModel)} e
      WHERE e.approved IS TRUE
      ORDER BY created_at ASC
      OFFSET ${page * SITEMAP_ITEMS_PER_PAGE}
      LIMIT ${SITEMAP_ITEMS_PER_PAGE}
    `

    return await EventModel.query<{ id: string }>(query)
  }

  static async getEventsStartingInRange(
    starting_from: number,
    starting_to: number
  ) {
    const query = SQL`
      SELECT *
      FROM ${table(EventModel)} e
      WHERE
        e.rejected IS FALSE
        AND e.approved IS TRUE
        AND e.next_start_at >= (to_timestamp(${starting_from} / 1000.0))
        AND e.next_start_at < (to_timestamp(${starting_to} / 1000.0))
    `

    return EventModel.buildAll(await EventModel.query<EventAttributes>(query))
  }

  static async getRecurrentFinishedEvents() {
    const query = SQL`
      SELECT *
      FROM ${table(EventModel)} e
      WHERE
        e.rejected IS FALSE
        AND e.recurrent IS TRUE
        AND e.finish_at > now()
        AND (e.next_start_at + (e.duration * '1 millisecond'::interval)) < now()
    `

    return EventModel.buildAll(await EventModel.query<EventAttributes>(query))
  }

  static async getEvents(options: Partial<EventListOptions> = {}) {
    // return []
    let orderBy = "e.next_start_at"
    let orderDirection = "ASC"
    if (options.search) {
      orderBy = '"rank"'
      orderDirection = "DESC"
    }

    if (options.order) {
      orderDirection = options.order === "asc" ? "ASC" : "DESC"
    }

    const conditions = this.buildEventFilterConditions(options)

    const query = SQL`
      SELECT
        e.*
        ${conditional(!!options.user, SQL`, a.user is not null as attending`)}
      FROM ${table(EventModel)} e
        ${conditional(
          !!options.user,
          SQL`LEFT JOIN ${table(
            EventAttendee
          )} a on e.id = a.event_id AND lower(a.user) = ${options.user}`
        )}
          ${conditional(
            !!options.search,
            SQL`, ts_rank_cd(e.textsearch, to_tsquery(${tsquery(
              options.search || ""
            )})) AS "rank"`
          )}
      WHERE
        ${join(conditions, SQL` `)}
      ORDER BY ${SQL.raw(orderBy)} ${SQL.raw(orderDirection)}
      ${limit(options.limit, { max: 500 })}
      ${offset(options.offset)}
    `

    return EventModel.buildAll(await EventModel.query<EventAttributes>(query))
  }

  static async countEventsWithFilter(options: Partial<EventListOptions> = {}) {
    const conditions = this.buildEventFilterConditions(options)

    const query = SQL`
      SELECT COUNT(*) as count
      FROM ${table(EventModel)} e
        ${conditional(
          !!options.user,
          SQL`LEFT JOIN ${table(
            EventAttendee
          )} a on e.id = a.event_id AND lower(a.user) = ${options.user}`
        )}
          ${conditional(
            !!options.search,
            SQL`, ts_rank_cd(e.textsearch, to_tsquery(${tsquery(
              options.search || ""
            )})) AS "rank"`
          )}
      WHERE
        ${join(conditions, SQL` `)}
    `

    const result = await EventModel.query<{ count: string }>(query)
    return parseInt(result[0]?.count || "0", 10)
  }

  static async getAttending(user?: string | null) {
    if (!isEthereumAddress(user || "")) {
      return []
    }

    return EventModel.buildAll(
      await EventModel.query<DeprecatedEventAttributes>(SQL`
      SELECT e.*, a.user is not null as attending
      FROM ${table(EventModel)} e
      LEFT JOIN ${table(
        EventAttendee
      )} a on e.id = a.event_id AND a.user = ${user}
      WHERE e.finish_at > now() AND e.rejected IS FALSE
    `)
    )
  }

  static toPublic(
    event: DeprecatedEventAttributes & {
      attending?: boolean
      notify?: boolean
    },
    profile: ProfileSettingsAttributes
  ): SessionEventAttributes {
    const now = Date.now()

    if (event.user !== profile?.user) {
      event = utils.omit(event, ["contact", "details"])
    }

    const next_start_at =
      event.next_start_at ||
      event.recurrent_dates.find(
        (date) => date.getTime() + event.duration > now
      ) ||
      event.recurrent_dates[event.recurrent_dates.length - 1]
    const live =
      now >= next_start_at.getTime() &&
      now < next_start_at.getTime() + event.duration

    return {
      ...event,
      estate_name: event.estate_name || event.scene_name,
      attending: !!event.attending,
      next_start_at,
      position: [event.x, event.y],
      live,
    }
  }
}
