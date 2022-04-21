import React from "react"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import invertedAddIcon from "../../images/inverted-add.svg"
import "./SearchInput.css"

export default function SearchInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const l = useFormatMessage()
  return (
    <input
      {...props}
      placeholder={props.placeholder || "Search..."}
      className={TokenList.join(["SearchInput", props.className])}
    />
  )
}
