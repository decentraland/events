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

  const tz = Object.entries({
    Iceland: "(UTC)",
    "Asia/Dubai": "(UTC+4)",
    "Australia/ACT": "(UTC+10)",
    "Pacific/Rarotonga": "(UTC-10)",
    "US/Samoa": "(UTC-11)",
    "Asia/Calcutta": "(UTC+5:30)",
  })

  for (const [name, expected] of tz) {
    test(`should return label ${expected} for timezone "${name}"`, () => {
      const label = showTimezoneLabel(Time.tz(Date.now(), name), true)
      expect(label).toBe(expected)
    })
  }

  const dts = Object.entries({
    CET: ["(UTC+1)", "(UTC+2)"],
    "America/New_York": ["(UTC-5)", "(UTC-4)"],
    "Canada/Newfoundland": ["(UTC-3:30)", "(UTC-2:30)"],
    "Antarctica/Troll": ["(UTC)", "(UTC+2)"],
    "Asia/Beirut": ["(UTC+2)", "(UTC+3)"],
    "Asia/Tehran": ["(UTC+3:30)", "(UTC+4:30)"],
    "Australia/LHI": ["(UTC+11)", "(UTC+10:30)"],
  })

  for (const [name, expected] of dts) {
    test(`should returns label ${expected[0]} with SDT and ${expected[1]} with DTS for timezone "${name}"`, () => {
      const labelSDT = showTimezoneLabel(Time.tz("2020-01-01", name), true)
      const labelDTS = showTimezoneLabel(Time.tz("2020-06-01", name), true)
      expect(labelSDT).toBe(expected[0])
      expect(labelDTS).toBe(expected[1])
    })
  }
})
