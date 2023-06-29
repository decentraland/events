import React, { useEffect, useRef, useState } from "react"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import nextIcon from "../../images/next.svg"

import "./Accordion.css"

export type AccordionProps = {
  open?: boolean
  id?: string
  className?: string
  children?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
}

export default React.memo(function Accordion(props: AccordionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(0)
  const withContent = !!props.children
  const isOpen = Boolean(props.open ?? open)

  useEffect(() => {
    if (ref.current !== null) {
      if (isOpen && height === 0) {
        setHeight(ref.current.offsetHeight)
      } else if (!isOpen && height !== 0) {
        setHeight(0)
      }
    }
  }, [props.open, open])

  useEffect(() => {
    let interval: number
    if (ref.current && isOpen) {
      interval = setInterval(() => {
        if (ref.current && height && ref.current.offsetHeight !== height) {
          setHeight(ref.current.offsetHeight)
        }
      }, 1000) as any
    }

    return () => {
      clearInterval(interval)
    }
  }, [ref.current, isOpen, height])

  function handleOpen() {
    if (withContent && props.open === undefined) {
      setOpen(!open)
    }
  }

  return (
    <div
      id={props.id}
      className={TokenList.join([
        "accordion",
        isOpen ? "accordion--open" : "accordion--close",
        props.className,
      ])}
    >
      <div className="accordion-title" onClick={handleOpen}>
        <div className="accordion-title__content">
          {props.title ?? "&nbsp;"}
        </div>
        {props.description && (
          <div className="accordion-title__description">
            {props.description}
          </div>
        )}
        {withContent && (
          <div className={"accordion-title__action"}>
            <img src={nextIcon} width="48" height="48" />
          </div>
        )}
      </div>
      <div
        style={{ height }}
        className={TokenList.join(["accordion__content"])}
      >
        <div ref={ref}>{props.children}</div>
      </div>
    </div>
  )
})
