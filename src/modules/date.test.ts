import Time from "decentraland-gatsby/dist/utils/date/Time"

import { showTimezoneLabel } from "./date"

describe("Date module", () => {
  test("Return of timezone label for UTC", () => {
    // When time is UTC and setting.use_local_time is true
    expect(showTimezoneLabel(Time.utc(Date.now()), true)).toBe("(UTC)")
    // When time is UTC and setting.use_local_time is false
    expect(showTimezoneLabel(Time.utc(Date.now()), false)).toBe("(UTC)")
    // When time is not in UTC (-4 or -5) and setting.use_local_time is false
    expect(
      showTimezoneLabel(Time.tz(Date.now(), "America/New_York"), false)
    ).toBe("(UTC)")
  })
  test("Return of timezone label for -5 (-4 with DTS)", () => {
    // When time is not in UTC (-4 or -5) and setting.use_local_time is true
    expect(
      ["(UTC-5)", "(UTC-4)"].includes(
        showTimezoneLabel(Time.tz(Date.now(), "America/New_York"), true)
      )
    ).toBe(true)
  })
  test("Return of timezone label for -3:30 (-2:30 with DTS)", () => {
    // When time is not in UTC (-2:30) and setting.use_local_time is true
    expect(
      ["(UTC-2:30)", "(UTC-3:40)"].includes(
        showTimezoneLabel(Time.tz(Date.now(), "Canada/Newfoundland"), true)
      )
    ).toBe(true)
  })
  test("Return of timezone label for +4", () => {
    // When time is not in UTC (+4) and setting.use_local_time is true
    expect(showTimezoneLabel(Time.tz(Date.now(), "Asia/Dubai"), true)).toBe(
      "(UTC+4)"
    )
  })
})
