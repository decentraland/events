import React from "react"
import "./MenuIcon.css"
import Menu from "semantic-ui-react/dist/commonjs/collections/Menu"
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown"

export enum MenuIconItemType {
  HEADER = "Header",
  ITEM = "Item",
  DEVIDER = "Devider",
}

export type MenuIconItemProps = {
  children?: string | React.ReactNode
  type: MenuIconItemType
}

export type MenuIconProps = {
  icon?: string
  onClick?: (
    event: React.MouseEvent<HTMLDivElement>,
    data: MenuIconItemProps
  ) => void
  items: MenuIconItemProps[]
}

export default function MenuIcon(props: MenuIconProps) {
  const { icon, items, onClick } = props

  const dropDownIcon = icon || "ellipsis vertical"

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>, data: MenuIconItemProps) => {
      if (onClick) {
        onClick(e, data)
      }
    },
    [onClick]
  )

  return (
    <Menu className={"dcl menu-icon"} borderless>
      <Dropdown item icon={dropDownIcon} simple direction="left">
        <Dropdown.Menu>
          {items.map((item, key) => {
            if (item.type === MenuIconItemType.HEADER) {
              return (
                <Dropdown.Header key={key}>{item.children}</Dropdown.Header>
              )
            } else if (item.type === MenuIconItemType.DEVIDER) {
              return <Dropdown.Divider key={key} />
            } else if (item.type === MenuIconItemType.ITEM) {
              return (
                <Dropdown.Item key={key} onClick={(e) => handleClick(e, item)}>
                  {item.children}
                </Dropdown.Item>
              )
            }
          })}
        </Dropdown.Menu>
      </Dropdown>
    </Menu>
  )
}
