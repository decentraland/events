import React, { useRef, useEffect } from 'react'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { FieldProps } from 'decentraland-ui/dist/components/Field/Field'

import './Textarea.css'

export type TextareaProps = Omit<FieldProps, 'onAction'> & {
  minHeight?: number
  maxHeight?: number
}

export default function Textarea(props: TextareaProps) {

  const ref = useRef<HTMLTextAreaElement | null>(null)

  function handleRowChange() {
    if (!ref.current) {
      return
    }

    const textarea = ref.current
    textarea.style.height = 0 + 'px'
    let height = textarea.scrollHeight
    if (props.minHeight !== undefined && height < props.minHeight) {
      height = props.minHeight
    }

    if (props.maxHeight !== undefined && height > props.maxHeight) {
      height = props.maxHeight
    }

    textarea.style.height = height + 2 + 'px'
  }

  function handleChange(event: React.ChangeEvent<any>) {
    handleRowChange()
    if (props.onChange) {
      props.onChange(event, { ...props, value: event.currentTarget.value })
    }
  }

  useEffect(() => handleRowChange(), [])

  return <div className={TokenList.join(['dcl field', props.error && 'error', 'Textarea'])}>
    <div className="ui sub header">{props.label}</div>
    <div className="ui input">
      {props.error && <i aria-hidden="true" className="warning circle icon" />}
      <textarea ref={ref} placeholder={props.placeholder} name={props.name} value={props.value} defaultValue={props.defaultValue} onChange={handleChange} />
    </div>
    <p className="message">{props.message}</p>
  </div>
}