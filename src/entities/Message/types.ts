export type MessageAttributes = {
  address: string
  message: string
  signature: string
}

export enum PayloadType {
  Attend = "attend",
}

export type PayloadAttributes = AttendPayloadAttributes

export type AttendPayloadAttributes = {
  type: PayloadType.Attend
  timestamp: string
  event: string
  attend?: boolean
}
