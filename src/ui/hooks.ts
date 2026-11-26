import { useEffect, useState } from 'react'
import { readDeviceStatus, type DeviceStatus } from '../ai/device'
import { subscribe, type CallRecord } from '../ai/receipt'

/** Chrome's on-device model status, re-read while it can still change. */
export function useDeviceStatus(): [DeviceStatus, () => void] {
  const [status, setStatus] = useState<DeviceStatus>('checking')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const read = async () => {
      const s = await readDeviceStatus()
      if (!alive) return
      setStatus(s)
      if (s === 'downloadable' || s === 'downloading') timer = setTimeout(read, 3000)
    }
    read()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [tick])
  return [status, () => setTick((t) => t + 1)]
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    addEventListener('online', on)
    addEventListener('offline', off)
    return () => {
      removeEventListener('online', on)
      removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function useReceipt(): CallRecord[] {
  const [records, setRecords] = useState<CallRecord[]>([])
  useEffect(() => subscribe(setRecords), [])
  return records
}
