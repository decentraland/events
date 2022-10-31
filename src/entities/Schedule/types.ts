export type ScheduleAttributes = {
  id: string
  name: string
  description: string | null
  image: string | null
  theme: ScheduleTheme | null
  background: string[]
  active: boolean
  active_since: Date
  active_until: Date
  created_at: Date
  updated_at: Date
}

export type NewScheduleAttributes = Omit<
  ScheduleAttributes,
  "id" | "created_at" | "updated_at"
>

export enum ScheduleTheme {
  MetaverseFestival2022 = "mvmf_2022",
}
