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
      primary
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
            width: "13px",
            height: "auto",
            verticalAlign: "text-bottom",
            marginRight: ".5rem",
            marginBottom: '1px'
          }}
        />
      )}
      {!props.children && l("navigation.submit_events")}
    </Button>
  )
}
