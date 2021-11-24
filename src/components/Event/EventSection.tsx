import React from "react"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import DividerComponent from "decentraland-gatsby/dist/components/Text/Divider"

import "./EventSection.css"

export type EventSectionProps = React.HTMLProps<HTMLDivElement> & {
  highlight?: boolean
  maxHeight?: number | string
}

function EventSection({ highlight, maxHeight, ...props }: EventSectionProps) {
  return (
    <div
      {...props}
      style={{ maxHeight: maxHeight, ...props.style }}
      className={TokenList.join([
        "EventSection",
        highlight && "EventSection--highlight",
        props.className,
      ])}
    />
  )
}

export type IconProps = Omit<React.HTMLProps<HTMLDivElement>, "children"> & {
  src?: string
  width?: string | number
  height?: string | number
  center?: boolean
}

function Icon({ src, width, height, center, ...props }: IconProps) {
  return (
    <div
      {...props}
      className={TokenList.join([
        "EventSection__Icon",
        center && "EventSection__Icon--center",
        props.className,
      ])}
    >
      <img src={src} width={width ?? 16} height={height ?? 16} />
    </div>
  )
}

export type DetailProps = React.HTMLProps<HTMLDivElement> & {
  maxHeight?: number | string
}

function Detail(props: DetailProps) {
  return (
    <div
      {...props}
      style={{ maxHeight: props.maxHeight, ...props.style }}
      className={TokenList.join(["EventSection__Detail", props.className])}
    />
  )
}

export type ActionProps = React.HTMLProps<HTMLDivElement>

function Action(props: ActionProps) {
  return (
    <div
      {...props}
      className={TokenList.join(["EventSection__Action", props.className])}
    />
  )
}

function Divider() {
  return <DividerComponent line className="EventSection__Divider" />
}

export default Object.assign(EventSection, { Icon, Detail, Action, Divider })
