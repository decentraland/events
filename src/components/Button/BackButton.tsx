import React from "react"
import { Link } from "decentraland-gatsby/dist/plugins/intl"
import { GatsbyLinkProps } from "gatsby"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import backIcon from "../../images/back.svg"

import "./BackButton.css"

export default function BackButton(props: GatsbyLinkProps<any>) {
  return (
    <Link
      {...(props as any)}
      className={TokenList.join(["BackButton", props.className])}
    >
      <img src={backIcon} />
    </Link>
  )
}
