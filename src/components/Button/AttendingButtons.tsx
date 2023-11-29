import React, { useCallback, useMemo, useState } from "react"

import { withPrefix } from "gatsby"

import { useLocation } from "@gatsbyjs/reach-router"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import useTimeout from "decentraland-gatsby/dist/hooks/useTimeout"
import newPopupWindow from "decentraland-gatsby/dist/utils/dom/newPopupWindow"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Button } from "decentraland-ui/dist/components/Button/Button"

import { useEventsContext } from "../../context/Event"
import { SessionEventAttributes } from "../../entities/Event/types"
import {
  eventFacebookUrl,
  eventTargetUrl,
  eventTwitterUrl,
} from "../../entities/Event/utils"
import facebookIcon from "../../images/icon-facebook.svg"
import twitterIcon from "../../images/icon-twitter.svg"
import closeIcon from "../../images/popup-close.svg"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"
import shareIcon from "../../images/share.svg"
import locations from "../../modules/locations"
import { SegmentEvent } from "../../modules/segment"
import { Star } from "../Icon/Star"

import "./AttendingButtons.css"

export type AttendingButtonsProps = {
  event?: SessionEventAttributes
  loading?: boolean
}

export default function AttendingButtons(props: AttendingButtonsProps) {
  const event = props.event
  const nextStartAt = useMemo(
    () =>
      new Date(event ? Date.parse(event.next_start_at.toString()) : Date.now()),
    [event?.next_start_at]
  )
  const isLive = useTimeout(nextStartAt)
  const [fallbackShare, setFallbackShare] = useState(false)
  const location = useLocation()
  const [, state] = useEventsContext()
  const track = useTrackContext()
  const l = useFormatMessage()
  const approved = useMemo(() => !event || event.approved, [event])
  const loading = useMemo(
    () => props.loading ?? state.modifying.has(event?.id || ""),
    [props.loading, state.modifying]
  )
  const href = useMemo(() => event && eventTargetUrl(event), [event])

  const [sharing, share] = useAsyncTask(async () => {
    if (event) {
      try {
        await (navigator as any).share({
          title: event.name,
          text: event.description,
          url: location.origin + withPrefix(locations.event(event.id)),
        })
      } catch (err) {
        console.error(err)
      }
    }
  }, [event])

  const handleShareFacebook = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()

      if (event) {
        track(SegmentEvent.Share, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
          medium: "facebook",
        })
        newPopupWindow(eventFacebookUrl(event))
      }
    },
    [event, track]
  )

  const handleShareTwitter = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()

      if (event) {
        track(SegmentEvent.Share, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
          medium: "twitter",
        })
        newPopupWindow(eventTwitterUrl(event))
      }
    },
    [event, track]
  )

  const handleShare = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()

      if (typeof navigator !== "undefined" && (navigator as any).share) {
        share()
      } else {
        track(SegmentEvent.ShareFallback, {
          eventId: event?.id || null,
          trending: event?.trending || false,
          highlighted: event?.highlighted || false,
        })
        setFallbackShare(true)
      }
    },
    [setFallbackShare, track]
  )

  const handleFallbackShareClose = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()
      setFallbackShare(false)
    },
    [setFallbackShare]
  )

  const handleStopPropagation = useCallback((e: React.MouseEvent<any>) => {
    e.stopPropagation()
  }, [])

  const handleAttend = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()
      event && state.attend(event.id, !event.attending)
    },
    [event, state]
  )

  return (
    <div className="attending-buttons">
      {fallbackShare && (
        <Button
          inverted
          size="small"
          className="share fluid"
          onClick={handleShareFacebook}
        >
          <img src={facebookIcon} width="10" height="16" />
        </Button>
      )}
      {fallbackShare && (
        <Button
          inverted
          size="small"
          className="share fluid"
          onClick={handleShareTwitter}
        >
          <img src={twitterIcon} width="18" height="15" />
        </Button>
      )}
      {fallbackShare && (
        <Button
          inverted
          size="small"
          className="share"
          onClick={handleFallbackShareClose}
        >
          <img src={closeIcon} width="14" height="14" />
        </Button>
      )}

      {!fallbackShare && isLive && (
        <Button
          primary
          size="small"
          disabled={loading || sharing || !approved}
          onClick={handleStopPropagation}
          className="fluid"
          href={href ? withPrefix(href) : href}
          target="_blank"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span>{l("components.button.attending_buttons.jump_in")}</span>
          <img
            src={primaryJumpInIcon}
            width={14}
            height={14}
            style={{ marginLeft: ".5rem" }}
          />
        </Button>
      )}

      {!fallbackShare && !isLive && (
        <Button
          inverted
          size="small"
          onClick={handleAttend}
          loading={loading}
          disabled={loading || sharing || !approved}
          className={TokenList.join([
            "attending-status",
            "fluid",
            event?.attending && "attending",
          ])}
        >
          {event && <Star active={event.attending} />}
          {!event && " "}
          {event &&
            event.attending &&
            l("components.button.attending_buttons.going")}
          {event &&
            !event.attending &&
            l("components.button.attending_buttons.want_to_go")}
        </Button>
      )}

      {!fallbackShare && (
        <Button
          inverted
          primary
          size="small"
          className="share"
          disabled={loading || sharing || !approved}
          onClick={handleShare}
        >
          <img src={shareIcon} width="14" height="14" />
        </Button>
      )}
    </div>
  )
}
