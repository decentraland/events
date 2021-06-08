/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useEffect, useState } from "react"
import { DropdownProps } from "semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown"
import { /* Link, */ changeLocale } from "gatsby-plugin-intl"

import 'semantic-ui-css/semantic.min.css'
import 'balloon-css/balloon.min.css'
import 'decentraland-ui/dist/themes/base-theme.css'
import 'decentraland-ui/dist/themes/alternative/light-theme.css'

import { Footer } from "decentraland-ui/dist/components/Footer/Footer"
import { Locale } from "decentraland-ui/dist/components/LanguageIcon/LanguageIcon"
import { Navbar } from "decentraland-ui/dist/components/Navbar/Navbar"
import { Button } from "decentraland-ui/dist/components/Button/Button"
import { LoginModal, LoginModalOptionType } from "decentraland-ui/dist/components/LoginModal/LoginModal"
import { connection } from "decentraland-connect/dist/ConnectionManager"
import { ProviderType } from "decentraland-connect/dist/types"
import { ChainId } from "@dcl/schemas"
import Avatar from "decentraland-gatsby/dist/components/Profile/Avatar"
import useWindowScroll from "decentraland-gatsby/dist/hooks/useWindowScroll"
import useMobileDetector from "decentraland-gatsby/dist/hooks/useMobileDetector"
import useAuth from "decentraland-gatsby/dist/hooks/useAuth"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import "./Layout.css"

export default function Layout({ children, ...props }: any) {
  const language: Locale = props?.pageContext?.intl?.language || 'en'
  const languages: Locale[] = props?.pageContext?.intl?.languages || ['en']
  const currentPath: string = props?.pageContext?.intl?.originalPath || '/'
  const [ openSignInModal, setOpenSignInModal ] = useState(false)
  const [ address, actions ] = useAuth()
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

  useEffect(() => {
    if (address && openSignInModal) {
      setOpenSignInModal(false)
    }
  }, [ address, openSignInModal ])

  return (
    <>
      <Navbar
        activePage="events"
        className={isScrolled ? "" : "initial"}
        rightMenu={(actions.provider || !isMobile) && <>
          {!address && <Button size="small" basic loading={actions.loading} disabled={actions.loading} onClick={() => setOpenSignInModal(true)}>Sign in</Button>}
          {address && <Button size="small" basic loading={actions.loading} disabled={actions.loading} onClick={() => actions.disconnect()}>Logout</Button>}
          {address && <div onClick={props.onOpenProfile} className={TokenList.join(['dcl', 'profile', props.active && 'active'])}>
            <Avatar size="small" address={address} />
          </div>}
        </>}
      />
      <div>{children}</div>
      <LoginModal open={!address && openSignInModal} loading={actions.loading} onClose={() => setOpenSignInModal(false)}>
        {connection.getAvailableProviders()
          .filter(providerType => [ProviderType.INJECTED, ProviderType.FORTMATIC].includes(providerType))
          .map(providerType => {
            switch (providerType) {
              case ProviderType.INJECTED:
                return <LoginModal.Option key={ProviderType.INJECTED} type={LoginModalOptionType.METAMASK} onClick={() => actions.connect(providerType, ChainId.ETHEREUM_MAINNET)} />
              case ProviderType.FORTMATIC:
                return <LoginModal.Option key={ProviderType.FORTMATIC} type={LoginModalOptionType.FORTMATIC} onClick={() => actions.connect(providerType, ChainId.ETHEREUM_MAINNET)} />
              default:
                return null
              }
          })}
      </LoginModal>
      <Footer
        locale={language}
        locales={languages}
        onChange={handleChangeLocal}
      />
    </>
  )
}
