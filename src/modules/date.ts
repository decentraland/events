import Time from "decentraland-gatsby/dist/utils/date/Time"

/**
 * Return a formatted label like (UTC) of with different timezone than UTC like (UTC -3)
 * @param timeParam 
 * @param useLocalTime 
 * @returns 
 */
const showTimezoneLabel = (timeParam: Time.Dayjs, useLocalTime: boolean) => {
  // In case of +/- timezone erase the extra 0 // -0300 => -3
  console.log(useLocalTime)
  console.log(timeParam.isUTC())
  const timeZone = !useLocalTime || timeParam.isUTC() ? '' : timeParam.format("ZZ").replace(/0/g, '')
  return `(UTC${timeZone})`
}

export { showTimezoneLabel }