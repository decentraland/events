import React, { useEffect } from 'react'
import usePatchState from 'decentraland-gatsby/dist/hooks/usePatchState'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'

import './Carousel.css'

const prev = require('../../images/prev.svg')
const next = require('../../images/next.svg')

export type CarouselProps = React.HTMLProps<HTMLDivElement>
export type CarouselState = {
  current: number
  running: boolean
  timer: number | null
}

export default function Carousel({ className, children, ...props }: CarouselProps) {

  const size = React.Children.count(children)
  const [state, patchState] = usePatchState<CarouselState>({ current: 0, timer: null, running: true })

  useEffect(() => {
    if (state.running) {
      patchState({ timer: setTimeout(handleNext, 5000) as any })
    }

    return () => {
      if (state.timer) {
        clearTimeout(state.timer)
      }
    }

  }, [state.running, state.current])

  function handleTimerOn() {
    patchState({ running: true })
  }

  function handleTimerOff() {
    if (state.timer) {
      clearTimeout(state.timer)
    }
    patchState({ timer: null, running: false })
  }

  function handleMove(to: number) {
    patchState({ current: to })
  }

  function handleNext() {
    handleMove(state.current >= size - 1 ? 0 : state.current + 1)
  }

  function handlePrev() {
    handleMove(state.current <= 0 ? size - 1 : state.current - 1)
  }

  return <div {...props} className={TokenList.join(['Carousel', className])}>
    <div className="Carousel__Items">
      <div className="Carousel__Scroll" onMouseEnter={handleTimerOff} onMouseLeave={handleTimerOn}>
        {React.Children.map(children, (child, i) => <div
          key={'item:' + i}
          className={TokenList.join([
            "Carousel__Item",
            i === 0 && 'Carousel__Item--first',
            i < state.current && 'Carousel__Item--on-left',
            i === state.current && 'Carousel__Item--active',
            i > state.current && 'Carousel__Item--on-right',
          ])}
        >{child}</div>)}
      </div>
    </div>
    {size > 1 && <div className="Carousel__List">
      {React.Children.map(children, (_, i) => <div key={'list:' + i} onClick={() => handleMove(i)} className={TokenList.join([i === state.current && 'active'])}><div /></div>)}
    </div>}
    {size > 1 && <div className="Carousel__Next" onClick={handleNext}>
      <img src={next} width="48" height="48" />
    </div>}
    {size > 1 && <div className="Carousel__Prev" onClick={handlePrev}>
      <img src={prev} width="48" height="48" />
    </div>}
  </div>
}