import React from 'react'
import { Link } from 'gatsby-plugin-intl'
import { GatsbyLinkProps } from 'gatsby'
import classname from 'decentraland-gatsby/dist/utils/classname'

import './BackButton.css'

const back = require('../../images/back.svg')

export default function BackButton(props: GatsbyLinkProps<any>) {
  return <Link {...props as any} className={classname(['BackButton', props.className])}>
    <img src={back} />
  </Link>
}