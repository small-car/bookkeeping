import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'

import './app.scss'

const g = globalThis as any
if (typeof g.Element === 'undefined') g.Element = function Element() {}
if (typeof g.HTMLElement === 'undefined') g.HTMLElement = g.Element

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return children
}

export default App
