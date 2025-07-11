import React from "react"

import { SelectField } from "decentraland-ui/dist/components/SelectField/SelectField"

import "./CommunityDropdown.css"

export type CommunityDropdownProps = {
  placeholder?: string
  options: { key: string; value: string; text: string }[]
  value?: string
  onChange?: (event: React.SyntheticEvent<HTMLElement, Event>, data: any) => void
  disabled?: boolean
  error?: boolean
  message?: string
  border?: boolean
}

export default function CommunityDropdown(props: CommunityDropdownProps) {
  return (
    <SelectField
      placeholder={props.placeholder || "Select community..."}
      name="community"
      error={props.error}
      message={props.message}
      options={props.options}
      onChange={props.onChange}
      value={props.value || ""}
      disabled={props.disabled}
      border={props.border}
    />
  )
} 