import React from "react"
import Layout from "../components/Layout/Layout"
import SEO from "../components/seo"

import { Container } from "decentraland-ui/dist/components/Container/Container"
import Title from "decentraland-gatsby/dist/components/Text/Title"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"

const NotFoundPage = (props: any) => (
  <Layout {...props} >
    <SEO title="404: Not found" />
    <Container>
      <div style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Title>NOT FOUND</Title>
        <Paragraph> You just hit a route that doesn&#39;t exist...</Paragraph>
      </div>
    </Container>
  </Layout>
)

export default NotFoundPage
