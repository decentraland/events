import React, { useRef, useEffect } from 'react'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'
import { FieldProps } from 'decentraland-ui/dist/components/Field/Field'

import './Textarea.css'

export type TextareaProps = Omit<FieldProps, 'onAction'> & {
  disabled?: boolean
  readOnly?: boolean
  minHeight?: number
  maxHeight?: number
}

export default function Textarea({ minHeight, maxHeight, ...props }: TextareaProps) {

  const ref = useRef<HTMLTextAreaElement | null>(null)

  function handleRowChange() {
    if (!ref.current) {
      return
    }

    const textarea = ref.current
    textarea.style.height = 0 + 'px'
    let height = textarea.scrollHeight
    if (minHeight !== undefined && height < minHeight) {
      height = minHeight
    }

    if (maxHeight !== undefined && height > maxHeight) {
      height = maxHeight
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

  const { error, label, message, ...extra } = props

  return <div className={TokenList.join(['dcl field', props.error && 'error', props.disabled && 'disabled', 'Textarea'])}>
    <div className="ui sub header">{props.label}</div>
    <div className="ui input">
      {props.error && <i aria-hidden="true" className="warning circle icon" />}
      <textarea {...extra} ref={ref} onChange={handleChange} />
    </div>
    <p className="message">{props.message}</p>
  </div>
}