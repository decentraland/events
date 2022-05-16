import React from "react"
import "./MenuIcon.css"
import Menu from "semantic-ui-react/dist/commonjs/collections/Menu"
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown"

export type MenuIconChildreHeaderProps = {
  children?: string | React.ReactNode
}

export type MenuIconChildreItemProps = {
  children?: string | React.ReactNode
  onClick?: (
    event: React.MouseEvent<HTMLDivElement>,
    data: MenuIconChildreItemProps
  ) => void
}

export type MenuIconProps = {
  icon?: string
  children?: string | React.ReactNode
}

export default function MenuIcon(props: MenuIconProps) {
  const { icon, children } = props

  const dropDownIcon = icon || "ellipsis vertical"

  return (
    <Menu className={"dcl menu-icon"} borderless>
      <Dropdown item icon={dropDownIcon} simple direction="left">
        <Dropdown.Menu>{children}</Dropdown.Menu>
      </Dropdown>
    </Menu>
  )
}

export function MenuIconHeader(props: MenuIconChildreHeaderProps) {
  const { children } = props

  return <Dropdown.Header>{children}</Dropdown.Header>
}

export function MenuIconDivider() {
  return <Dropdown.Divider />
}

export function MenuIconItem(props: MenuIconChildreItemProps) {
  const { children, onClick } = props

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>, data: MenuIconChildreItemProps) => {
      if (onClick) {
        onClick(e, data)
      }
    },
    [onClick]
  )

  return (
    <Dropdown.Item onClick={(e) => handleClick(e, props)}>
      {children}
    </Dropdown.Item>
  )
}
