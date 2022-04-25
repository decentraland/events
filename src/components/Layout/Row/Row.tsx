import React from "react"
import "./Row.css"

export type RowProps = {
  className?: string
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
}

const Row = (props: RowProps) => {
  const { className, children, onClick } = props

  return (
    <div className={`Row ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

Row.defaultProps = {
  className: "",
}

export { Row }
