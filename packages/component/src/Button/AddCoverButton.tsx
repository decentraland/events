import React from "react"

import addCoverButton from "../images/add-alt@3x.png"

import "./AddCoverButton.css"

export default function AddCoverButton() {
  return (
    <div className="add-cover__button">
      <img src={addCoverButton} width="32" height="32" />
    </div>
  )
}
