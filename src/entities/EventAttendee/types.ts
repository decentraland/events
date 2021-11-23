export type EventAttendeeAttributes = {
  event_id: string // primary key 1
  user: string // primary key 2
  user_name: string | null
  notify: boolean
  notified: boolean
  created_at: Date
}
