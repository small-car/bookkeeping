import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Cell, DatetimePicker, Empty, Popup } from '@taroify/core'
import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import { formatMonth, loadRecords, removeRecord, summarize, type BookkeepingRecord } from '@/utils/bookkeeping'
import './index.scss'

const GROUP_PAGE_SIZE = 10

export default function BillPage() {
  const [monthOpen, setMonthOpen] = useState(false)
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [records, setRecords] = useState<BookkeepingRecord[]>([])
  const [visibleGroupCount, setVisibleGroupCount] = useState(GROUP_PAGE_SIZE)
  const [scrollIntoView, setScrollIntoView] = useState<string>()
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({})

  useDidShow(() => {
    setRecords(loadRecords())
  })

  const monthKey = useMemo(() => formatMonth(monthDate), [monthDate])
  const monthRecords = useMemo(() => records.filter((r) => r.date.startsWith(monthKey)), [records, monthKey])
  const summary = useMemo(() => summarize(monthRecords), [monthRecords])

  useEffect(() => {
    setVisibleGroupCount(GROUP_PAGE_SIZE)
    setCollapsedDates({})
    const topId = `bill__top_${monthKey}`
    setScrollIntoView(topId)
    const timer = setTimeout(() => setScrollIntoView(undefined), 0)
    return () => clearTimeout(timer)
  }, [monthKey])

  const grouped = useMemo(() => {
    const map = new Map<string, BookkeepingRecord[]>()
    for (const record of monthRecords) {
      const list = map.get(record.date) ?? []
      list.push(record)
      map.set(record.date, list)
    }
    return Array.from(map.entries())
  }, [monthRecords])

  const visibleGrouped = useMemo(
    () => grouped.slice(0, Math.max(0, Math.min(visibleGroupCount, grouped.length))),
    [grouped, visibleGroupCount]
  )
  const hasMore = visibleGroupCount < grouped.length

  function handleLoadMore() {
    if (!hasMore) return
    setVisibleGroupCount((count) => Math.min(count + GROUP_PAGE_SIZE, grouped.length))
  }

  function toggleDate(date: string) {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  async function handleRecordClick(record: BookkeepingRecord) {
    const sign = record.type === 'expense' ? '-' : '+'
    const amountText = `${sign}¥${record.amount.toFixed(2)}`
    const noteText = record.note ? `\n备注：${record.note}` : ''

    const res = await Taro.showModal({
      title: '账单',
      content: `日期：${record.date}\n分类：${record.category}${noteText}\n金额：${amountText}`,
      confirmText: '删除',
      cancelText: '关闭'
    })
    if (!res.confirm) return

    removeRecord(record.id)
    setRecords(loadRecords())
    Taro.showToast({ title: '已删除', icon: 'success' })
  }

  return (
    <Layout>
      <View className='bill'>
        <Cell.Group inset>
          <Cell title='月份' clickable onClick={() => setMonthOpen(true)}>
            {monthKey}
          </Cell>
          <Cell title='收入'>￥{summary.income.toFixed(2)}</Cell>
          <Cell title='支出'>￥{summary.expense.toFixed(2)}</Cell>
          <Cell title='结余'>￥{(summary.income - summary.expense).toFixed(2)}</Cell>
        </Cell.Group>
        <ScrollView
          className='bill__scroll'
          scrollY
          enhanced
          lowerThreshold={120}
          scrollIntoView={scrollIntoView}
          onScrollToLower={handleLoadMore}
        >
          <View id={`bill__top_${monthKey}`} />

          {grouped.length === 0 ? (
            <View className='bill__empty'>
              <Empty>
                <Empty.Description>本月暂无账单</Empty.Description>
              </Empty>
            </View>
          ) : (
            visibleGrouped.map(([date, items]) => (
              <Cell.Group key={date} inset>
                <Cell clickable title={date} onClick={() => toggleDate(date)}>
                  <Text className='bill__toggle'>{collapsedDates[date] ? '展开' : '收起'}</Text>
                </Cell>
                {!collapsedDates[date] &&
                  items.map((r) => {
                    const sign = r.type === 'expense' ? '-' : '+'
                    const amountText = `${sign}￥${r.amount.toFixed(2)}`
                    return (
                      <Cell
                      key={r.id}
                      clickable
                      title={`${r.category}${r.note ? ` · ${r.note}` : ''}`}
                      onClick={() => handleRecordClick(r)}
                      >
                      <Text className={r.type === 'expense' ? 'bill__expense' : 'bill__income'}>{amountText}</Text>
                      </Cell>
                    )
                  })}
              </Cell.Group>
            ))
          )}

          {grouped.length > 0 && (
            <View className='bill__footer' onClick={hasMore ? handleLoadMore : undefined}>
              {hasMore ? '上拉/点击加载更多…' : '没有更多了'}
            </View>
          )}
        </ScrollView>

        <Popup open={monthOpen} placement='bottom' rounded onClose={() => setMonthOpen(false)}>
          <DatetimePicker
            type='year-month'
            value={monthDate}
            onConfirm={(next) => {
              setMonthDate(next)
              setMonthOpen(false)
            }}
            onCancel={() => setMonthOpen(false)}
          />
        </Popup>
      </View>
    </Layout>
  )
}
