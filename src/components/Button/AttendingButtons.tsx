import React, { useCallback, useMemo, useState } from "react"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import useMobileDetector from "decentraland-gatsby/dist/hooks/useMobileDetector"
import useTimeout from "decentraland-gatsby/dist/hooks/useTimeout"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import track from "decentraland-gatsby/dist/utils/development/segment"
import newPopupWindow from "decentraland-gatsby/dist/utils/dom/newPopupWindow"
import prevent from "decentraland-gatsby/dist/utils/react/prevent"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncTask from "decentraland-gatsby/dist/hooks/useAsyncTask"
import { SessionEventAttributes } from "../../entities/Event/types"
import {
  eventTwitterUrl,
  eventFacebookUrl,
  eventTargetUrl,
} from "../../entities/Event/utils"
import { useLocation } from "@gatsbyjs/reach-router"
import { SegmentEvent } from "../../modules/segment"

import shareIcon from "../../images/share.svg"
import closeIcon from "../../images/popup-close.svg"
import facebookIcon from "../../images/icon-facebook.svg"
import twitterIcon from "../../images/icon-twitter.svg"
import notificationDisabledIcon from "../../images/notification-disabled.svg"
import notificationEnabledIcon from "../../images/notification-enabled.svg"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"

import { useEventsContext } from "../../context/Event"
import locations from "../../modules/locations"
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
  const [address, actions] = useAuthContext()
  const location = useLocation()
  const isMobile = useMobileDetector()
  const [, state] = useEventsContext()
  const ethAddress = address
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
          url: location.origin + locations.event(event.id),
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
        track((analytics) =>
          analytics.track(SegmentEvent.Share, {
            ethAddress,
            eventId: event?.id || null,
            medium: "facebook",
          })
        )
        newPopupWindow(eventFacebookUrl(event))
      }
    },
    [event]
  )

  const handleShareTwitter = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()

      if (event) {
        track((analytics) =>
          analytics.track(SegmentEvent.Share, {
            ethAddress,
            eventId: event?.id || null,
            medium: "twitter",
          })
        )
        newPopupWindow(eventTwitterUrl(event))
      }
    },
    [event]
  )

  const handleShare = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()

      if (typeof navigator !== "undefined" && (navigator as any).share) {
        share()
      } else {
        track((analytics) =>
          analytics.track(SegmentEvent.ShareFallback, {
            ethAddress,
            eventId: event?.id || null,
          })
        )
        setFallbackShare(true)
      }
    },
    [setFallbackShare]
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

  const handleNotify = useCallback(
    (e: React.MouseEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()
      event && state.notify(event.id, !event.notify)
    },
    [event, state]
  )

  return (
    <div className="AttendingButtons">
      {fallbackShare && (
        <>
          <Button
            inverted
            size="small"
            className="share fluid"
            onClick={handleShareFacebook}
          >
            <img src={facebookIcon} width="10" height="16" />
          </Button>
          <Button
            inverted
            size="small"
            className="share fluid"
            onClick={handleShareTwitter}
          >
            <img src={twitterIcon} width="18" height="15" />
          </Button>
          <Button
            inverted
            size="small"
            className="share"
            onClick={handleFallbackShareClose}
          >
            <img src={closeIcon} width="14" height="14" />
          </Button>
        </>
      )}

      {!fallbackShare && (
        <>
          {isLive && (actions.provider || !isMobile) && (
            <Button
              primary
              size="small"
              disabled={loading || sharing || !approved}
              onClick={handleStopPropagation}
              className="fluid"
              href={href}
              target="_blank"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span>JUMP IN</span>
              <img
                src={primaryJumpInIcon}
                width={14}
                height={14}
                style={{ marginLeft: ".5rem" }}
              />
            </Button>
          )}

          {!isLive && (actions.provider || !isMobile) && (
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
              {!event && " "}
              {event && event.attending && "GOING"}
              {event && !event.attending && "WANT TO GO"}
            </Button>
          )}

          {!isLive && event?.attending && (actions.provider || !isMobile) && (
            <Button
              inverted
              primary
              size="small"
              className="share"
              disabled={loading || sharing || !approved}
              onClick={handleNotify}
            >
              <img
                src={
                  (event?.notify && notificationEnabledIcon) ||
                  notificationDisabledIcon
                }
                width="22"
                height="22"
              />
            </Button>
          )}

          {(actions.provider || !isMobile) && (
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

          {!actions.provider && isMobile && (
            <Button
              inverted
              primary
              size="small"
              className="share fluid"
              disabled={loading || sharing || !approved}
              onClick={handleShare}
            >
              <img src={shareIcon} width="14" height="14" /> SHARE
            </Button>
          )}
        </>
      )}
    </div>
  )
}
