import React from "react"

import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"

import "./Star.css"

export type StarProps = React.SVGAttributes<SVGElement> & {
  active?: boolean
}

export const Star = React.memo(function (props: StarProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="18"
      viewBox="0 0 19 18"
      className={TokenList.join([
        "icon-star",
        props.active && "active",
        props.className,
      ])}
    >
      <path
        d="M7.19647 6.32557L8.94981 2.60794C9.17485 2.1307 9.82514 2.1307 10.0502 2.60794L11.8035 6.32557L15.7245 6.92539C16.2276 7.00235 16.4281 7.64958 16.0639 8.02084L13.2271 10.9126L13.8966 14.9979C13.9826 15.5225 13.4564 15.9225 13.0063 15.6748L9.5 13.7449L5.99369 15.6748C5.54355 15.9225 5.01739 15.5225 5.10335 14.9979L5.77282 10.9126L2.93613 8.02084C2.57192 7.64958 2.77242 7.00235 3.2755 6.92539L7.19647 6.32557Z"
        stroke="black"
        stroke-width="1.41667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
})
