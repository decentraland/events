/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useState, useEffect } from "react"
import Helmet from "react-helmet"
import { Menu, DropdownProps, Responsive } from "semantic-ui-react"
import { /* Link, */ changeLocale } from "gatsby-plugin-intl"

import 'semantic-ui-css/semantic.min.css'
import 'balloon-css/balloon.min.css'
import 'decentraland-ui/dist/themes/base-theme.css'
import 'decentraland-ui/dist/themes/alternative/light-theme.css'

import { Footer } from "decentraland-ui/dist/components/Footer/Footer"
import { Locale } from "decentraland-ui/dist/components/LanguageIcon/LanguageIcon"
import { Navbar } from "decentraland-ui/dist/components/Navbar/Navbar"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import useProfile from "decentraland-gatsby/dist/hooks/useProfile"
import ImgAvatar from "decentraland-gatsby/dist/components/Profile/ImgAvatar"

// import "../theme.css"
import "./Layout.css"

const LangLabel = {
  en: "ENG",
  es: "ESP",
  fr: "FRA",
  ja: "日本語",
  zh: "中文",
  ko: "KOR",
}

export default function Layout({ children, ...props }: any) {
  const language: Locale = props?.pageContext?.intl?.language || 'en'
  const languages: Locale[] = props?.pageContext?.intl?.languages || ['en']
  const currentPath: string = props?.pageContext?.intl?.originalPath || '/'
  const [isScrolled, setIsScrolled] = useState(false)
  const [profile, loadingProfile, actions] = useProfile()

  useEffect(() => {
    const onWindowScroll = function () {
      if (window.scrollY < 10 && isScrolled) {
        setIsScrolled(false)
      } else if (window.scrollY > 10 && !isScrolled) {
        setIsScrolled(true)
      }
    }

    window.addEventListener("scroll", onWindowScroll)
    onWindowScroll()

    return () => {
      window.removeEventListener("scroll", onWindowScroll)
    }
  })

  const handleChangeLocal = function (
    _: React.SyntheticEvent<HTMLElement>,
    data: DropdownProps
  ) {
    const newLanguage = data.value as Locale
    changeLocale(newLanguage, currentPath)
  }

  return (
    <>
      <Helmet meta={[
        {
          property: `og:url`,
          content: String(process.env.GATSBY_BASE_URL || 'https://contest.decentraland.org') + props.location.pathname,
        }
      ]} />
      <Navbar
        className={isScrolled ? "" : "initial"}
        rightMenu={<>
          {!profile && <Button size="small" primary loading={loadingProfile} disabled={loadingProfile} onClick={() => actions.connect()}>Sign in</Button>}
          {profile && <Button size="small" basic loading={loadingProfile} disabled={loadingProfile} onClick={() => actions.disconnect()}>Logout</Button>}
          {profile && <ImgAvatar size="small" profile={profile} style={{ margin: ' 0 0 0 .5rem' }} />}
        </>}
      />
      {children}
      <Footer
        locale={language}
        locales={languages}
        onChange={handleChangeLocal}
      />
    </>
  )
}
