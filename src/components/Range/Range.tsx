import React, { useCallback } from "react"
import Slider from "rc-slider"
import "./Range.css"

export type RangeProps = {
  header: string
  className?: string
  min?: number
  max?: number
  defaultValue?: readonly [number, number]
  value?: readonly [number, number]
  label?: string | React.PureComponent<{ value: [number, number] }>
  onChange?: (props: [number, number]) => void
  onMouseUp?: (props: [number, number]) => void
}

export default function Range(props: RangeProps) {
  const {
    header,
    className,
    label,
    min,
    max,
    onChange,
    onMouseUp,
    defaultValue,
    value,
  } = props

  const classes = ["dcl", "range"]
  if (className) {
    classes.push(className)
  }

  const handleChange = useCallback(
    (value: number | number[]) => {
      if (onChange) {
        onChange(value as [number, number])
      }
    },
    [onChange]
  )

  const handleAfterChange = useCallback(
    (value: number | number[]) => {
      if (onMouseUp) {
        onMouseUp(value as [number, number])
      }
    },
    [onChange]
  )

  return (
    <div>
      <div className={classes.join(" ")}>
        <div className={"dcl range-header"}>{header}</div>
        <p>{label}</p>
        <Slider
          range
          min={min || 0}
          max={max || 100}
          allowCross={false}
          defaultValue={defaultValue as [number, number]}
          value={value as [number, number]}
          onChange={handleChange}
          onAfterChange={handleAfterChange}
        />
      </div>
    </div>
  )
}
