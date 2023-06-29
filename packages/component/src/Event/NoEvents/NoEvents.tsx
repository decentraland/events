import React from "react"

import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"

export const NoEvents = React.memo((props: { children?: React.ReactNode }) => {
  const l = useFormatMessage()

  return (
    <div>
      <Divider />
      <Paragraph secondary style={{ textAlign: "center" }}>
        {props.children ?? l("page.events.no_events")}
      </Paragraph>
      <Divider />
    </div>
  )
})
