import React from "react"
import { Back } from "decentraland-ui/dist/components/Back/Back"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"
import locations from "../../modules/locations"
import { navigate } from "gatsby-plugin-intl"

type ItemLayoutState = {
  children?: React.ReactNode
}

export default function ItemLayout(props: ItemLayoutState) {
  function handleBack() {
    const current = new URL(window.location.href)
    current.pathname = ''
    current.search = ''
    if (document.referrer.startsWith(current.toString())) {
      window.history.back()
    } else {
      navigate(locations.events())
    }
  }

  return <Grid stackable>
    <Grid.Row>
      <Grid.Column style={{ width: '58px', padding: '5px 8px 5px 3px' }}>
        <Back onClick={handleBack} />
      </Grid.Column>
      <Grid.Column mobile="15" style={{ maxWidth: '670px', }}>
        {props.children}
      </Grid.Column>
    </Grid.Row>
  </Grid>
}
