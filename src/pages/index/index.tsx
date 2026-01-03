import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button, Cell, DatetimePicker, Input, Picker, Popup, Tabs, Textarea } from '@taroify/core'
import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import { addRecord, formatDate, parseDateString, type BookkeepingType } from '@/utils/bookkeeping'
import './index.scss'

const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '其他']
const incomeCategories = ['工资', '奖金', '理财', '红包', '其他']

export default function RecordPage() {
  const [type, setType] = useState<BookkeepingType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => formatDate(new Date()))

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  const categoryOptions = useMemo(() => {
    const list = type === 'expense' ? expenseCategories : incomeCategories
    return list.map((label) => ({ label, value: label }))
  }, [type])

  useEffect(() => {
    const valid = categoryOptions.some((o) => o.value === category)
    if (!valid) setCategory(categoryOptions[0]?.value ?? '')
  }, [category, categoryOptions])

  async function handleSave() {
    const value = Number(amount)
    if (!amount || Number.isNaN(value) || value <= 0) {
      Taro.showToast({ title: '请输入金额', icon: 'none' })
      return
    }
    if (!category) {
      Taro.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    addRecord({
      type,
      amount: Math.round(value * 100) / 100,
      category,
      note: note.trim() || undefined,
      date
    })

    setAmount('')
    setNote('')
    Taro.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => Taro.redirectTo({ url: '/pages/bill/index' }), 350)
  }

  return (
    <Layout>
      <View className='record'>
        <Tabs value={type} onChange={(v) => setType(v as BookkeepingType)}>
          <Tabs.TabPane title='支出' value='expense' />
          <Tabs.TabPane title='收入' value='income' />
        </Tabs>

        <Cell.Group inset title='记一笔'>
          <Cell title='金额'>
            <Input
              type='digit'
              placeholder='0.00'
              value={amount}
              onChange={(e) => setAmount(e.detail.value ?? '')}
            />
          </Cell>
          <Cell title='分类' clickable onClick={() => setCategoryOpen(true)}>
            {category || '请选择'}
          </Cell>
          <Cell title='日期' clickable onClick={() => setDateOpen(true)}>
            {date}
          </Cell>
          <Cell title='备注'>
            <Textarea
              placeholder='可选'
              value={note}
              onChange={(e) => setNote(e.detail.value ?? '')}
              autoHeight
            />
          </Cell>
        </Cell.Group>

        <View className='record__actions'>
          <Button color='primary' block onClick={handleSave}>
            保存
          </Button>
        </View>

        <Popup open={categoryOpen} placement='bottom' rounded onClose={() => setCategoryOpen(false)}>
          <Picker
            title='选择分类'
            columns={categoryOptions}
            value={category}
            onConfirm={(v) => {
              setCategory(typeof v === 'string' ? v : v[0])
              setCategoryOpen(false)
            }}
            onCancel={() => setCategoryOpen(false)}
          />
        </Popup>

        <Popup open={dateOpen} placement='bottom' rounded onClose={() => setDateOpen(false)}>
          <DatetimePicker
            type='date'
            value={parseDateString(date)}
            onConfirm={(d) => {
              setDate(formatDate(d))
              setDateOpen(false)
            }}
            onCancel={() => setDateOpen(false)}
          />
        </Popup>
      </View>
    </Layout>
  )
}

