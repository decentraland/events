import React, { useCallback } from "react"
import isEmail from "validator/lib/isEmail"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import Markdown from "decentraland-gatsby/dist/components/Text/Markdown"
import Italic from "decentraland-gatsby/dist/components/Text/Italic"
import Link from "decentraland-gatsby/dist/components/Text/Link"
import Avatar from "decentraland-gatsby/dist/components/Profile/Avatar"
import DateBox from "decentraland-gatsby/dist/components/Date/DateBox"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import { SessionEventAttributes } from "../../../../entities/Event/types"
import JumpInButton from "../../../Button/JumpInPosition"
import EventSection from "../../EventSection"
import EventDateDetail from "./EventDateDetail"
import extraIcon from "../../../../images/info.svg"
import infoIcon from "../../../../images/secondary-info.svg"
import pinIcon from "../../../../images/secondary-pin.svg"
import friendsIcon from "../../../../images/secondary-friends.svg"
import { useProfileSettingsContext } from "../../../../context/ProfileSetting"
import locations from "../../../../modules/locations"
import "./EventDetail.css"
import MenuIcon, {
  MenuIconDivider,
  MenuIconHeader,
  MenuIconItem,
} from "../../../MenuIcon/MenuIcon"
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon"
import Label from "semantic-ui-react/dist/commonjs/elements/Label"

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
  const now = Date.now()
  const { next_start_at } = event || { next_start_at: new Date(now) }
  const completed = event.finish_at.getTime() < now
  const dates = completed
    ? event.recurrent_dates
    : event.recurrent_dates.filter(
        (date) => date.getTime() + event.duration > now
      )
  const attendeesDiff = event.total_attendees - ATTENDEES_PREVIEW_LIMIT
  const advance = event.editable || event.owned
  const [settings] = useProfileSettingsContext()
  const utc = props.utc ?? !settings?.use_local_time

  const handleAttendees = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (props.onClickAttendees) {
        props.onClickAttendees(e, event)
      }
    },
    [props.onClickAttendees]
  )

  return (
    <div className={"EventDetail"}>
      <div className="EventDetail__Header">
        <DateBox date={next_start_at} utc={utc} />
        <div className="EventDetail__Header__Event">
          <SubTitle>{event.name}</SubTitle>
          <Paragraph className="EventDetail__Header__Event__By" secondary>
            Public, Organized by <Link>{event.user_name || "Guest"}</Link>
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
                  href={locations.edit(event.id)}
                  onClick={prevent(() => navigate(locations.edit(event.id)))}
                >
                  <Icon name="edit" /> Edit
                </Button>
              </MenuIconItem>
              <MenuIconItem>
                <Button
                  basic
                  className="edit-detail__menu-icon__button"
                  as="a"
                  href={locations.clone(event.id)}
                  onClick={prevent(() => navigate(locations.clone(event.id)))}
                >
                  <Icon name="clone" /> Clone
                </Button>
              </MenuIconItem>
            </MenuIcon>
          </div>
        )}
      </div>

      {/* DESCRIPTION */}
      {props.showDescription !== false && <EventSection.Divider />}
      {props.showDescription !== false && (
        <EventSection>
          <EventSection.Icon src={infoIcon} width="16" height="16" />
          <EventSection.Detail>
            {!event.description && (
              <Paragraph secondary={!event.description}>
                <Italic>No description</Italic>
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
            <Paragraph bold>{event.scene_name || "Decentraland"}</Paragraph>
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
                <Italic>Nobody confirmed yet</Italic>
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
                <Italic>No contact</Italic>
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
                <Italic>No details</Italic>
              </Paragraph>
            )}
          </EventSection.Detail>
          <EventSection.Action />
        </EventSection>
      )}
    </div>
  )
}
