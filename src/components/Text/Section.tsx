import React from 'react'
import './Section.css'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'

export type SectionProps = React.HTMLProps<HTMLParagraphElement> & {
  uppercase?: boolean
}

export default function Section({ uppercase, ...props }: SectionProps) {
  return <p {...props} className={TokenList.join(['dg', 'Section', uppercase && 'Uppercase'])} />
}