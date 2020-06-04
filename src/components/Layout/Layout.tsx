/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useState, useEffect } from "react"
import { DropdownProps } from "semantic-ui-react"
import { /* Link, */ changeLocale } from "gatsby-plugin-intl"

import 'semantic-ui-css/semantic.min.css'
import 'balloon-css/balloon.min.css'
import 'decentraland-ui/dist/themes/base-theme.css'
import 'decentraland-ui/dist/themes/alternative/light-theme.css'

import { Footer } from "decentraland-ui/dist/components/Footer/Footer"
import { Locale } from "decentraland-ui/dist/components/LanguageIcon/LanguageIcon"
import { Navbar } from "decentraland-ui/dist/components/Navbar/Navbar"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import ImgAvatar from "decentraland-gatsby/dist/components/Profile/ImgAvatar"
import useWindowScroll from "decentraland-gatsby/dist/hooks/useWindowScroll"
import useMobileDetector from "decentraland-gatsby/dist/hooks/useMobileDetector"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"

import "./Layout.css"

export default function Layout({ children, ...props }: any) {
  const language: Locale = props?.pageContext?.intl?.language || 'en'
  const languages: Locale[] = props?.pageContext?.intl?.languages || ['en']
  const currentPath: string = props?.pageContext?.intl?.originalPath || '/'
  const [profile, actions] = useProfile()
  const isMobile = useMobileDetector()

  const scroll = useWindowScroll()
  const isScrolled = scroll.scrollY.get() > 0

  const handleChangeLocal = function (
    _: React.SyntheticEvent<HTMLElement>,
    data: DropdownProps
  ) {
    const newLanguage = data.value as Locale
    changeLocale(newLanguage, currentPath)
  }

  return (
    <>
      <Navbar
        activePage="events"
        className={isScrolled ? "" : "initial"}
        rightMenu={(actions.provider || !isMobile) && <>
          {!profile && <Button size="small" basic loading={actions.loading} disabled={actions.loading} onClick={() => actions.connect()}>Sign in</Button>}
          {profile && <Button size="small" basic loading={actions.loading} disabled={actions.loading} onClick={() => actions.disconnect()}>Logout</Button>}
          {profile && <ImgAvatar size="small" profile={profile} style={{ margin: ' 0 0 0 .5rem' }} />}
        </>}
      />
      <div>{children}</div>
      <Footer
        locale={language}
        locales={languages}
        onChange={handleChangeLocal}
      />
    </>
  )
}
