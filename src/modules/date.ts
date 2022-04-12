import Time from "decentraland-gatsby/dist/utils/date/Time"

/**
 * Return a formatted label like (UTC) of with different timezone than UTC like (UTC -3)
 * @param timeParam 
 * @param useLocalTime 
 * @returns 
 */
const showTimezoneLabel = (timeParam: Time.Dayjs, useLocalTime: boolean) => {

  if (!useLocalTime || timeParam.isUTC()) {
    return '(UTC)'
  }
  
  let timeZone = timeParam.format("Z")
  const timeZoneSplitted = timeZone.split(":")
  // In case of +/- timezone with oclock time erase the extra 0 // -0300 => -3
  if (timeZoneSplitted[1] === '00') {
    timeZone = timeParam.format("ZZ").replace(/0/g, '')
  } else {
    // else add the minutes to the timezone // -0230 => -2:30
    timeZone = timeZoneSplitted[0].replace(/0/g, '') + ":" + timeZoneSplitted[1]
  }
  
  return `(UTC${timeZone})`
}

export { showTimezoneLabel }