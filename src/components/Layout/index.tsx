import { View } from '@tarojs/components'
import { SafeArea, Tabbar } from '@taroify/core'
import Taro, { useRouter } from '@tarojs/taro'
import type { ReactNode } from 'react'
import { BillOutlined, Notes, UserOutlined } from '@taroify/icons'
import './index.scss'

const tabs = [
  { key: 'record', title: '记账', url: '/pages/index/index', icon: <Notes /> },
  { key: 'bill', title: '账单', url: '/pages/bill/index', icon: <BillOutlined /> },
  { key: 'mine', title: '我的', url: '/pages/mine/index', icon: <UserOutlined /> }
] as const

function normalizeRoute(route?: string) {
  if (!route) return ''
  return route.startsWith('/') ? route : `/${route}`
}

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const route = normalizeRoute((router as any)?.path ?? (router as any)?.route)
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.url === route))
  const activeKey = tabs[activeIndex]?.key ?? tabs[0].key

  return (
    <View className='layout'>
      <View className='layout__content'>{children}</View>
      <View className='layout__tabbar'>
        <Tabbar
          value={activeKey}
          onChange={(next) => {
            const nextTab = tabs.find((t) => t.key === next)
            if (!nextTab) return
            if (nextTab.url === route) return
            Taro.redirectTo({ url: nextTab.url })
          }}
        >
          {tabs.map((t) => (
            <Tabbar.TabItem key={t.key} value={t.key} icon={t.icon}>
              {t.title}
            </Tabbar.TabItem>
          ))}
        </Tabbar>
        <SafeArea position='bottom' />
      </View>
    </View>
  )
}
