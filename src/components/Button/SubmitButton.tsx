import React from 'react';
import { Button, ButtonProps } from 'decentraland-ui/dist/components/Button/Button';
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList';

import './SubmitButton.css'
import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage';

const invertedAdd = require('../../images/inverted-add.svg')

export default function SubmitButton(props: ButtonProps) {
  const l = useFormatMessage()
  return <Button basic size="small" {...props} className={TokenList.join(['SubmitButton', props.className])}>
    {props.children}
    {!props.children && <img src={invertedAdd} width="16" height="16" style={{ width: '16px', height: 'auto', verticalAlign: 'text-bottom', marginRight: '1rem' }} />}
    {!props.children && l('navigation.submit_events')}
  </Button>
}