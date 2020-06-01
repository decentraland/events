import React from 'react';
import TokenList from 'decentraland-gatsby/dist/utils/TokenList';
import './Label.css'

export type LabelProps = React.HTMLProps<HTMLDivElement>

export default function Label(props: LabelProps) {
  return <div {...props} className={TokenList.join(['Label', props.className])} />
}