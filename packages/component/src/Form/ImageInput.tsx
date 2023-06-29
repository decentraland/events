import React, { useEffect, useMemo } from "react"

import ImgFixed from "decentraland-gatsby/dist/components/Image/ImgFixed"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Loader } from "decentraland-ui/dist/components/Loader/Loader"

import "./ImageInput.css"

export type ImageInputProps = Omit<
  React.HTMLProps<HTMLInputElement>,
  "value"
> & {
  onFileChange?: (file: File) => void
  value?: string
  label?: string
  message?: React.ReactNode
  error?: boolean
  loading?: boolean
}

export default function ImageInput({
  value,
  error,
  loading,
  label,
  message,
  className,
  ...props
}: ImageInputProps) {
  const hasDocument = typeof document !== "undefined"
  const input = useMemo(() => {
    if (document) {
      const el = document.createElement("input")
      el.type = "file"
      el.name = "poster"
      el.accept = "image/png, image/jpeg"
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

    input.addEventListener("change", handleChange)

    return () => {
      input.removeEventListener("change", handleChange)
    }
  }, [input])

  return (
    <div
      className={TokenList.join([
        "image-input",
        error && "image-input--error",
        loading && "image-input--loading",
        value && "image-input--with-value",
        className,
      ])}
    >
      <div className="image-input__label">{label}</div>
      <div className="image-input__value">
        <ImgFixed dimension="wide" src={value} />
        <div className="image-input__background" />
        {loading && <Loader size="medium" active />}
        {!loading && (
          <div className="image-input__content" onClick={handleClick}>
            {props.children}
          </div>
        )}
      </div>
      <div className="image-input__message">{message}</div>
    </div>
  )
}
