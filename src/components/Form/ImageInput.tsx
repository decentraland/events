import React, { useMemo, useEffect } from 'react'
import ImgFixed from 'decentraland-gatsby/dist/components/Image/ImgFixed'
import TokenList from 'decentraland-gatsby/dist/utils/TokenList'

import './ImageInput.css'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'

export type ImageInputProps = Omit<React.HTMLProps<HTMLInputElement>, 'value'> & {
  onFileChange?: (file: File) => void
  value?: string
  label?: string
  message?: React.ReactNode
  error?: boolean
  loading?: boolean
}

export default function ImageInput({ value, error, loading, label, message, className, ...props }: ImageInputProps) {

  const hasDocument = typeof document !== 'undefined'
  const input = useMemo(() => {
    if (document) {
      const el = document.createElement('input')
      el.type = 'file'
      el.name = 'poster'
      el.accept = 'image/png, image/jpeg'
      return el
    } else {
      return null
    }
  }, [hasDocument])

  function handleClick() {
    if (input && !loading && !props.disabled) {
      input.click()
    }
  }

  useEffect(() => {
    if (!input) {
      return () => null
    }

    function handleChange() {
      if (input && input.files && input.files[0] && props.onFileChange) {
        props.onFileChange(input.files[0])
      }
    }

    input.addEventListener('change', handleChange)

    return () => {
      input.removeEventListener('change', handleChange)
    }
  }, [input])


  return <div className={TokenList.join(['ImageInput', error && 'ImageInput--error', loading && 'ImageInput--loading', value && 'ImageInput--with-value', className])}>
    <div className="ImageInput__Label">{label}</div>
    <div className="ImageInput__Value">
      <ImgFixed dimension="wide" src={value} />
      <div className="ImageInput__Background" />
      {loading && <Loader size="medium" active />}
      {!loading && <div className="ImageInput__Content" onClick={handleClick}>
        {props.children}
      </div>}
    </div>
    <div className="ImageInput__Message">{message}</div>
  </div>
}