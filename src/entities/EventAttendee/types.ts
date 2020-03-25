export type EventAttendeeAttributes = {
  event_id: string // primary key 1
  user: string // primary key 2
  user_name: string | null
  created_at: Date
}