import React from "react"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import "./SearchInput.css"

export default function SearchInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      placeholder={props.placeholder || "Search..."}
      className={TokenList.join(["SearchInput", props.className])}
    />
  )
}
