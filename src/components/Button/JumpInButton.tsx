import React, { useMemo } from "react"

import { withPrefix } from "gatsby"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import {
  Button,
  ButtonProps,
} from "decentraland-ui/dist/components/Button/Button"

import { SessionEventAttributes } from "../../entities/Event/types"
import { eventTargetUrl } from "../../entities/Event/utils"
import primaryJumpInIcon from "../../images/primary-jump-in.svg"

import "./AttendingButtons.css"

export type JumpInButtonProps = Omit<
  ButtonProps,
  "href" | "target" | "children"
> & {
  event: SessionEventAttributes
}

export default function JumpInButton(props: ButtonProps) {
  const l = useFormatMessage()
  const event: SessionEventAttributes = props.event
  const href = useMemo(() => eventTargetUrl(event), [event])

  return (
    <Button
      primary
      className="fluid"
      href={withPrefix(href)}
      target="_blank"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span>{l("components.button.jump_in_button")}</span>
      <img
        src={primaryJumpInIcon}
        width={14}
        height={14}
        style={{ marginLeft: ".5rem" }}
      />
    </Button>
  )
}
