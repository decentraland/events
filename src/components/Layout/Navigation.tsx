import React from 'react';
import { Tabs } from 'decentraland-ui/dist/components/Tabs/Tabs'
import SubmitButton from '../Button/SubmitButton';
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext';
import { Link } from 'gatsby-plugin-intl';
import locations from '../modules/locations';

export enum NavigationTab {
  Events = 'events',
  MyEvents = 'my_events'
}

export type NavigationProps = {
  activeTab?: NavigationTab
}

export default function Navigation(props: NavigationProps) {
  const [ account ] = useAuthContext()

  return <Tabs>
    <Tabs.Tab active={props.activeTab === NavigationTab.Events}>World Events</Tabs.Tab>
    {account && <Tabs.Tab active={props.activeTab === NavigationTab.MyEvents}>My Events</Tabs.Tab>}
    <SubmitButton as={Link} to={locations.submit()} />
  </Tabs>
}