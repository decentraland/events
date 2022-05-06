import React from "react"
import Slider from "rc-slider"
import "./Range.css"

export type RangeProps = {
  header: string
  className?: string
  min?: number
  max?: number
  label?: string
  defaultValue?: number[]
  onChange?: Function
  onAfterChange?: Function
  value?: number[]
}

export default function Range(props: RangeProps) {
  const {
    header,
    className,
    label,
    min,
    max,
    onChange,
    onAfterChange,
    defaultValue,
    value,
  } = props

  const classes = ["dcl", "range"]
  if (className) {
    classes.push(className)
  }

  let extraProps = {}

  if (onChange) {
    extraProps = {
      ...extraProps,
      onChange: (value: number | number[]) => onChange(value),
    }
  }

  if (onAfterChange) {
    extraProps = {
      ...extraProps,
      onAfterChange: (value: number | number[]) => onAfterChange(value),
    }
  }

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
          defaultValue={defaultValue}
          value={value}
          {...extraProps}
        />
      </div>
    </div>
  )
}
