import React from "react"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import "./Section.css"

export type SectionProps = React.HTMLProps<HTMLParagraphElement> & {
  uppercase?: boolean
}

export default function Section({ uppercase, ...props }: SectionProps) {
  return (
    <p
      {...props}
      className={TokenList.join(["dg", "Section", uppercase && "Uppercase"])}
    />
  )
}
