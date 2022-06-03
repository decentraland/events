import React, { useMemo } from "react"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useInterval from "decentraland-gatsby/dist/hooks/useInterval"
import Bold from "decentraland-gatsby/dist/components/Text/Bold"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { SessionEventAttributes } from "../../../../entities/Event/types"
import AddToCalendarButton from "../../../Button/AddToCalendarButton"
import Live from "../../../Badge/Live"
import EventSection from "../../EventSection"
import { useProfileSettingsContext } from "../../../../context/ProfileSetting"
import clockIcon from "../../../../images/secondary-clock.svg"
import { showTimezoneLabel } from "../../../../modules/date"
import "./EventDateDetail.css"

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
  const l = useFormatMessage()
  const now = useInterval(() => Time.from(Date.now()), Time.Second, [
    !settings.use_local_time,
  ])
  const start_at = useMemo(
    () =>
      Time.from(startAt || event.start_at, { utc: !settings.use_local_time }),
    [startAt || event.start_at, !settings.use_local_time]
  )
  const finish_at = useMemo(
    () =>
      Time.from(start_at.getTime() + duration, {
        utc: !settings.use_local_time,
      }),
    [start_at, !settings.use_local_time]
  )
  const isLive = now.isBetween(start_at, finish_at)

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
            {l(
              "components.event.event_modal.event_detail.event_date_detail.started"
            )}
            : {start_at.fromNow()}
          </Paragraph>
        )}
        {!isLive && countdown && (
          <Paragraph secondary={secondary}>
            {l(
              "components.event.event_modal.event_detail.event_date_detail.starts_in"
            )}{" "}
            {start_at.fromNow(true)}
          </Paragraph>
        )}
        {!isLive && !countdown && duration < Time.Day && (
          <Paragraph secondary={secondary}>
            <Bold>{start_at.format("dddd, MMM DD")}</Bold>
            {duration === 0 && <Bold>{start_at.format(" hh:mma")}</Bold>}
            {duration > 0 && (
              <>
                {" "}
                {l(
                  "components.event.event_modal.event_detail.event_date_detail.from"
                )}{" "}
                <Bold>{start_at.format("hh:mma")}</Bold>{" "}
                {l(
                  "components.event.event_modal.event_detail.event_date_detail.to"
                )}{" "}
                <Bold>{finish_at.format("hh:mma")}</Bold>{" "}
                <Bold>
                  {showTimezoneLabel(finish_at, settings.use_local_time)}
                </Bold>
              </>
            )}
          </Paragraph>
        )}
        {!isLive && !countdown && duration >= Time.Day && event.all_day && (
          <Paragraph
            secondary={secondary}
            className={"EventDateDetail__Capitalize"}
          >
            {l(
              "components.event.event_modal.event_detail.event_date_detail.from"
            )}{" "}
            <Bold>{start_at.format(`dddd, DD MMM`)}</Bold>{" "}
            {l(
              "components.event.event_modal.event_detail.event_date_detail.to"
            )}{" "}
            <Bold>{finish_at.format(`dddd, DD MMM`)}</Bold>{" "}
            <Bold>{showTimezoneLabel(finish_at, settings.use_local_time)}</Bold>
          </Paragraph>
        )}
        {!isLive && !countdown && duration >= Time.Day && !event.all_day && (
          <>
            <Paragraph secondary={secondary}>
              <span
                className={"EventDateDetail__Capitalize EventDateDetail__Span"}
              >
                {l(
                  "components.event.event_modal.event_detail.event_date_detail.from"
                )}
                {": "}
              </span>
              <Bold>{start_at.format(`dddd, DD MMM`)}</Bold>{" "}
              {l(
                "components.event.event_modal.event_detail.event_date_detail.at"
              )}{" "}
              <Bold>{start_at.format("hh:mma")}</Bold>{" "}
              <Bold>
                {showTimezoneLabel(start_at, settings.use_local_time)}
              </Bold>
            </Paragraph>
            <Paragraph secondary={secondary}>
              <span
                className={"EventDateDetail__Capitalize EventDateDetail__Span"}
              >
                {l(
                  "components.event.event_modal.event_detail.event_date_detail.to"
                )}
                {": "}
              </span>
              <Bold>{finish_at.format(`dddd, DD MMM`)}</Bold>{" "}
              {l(
                "components.event.event_modal.event_detail.event_date_detail.at"
              )}{" "}
              <Bold>{finish_at.format("hh:mma")}</Bold>{" "}
              <Bold>
                {showTimezoneLabel(finish_at, settings.use_local_time)}
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
