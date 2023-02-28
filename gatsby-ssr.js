/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/ssr-apis/
 */

// You can delete this file if you're not using it
import React from "react"

import Rollbar from "decentraland-gatsby/dist/components/Development/Rollbar"
import Segment from "decentraland-gatsby/dist/components/Development/Segment"
export { wrapPageElement, wrapRootElement } from "./gatsby-browser"

/**
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/#onPreRenderHTML
 */
export function onPreRenderHTML(
  {
    pathname,
    getHeadComponents,
    replaceHeadComponents,
    getPreBodyComponents,
    replacePreBodyComponents,
    getPostBodyComponents,
    replacePostBodyComponents,
  },
  pluginOptions
) {
  const headComponents = getHeadComponents().map((component) => {
    if (component.type !== "style" || !component.props["data-href"]) {
      return component
    }

    return (
      <link
        rel="stylesheet"
        id={component.props.id}
        href={component.props["data-href"]}
      />
    )
  })

  headComponents.push(
    <script
      dangerouslySetInnerHTML={{
        __html:
          "if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {window.navigator.serviceWorker.getRegistrations().then(registrations => {registrations.forEach(r => r.unregister())})}",
      }}
    ></script>
  )

  const postBodyComponents = [...getPostBodyComponents()]
  postBodyComponents.push(
    <Segment
      key="segment"
      analyticsKey={process.env.GATSBY_SEGMENT_KEY}
      trackPage={false}
    />
  )

  postBodyComponents.push(<Rollbar key="rollbar" />)

  replaceHeadComponents(headComponents)
  replacePostBodyComponents(postBodyComponents)
}
