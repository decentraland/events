import React, { useState, useRef, useEffect } from 'react'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import './Accordion.css'

const next = require('../../images/next.svg')

export type AccordionProps = {
  open?: boolean,
  id?: string,
  className?: string
  children?: React.ReactNode
  title?: React.ReactNode,
  description?: React.ReactNode,
}

function Accordion(props: AccordionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [ open, setOpen ] = useState(false)
  const [ height, setHeight ] = useState(0)
  const withContent = !!props.children
  const isOpen = Boolean(props.open ?? open)

  useEffect(() => {
    if (ref.current !== null) {
      if (isOpen && height === 0) {
        setHeight(ref.current.offsetHeight)
      } else if (!isOpen && height !==0) {
        setHeight(0)
      }
    }
  }, [ props.open, open ])

  function handleOpen() {
    if (withContent && props.open === undefined) {
      setOpen(!open)
    }
  }

  return <div id={props.id} className={TokenList.join(['Accordion', isOpen ? 'Accordion--open' : 'Accordion--close' , props.className])}>
    <div className="Accordion__Title" onClick={handleOpen}>
      <div className="Accordion__Title__Content">
        {props.title ?? '&nbsp;'}
      </div>
      {props.description && <div className="Accordion__Title__Description">
        {props.description}
      </div>}
      {withContent && <div className={"Accordion__Title__Action"}>
        <img src={next} width="48" height="48" />
      </div>}
    </div>
    <div style={{ height }} className={TokenList.join([ 'Accordion__Content' ])}>
      <div ref={ref}>
        {props.children}
      </div>
    </div>
  </div>
}

export default React.memo(Accordion)