import { useState, useEffect, useRef } from 'react'
import type { INetworkSpeed, INetworkSpeedOptions } from '../interface'

/**
 * Monitors network connection speed and type
 *
 * @param {INetworkSpeedOptions} options - Optional configuration
 * @returns {INetworkSpeed} Network speed information
 */
export function useNetworkSpeed(options?: INetworkSpeedOptions): INetworkSpeed {
  const { onChange } = options || {}

  const [networkInfo, setNetworkInfo] = useState<INetworkSpeed>(() => {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      }
    }

    try {
      // @ts-ignore - NetworkInformation is not in TypeScript lib yet
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        effectiveType: (conn?.effectiveType || 'unknown') as any,
        downlink: conn?.downlink || 0,
        rtt: conn?.rtt || 0,
        saveData: conn?.saveData || false,
      }
    } catch (error) {
      console.warn('Error reading network information:', error)
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      }
    }
  })

  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return
    }

    try {
      // @ts-ignore - NetworkInformation is not in TypeScript lib yet
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection

      if (!conn) {
        return
      }

      const handleChange = () => {
        const newInfo: INetworkSpeed = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          effectiveType: (conn.effectiveType || 'unknown') as any,
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0,
          saveData: conn.saveData || false,
        }

        setNetworkInfo(newInfo)
        onChangeRef.current?.(newInfo)
      }

      conn.addEventListener('change', handleChange)

      return () => {
        conn.removeEventListener('change', handleChange)
      }
    } catch (error) {
      console.warn('Error setting up network speed monitoring:', error)
      return undefined
    }
  }, [])

  return networkInfo
}
