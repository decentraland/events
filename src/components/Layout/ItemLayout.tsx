import React from "react"
import { Back } from "decentraland-ui/dist/components/Back/Back"
import { back } from "decentraland-gatsby/dist/plugins/intl"
import Grid from "semantic-ui-react/dist/commonjs/collections/Grid"

type ItemLayoutState = {
  children?: React.ReactNode
}

function handleBack() {
  back()
}

export default function ItemLayout(props: ItemLayoutState) {
  return (
    <Grid stackable>
      <Grid.Row>
        <Grid.Column style={{ width: "58px", padding: "5px 8px 5px 3px" }}>
          <Back onClick={handleBack} />
        </Grid.Column>
        <Grid.Column mobile="15" style={{ maxWidth: "670px" }}>
          {props.children}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}
