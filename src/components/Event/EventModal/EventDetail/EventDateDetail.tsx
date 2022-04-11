import React, { useMemo } from "react"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Bold from "decentraland-gatsby/dist/components/Text/Bold"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import useInterval from "decentraland-gatsby/dist/hooks/useInterval"
import { SessionEventAttributes } from "../../../../entities/Event/types"
import AddToCalendarButton from "../../../Button/AddToCalendarButton"
import Live from "../../../Badge/Live"
import EventSection from "../../EventSection"
import { useProfileSettingsContext } from "../../../../context/ProfileSetting"
import clockIcon from "../../../../images/secondary-clock.svg"

export type EventDateDetailProps = React.HTMLProps<HTMLDivElement> & {
  event: SessionEventAttributes
  startAt?: Date
  secondary?: boolean
  completed?: boolean
  countdown?: boolean
}

export default React.memo(function EventDateDetail({
  event,
  startAt,
  secondary,
  completed,
  countdown,
  ...props
}: EventDateDetailProps) {
  const duration = event.duration
  const [settings] = useProfileSettingsContext()
  const now = useInterval(() => Time.from(Date.now()), Time.Second, [
    !settings?.use_local_time,
  ])
  const start_at = useMemo(
    () =>
      Time.from(startAt || event.start_at, { utc: !settings?.use_local_time }),
    [startAt || event.start_at, !settings?.use_local_time]
  )
  const finish_at = useMemo(
    () =>
      Time.from(start_at.getTime() + duration, {
        utc: !settings?.use_local_time,
      }),
    [start_at, !settings?.use_local_time]
  )
  const isLive = now.isBetween(start_at, finish_at)

  /**
   * Return a formatted label like (UTC) of with different timezone than UTC like (UTC -3)
   * @param timeParam 
   * @returns 
   */
  const showTimezoneLabel = (timeParam: Time.Dayjs) => {
    // In case of +/- timezone erase the extra 0 // -0300 => -3
    const timeZone = !settings?.use_local_time ? '' : timeParam.format("ZZ").replace(/0/g, '')
    return `(UTC${timeZone})`
  }

  return (
    <EventSection {...props}>
      <EventSection.Icon
        src={secondary ? "" : clockIcon}
        width="16"
        height="16"
      />
      <EventSection.Detail>
        {isLive && (
          <Paragraph secondary={secondary}>
            Started: {start_at.fromNow()}
          </Paragraph>
        )}
        {!isLive && countdown && (
          <Paragraph secondary={secondary}>
            Starts in {start_at.fromNow(true)}
          </Paragraph>
        )}
        {!isLive && !countdown && duration < Time.Day && (
          <Paragraph secondary={secondary}>
            <Bold>{start_at.format("dddd, MMM DD")}</Bold>
            {duration === 0 && <Bold>{start_at.format(" hh:mma")}</Bold>}
            {duration > 0 && (
              <>
                {" from "}
                <Bold>{start_at.format("hh:mma")}</Bold>
                {" to "}
                <Bold>{finish_at.format("hh:mma")}</Bold>{" "}
                <Bold>
                  {showTimezoneLabel(finish_at)}
                </Bold>
              </>
            )}
          </Paragraph>
        )}
        {!isLive && !countdown && duration >= Time.Day && event.all_day && (
          <Paragraph secondary={secondary}>
            {"From "}
            <Bold>{start_at.format(`dddd, DD MMM`)}</Bold>
            {" to "}
            <Bold>{finish_at.format(`dddd, DD MMM`)}</Bold>{" "}
            <Bold>
              {showTimezoneLabel(finish_at)}
            </Bold>
          </Paragraph>
        )}
        {!isLive && !countdown && duration >= Time.Day && !event.all_day && (
          <>
            <Paragraph secondary={secondary}>
              <span style={{ width: "3.5em", display: "inline-block" }}>
                {"From: "}
              </span>
              <Bold>{start_at.format(`dddd, DD MMM`)}</Bold>
              {" at "}
              <Bold>{start_at.format("hh:mma")}</Bold>{" "}
              <Bold>
                {showTimezoneLabel(start_at)}
              </Bold>
            </Paragraph>
            <Paragraph secondary={secondary}>
              <span style={{ width: "3.5em", display: "inline-block" }}>
                {"To: "}
              </span>
              <Bold>{finish_at.format(`dddd, DD MMM`)}</Bold>
              {" at "}
              <Bold>{finish_at.format("hh:mma")}</Bold>{" "}
              <Bold>
                {showTimezoneLabel(finish_at)}
              </Bold>
            </Paragraph>
          </>
        )}
      </EventSection.Detail>
      <EventSection.Action>
        {isLive && <Live primary />}
        {!isLive && !completed && (
          <AddToCalendarButton
            event={event}
            startAt={start_at.toDate()}
            style={secondary ? { opacity: 0.7 } : {}}
          />
        )}
      </EventSection.Action>
    </EventSection>
  )
})
