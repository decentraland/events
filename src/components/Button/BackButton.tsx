import React from 'react'
import { Link } from 'gatsby-plugin-intl'
import { GatsbyLinkProps } from 'gatsby'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'

import './BackButton.css'

const back = require('../../images/back.svg')

export default function BackButton(props: GatsbyLinkProps<any>) {
  return <Link {...props as any} className={TokenList.join(['BackButton', props.className])}>
    <img src={back} />
  </Link>
}