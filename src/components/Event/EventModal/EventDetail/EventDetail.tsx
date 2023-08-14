import React, { useCallback } from "react"

import DateBox from "decentraland-gatsby/dist/components/Date/DateBox"
import Avatar from "decentraland-gatsby/dist/components/Profile/Avatar"
import Italic from "decentraland-gatsby/dist/components/Text/Italic"
import Markdown from "decentraland-gatsby/dist/components/Text/Markdown"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import Link from "decentraland-gatsby/dist/plugins/intl/Link"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import isEmail from "validator/lib/isEmail"

import { useProfileSettingsContext } from "../../../../context/ProfileSetting"
import { SessionEventAttributes } from "../../../../entities/Event/types"
import { profileSiteUrl } from "../../../../entities/Event/utils"
import { canEditAnyEvent } from "../../../../entities/ProfileSettings/utils"
import extraIcon from "../../../../images/info.svg"
import friendsIcon from "../../../../images/secondary-friends.svg"
import infoIcon from "../../../../images/secondary-info.svg"
import pinIcon from "../../../../images/secondary-pin.svg"
import { Flags } from "../../../../modules/features"
import locations from "../../../../modules/locations"
import { places } from "../../../../modules/places"
import placesLocations from "../../../../modules/placesLocations"
import AttendingButtons from "../../../Button/AttendingButtons"
import JumpInButton from "../../../Button/JumpInPosition"
import MenuIcon, { MenuIconItem } from "../../../MenuIcon/MenuIcon"
import EventSection from "../../EventSection"
import EventDateDetail from "./EventDateDetail"

import "./EventDetail.css"

const ATTENDEES_PREVIEW_LIMIT = 12

export type EventDetailProps = {
  event: SessionEventAttributes
  showDescription?: boolean
  showDate?: boolean
  showAllDates?: boolean
  showCountdownDate?: boolean
  showPlace?: boolean
  showAttendees?: boolean
  showContact?: boolean
  showDetails?: boolean
  showEdit?: boolean
  utc?: boolean
  onClickAttendees?: (
    event: React.MouseEvent<HTMLDivElement>,
    data: SessionEventAttributes
  ) => void
}

export default function EventDetail({ event, ...props }: EventDetailProps) {
  const l = useFormatMessage()
  const now = Date.now()
  const { next_start_at } = event || { next_start_at: new Date(now) }
  const completed = event.finish_at.getTime() < now
  const dates = completed
    ? event.recurrent_dates
    : event.recurrent_dates.filter(
        (date) => date.getTime() + event.duration > now
      )
  const attendeesDiff = event.total_attendees - ATTENDEES_PREVIEW_LIMIT
  const [settings] = useProfileSettingsContext()
  const advance = event.user === settings.user || canEditAnyEvent(settings)
  const utc = props.utc ?? !settings.use_local_time
  const [ff] = useFeatureFlagContext()

  const [place, placeStatus] = useAsyncMemo(
    async () => places.load(`${event.x},${event.y}`),
    [event],
    {
      callWithTruthyDeps: true,
    }
  )

  const handleAttendees = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (props.onClickAttendees) {
        props.onClickAttendees(e, event)
      }
    },
    [props.onClickAttendees]
  )

  return (
    <div className="EventDetail">
      <div className="EventDetail__Header">
        <DateBox date={next_start_at} utc={utc} />
        <div className="EventDetail__Header__Event">
          <SubTitle>{event.name}</SubTitle>
          <Paragraph className="EventDetail__Header__Event__By" secondary>
            {l("components.event.event_detail.public_organized_by", {
              organizer: (
                <Link
                  href={
                    ff.flags[Flags.ProfileSite]
                      ? profileSiteUrl(event.user)
                      : undefined
                  }
                >
                  {event.user_name || "Guest"}
                </Link>
              ),
            })}
          </Paragraph>
        </div>
        {props.showEdit !== false && advance && (
          <div className="EventDetail__Header__Actions">
            <MenuIcon>
              <MenuIconItem>
                <Button
                  basic
                  className="edit-detail__menu-icon__button"
                  as="a"
                  href={locations.editEvent(event.id)}
                  onClick={prevent(() =>
                    navigate(locations.editEvent(event.id))
                  )}
                >
                  <Icon name="edit" /> Edit
                </Button>
              </MenuIconItem>
              <MenuIconItem>
                <Button
                  basic
                  className="edit-detail__menu-icon__button"
                  as="a"
                  href={locations.cloneEvent(event.id)}
                  onClick={prevent(() =>
                    navigate(locations.cloneEvent(event.id))
                  )}
                >
                  <Icon name="clone" /> Clone
                </Button>
              </MenuIconItem>
            </MenuIcon>
          </div>
        )}
      </div>

      {event.approved && (
        <EventSection>
          <AttendingButtons event={event} />
        </EventSection>
      )}

      {/* DESCRIPTION */}
      {props.showDescription !== false && <EventSection.Divider />}
      {props.showDescription !== false && (
        <EventSection>
          <EventSection.Icon src={infoIcon} width="16" height="16" />
          <EventSection.Detail>
            {!event.description && (
              <Paragraph secondary={!event.description}>
                <Italic>
                  {l("components.event.event_detail.no_description")}
                </Italic>
              </Paragraph>
            )}
            {event.description && <Markdown children={event.description} />}
          </EventSection.Detail>
          <EventSection.Action />
        </EventSection>
      )}

      {/* DATE */}
      {props.showDate !== false && <EventSection.Divider />}
      {props.showDate !== false && props.showAllDates === false && (
        <EventDateDetail
          event={event}
          startAt={next_start_at}
          countdown={!!props.showCountdownDate}
        />
      )}
      {props.showDate !== false && props.showAllDates !== false && (
        <div style={{ overflow: "auto" }}>
          {dates.map((date, i) => {
            return (
              <EventDateDetail
                key={date.getTime()}
                style={i > 0 ? { paddingTop: "0" } : {}}
                secondary={i > 0 || date.getTime() + event.duration < now}
                completed={date.getTime() + event.duration < now}
                event={event}
                startAt={date}
              />
            )
          })}
        </div>
      )}

      {/* PLACE */}
      {props.showPlace !== false && <EventSection.Divider />}
      {props.showPlace !== false && (
        <EventSection>
          <EventSection.Icon src={pinIcon} width="16" height="16" />
          <EventSection.Detail>
            {placeStatus.loaded && place && (
              <Link href={placesLocations.place(place.base_position)}>
                {place.title}
              </Link>
            )}
            {(!placeStatus.loaded || !place) && (
              <Paragraph bold>
                {event.scene_name ||
                  (placeStatus.loaded && place && place.title) ||
                  "Decentraland"}
              </Paragraph>
            )}
          </EventSection.Detail>
          <EventSection.Action>
            <JumpInButton event={event} />
          </EventSection.Action>
        </EventSection>
      )}

      {/* ATTENDEES */}
      {props.showAttendees !== false && <EventSection.Divider />}
      {props.showAttendees !== false && (
        <EventSection>
          <EventSection.Icon src={friendsIcon} width="16x" height="16" center />
          <EventSection.Detail
            style={{
              display: "flex",
              justifyContent: attendeesDiff > 0 ? "space-around" : "",
            }}
          >
            {(event.latest_attendees || [])
              .slice(0, ATTENDEES_PREVIEW_LIMIT)
              .map((address) => (
                <div
                  key={address}
                  style={attendeesDiff <= 0 ? { margin: "0 .4rem" } : {}}
                >
                  <Avatar key={address} size="small" address={address} />
                </div>
              ))}
            {event.total_attendees === 0 && (
              <Paragraph secondary>
                <Italic>
                  {l("components.event.event_detail.nobody_confirmed_yet")}
                </Italic>
              </Paragraph>
            )}
          </EventSection.Detail>
          <EventSection.Action>
            {attendeesDiff > 0 && (
              <div
                className="EventDetail__Detail__ShowAttendees"
                onClick={handleAttendees}
              >
                {`+${attendeesDiff}`}
              </div>
            )}
          </EventSection.Action>
        </EventSection>
      )}

      {/* CONTACT */}
      {props.showContact !== false && !event.approved && advance && (
        <EventSection.Divider />
      )}
      {props.showContact !== false && !event.approved && advance && (
        <EventSection highlight>
          <EventSection.Icon src={extraIcon} width="16" height="16" />
          <EventSection.Detail>
            {event.contact && !isEmail(event.contact) && (
              <Paragraph>{event.contact}</Paragraph>
            )}
            {event.contact && isEmail(event.contact) && (
              <Paragraph>
                <Link href={"mailto:" + event.contact} target="_blank">
                  {event.contact}
                </Link>
              </Paragraph>
            )}
            {!event.contact && (
              <Paragraph secondary={!event.contact}>
                <Italic>{l("components.event.event_detail.no_contact")}</Italic>
              </Paragraph>
            )}
          </EventSection.Detail>
          <EventSection.Action />
        </EventSection>
      )}

      {/* DETAILS */}
      {props.showContact !== false && !event.approved && advance && (
        <EventSection.Divider />
      )}
      {props.showContact !== false && !event.approved && advance && (
        <EventSection highlight>
          <EventSection.Icon src={extraIcon} width="16" height="16" />
          <EventSection.Detail>
            {event.details && <Paragraph>{event.details}</Paragraph>}
            {!event.details && (
              <Paragraph secondary={!event.details}>
                <Italic>{l("components.event.event_detail.no_details")}</Italic>
              </Paragraph>
            )}
          </EventSection.Detail>
          <EventSection.Action />
        </EventSection>
      )}
    </div>
  )
}
