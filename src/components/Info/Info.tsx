import React from "react"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import infoIcon from "../../images/info.svg"

import "./Info.css"

export type InfoProps = {
  text: string
  className?: string
}

export default React.memo(function Info(props: InfoProps) {
  const { text, className } = props
  return (
    <div className={TokenList.join(["info-container", className])}>
      <img src={infoIcon} width="16" height="16" />
      <span>{text}</span>
    </div>
  )
})
