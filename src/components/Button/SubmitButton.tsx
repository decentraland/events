import React from "react"

import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import {
  Button,
  ButtonProps,
} from "decentraland-ui/dist/components/Button/Button"

import invertedAddIcon from "../../images/inverted-add.svg"
import "./SubmitButton.css"

export default function SubmitButton(props: ButtonProps) {
  const l = useFormatMessage()
  return (
    <Button
      primary
      size="small"
      {...props}
      className={TokenList.join(["SubmitButton", props.className])}
    >
      {props.children}
      {!props.children && <img src={invertedAddIcon} width="16" height="16" />}
      {!props.children && l("navigation.submit_events")}
    </Button>
  )
}
