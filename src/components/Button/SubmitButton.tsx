import React from "react"
import {
  Button,
  ButtonProps,
} from "decentraland-ui/dist/components/Button/Button"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import invertedAddIcon from "../../images/inverted-add.svg"
import "./SubmitButton.css"

export default function SubmitButton(props: ButtonProps) {
  const l = useFormatMessage()
  return (
    <Button
      basic
      size="small"
      {...props}
      className={TokenList.join(["SubmitButton", props.className])}
    >
      {props.children}
      {!props.children && (
        <img
          src={invertedAddIcon}
          width="16"
          height="16"
          style={{
            width: "16px",
            height: "auto",
            verticalAlign: "text-bottom",
            marginRight: "1rem",
          }}
        />
      )}
      {!props.children && l("navigation.submit_events")}
    </Button>
  )
}
