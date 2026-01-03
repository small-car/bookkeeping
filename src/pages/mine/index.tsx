import { View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Cell } from '@taroify/core'
import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import { clearRecords, loadRecords, summarize, type BookkeepingRecord } from '@/utils/bookkeeping'
import './index.scss'

export default function MinePage() {
  const [records, setRecords] = useState<BookkeepingRecord[]>([])

  useDidShow(() => {
    setRecords(loadRecords())
  })

  const summary = useMemo(() => summarize(records), [records])
  const balance = useMemo(() => summary.income - summary.expense, [summary])

  async function handleExport() {
    const data = JSON.stringify(records, null, 2)
    await Taro.setClipboardData({ data })
    Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
  }

  async function handleClear() {
    const res = await Taro.showModal({
      title: '清空账本',
      content: '将删除本地全部账单数据，且不可恢复。',
      confirmText: '清空',
      cancelText: '取消'
    })
    if (!res.confirm) return
    clearRecords()
    setRecords([])
    Taro.showToast({ title: '已清空', icon: 'success' })
  }

  return (
    <Layout>
      <View className='mine'>
        <Cell.Group inset title='概览'>
          <Cell title='总笔数'>{records.length}</Cell>
          <Cell title='总收入'>¥{summary.income.toFixed(2)}</Cell>
          <Cell title='总支出'>¥{summary.expense.toFixed(2)}</Cell>
          <Cell title='结余'>¥{balance.toFixed(2)}</Cell>
        </Cell.Group>

        <Cell.Group inset title='操作'>
          <Cell title='导出数据' clickable onClick={handleExport}>
            复制 JSON
          </Cell>
          <Cell title='清空账本' clickable>
            <Button size='small' color='danger' onClick={handleClear}>
              清空
            </Button>
          </Cell>
        </Cell.Group>

        <View className='mine__tip'>数据保存在本地存储（Storage），卸载小程序可能会清空。</View>
      </View>
    </Layout>
  )
}

