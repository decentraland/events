import React from 'react';
import './AddCoverButton.css'

const add = require('../../images/add-alt@3x.png')


export default function AddCoverButton() {
  return <div className="AddCoverButton">
    <img src={add} width="32" height="32" />
  </div>
}