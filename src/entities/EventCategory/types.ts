export type EventCategoryAttributes = {
  name: string // primary key
  active: boolean
  created_at: Date
  updated_at: Date
}

export type EventCategoryAttributesWithI18N = EventCategoryAttributes & {
  i18n: { en: string }
}

export const ALL_EVENT_CATEGORY = "all"
