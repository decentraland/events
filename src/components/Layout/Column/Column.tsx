import React from "react"

import "./Column.css"

export type ColumnProps = {
  className?: string
  children: React.ReactNode
  align: "left" | "center" | "right"
  grow: boolean
  shrink: boolean
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
}

const Column = (props: ColumnProps) => {
  const { className, align, grow, shrink, children, onClick } = props
  const classes = ["Column", align]

  // Add classes name in case that they exist
  className && classes.push(className)
  grow && classes.push("grow")
  shrink && classes.push("shrink")

  return (
    <div className={classes.join(" ")} onClick={onClick}>
      {children}
    </div>
  )
}

Column.defaultProps = {
  align: "left",
  className: "",
  grow: false,
  shrink: false,
}

export { Column }
