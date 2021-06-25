import React from 'react';
import { Tabs } from 'decentraland-ui/dist/components/Tabs/Tabs'
import SubmitButton from '../Button/SubmitButton';
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext';
import { Link } from 'gatsby-plugin-intl';
import locations from '../../modules/locations';
import { useEvents, useEventsContext } from '../../context/Event';

import './Navigation.css'
import { useMemo } from 'react';
import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage';

export enum NavigationTab {
  Events = 'events',
  MyEvents = 'my_events',
  PendingEvents = 'pending_events',
}

export type NavigationProps = {
  activeTab?: NavigationTab
}

export default function Navigation(props: NavigationProps) {
  const l = useFormatMessage()
  const [ events ] = useEventsContext()
  const [ account ] = useAuthContext()
  const hasPendingEvents = useMemo(() => events.some(event => !event.approved && !event.rejected), [ events ])

  return <Tabs>
    <Link to={locations.events()}>
      <Tabs.Tab active={props.activeTab === NavigationTab.Events}>
        {l('navigation.events')}
      </Tabs.Tab>
    </Link>
    {account && <Link to={locations.myEvents()}>
      <Tabs.Tab active={props.activeTab === NavigationTab.MyEvents}>
        {l('navigation.my_events')}
      </Tabs.Tab>
    </Link>}
    {hasPendingEvents && <Link to={locations.pendingEvents()}>
      <Tabs.Tab active={props.activeTab === NavigationTab.PendingEvents}>
        {l('navigation.pending_events')}
      </Tabs.Tab>
    </Link>}
    <SubmitButton as={Link} to={locations.submit()} />
  </Tabs>
}