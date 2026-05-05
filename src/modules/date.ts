import Time from "decentraland-gatsby/dist/utils/date/Time"

/**
 * Return a formatted label like (UTC) of with different timezone than UTC like (UTC -3)
 * @param time
 * @param useLocalTime
 * @returns
 */
const showTimezoneLabel = (
  time: Time.Dayjs | Date,
  useLocalTime: boolean | null | undefined = true
) => {
  time = Time.from(time)
  if (!useLocalTime || time.isUTC()) {
    return "(UTC)"
  }

  const zone = time.format("ZZ") // ±HHmm
  const sign = zone.slice(0, 1)
  const hours = zone.slice(1, 3)
  const minutes = zone.slice(3)

  if (hours === "00" && minutes === "00") {
    return "(UTC)"
  }

  let result = "(UTC" + sign + String(Number(hours))

  if (minutes !== "00") {
    result += ":" + minutes
  }

  result += ")"

  return result
}

export { showTimezoneLabel }
