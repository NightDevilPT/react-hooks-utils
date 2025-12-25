import { useState, useEffect, useRef } from 'react'
import type { IBattery, IBatteryOptions } from '../interface'

/**
 * Monitors device battery status
 *
 * @param {IBatteryOptions} options - Optional configuration
 * @returns {IBattery} Battery status information
 */
export function useBattery(options?: IBatteryOptions): IBattery {
  const { onChange } = options || {}

  const [batteryStatus, setBatteryStatus] = useState<IBattery>({
    level: 1,
    charging: false,
    chargingTime: Infinity,
    dischargingTime: Infinity,
    supported: false,
  })

  const onChangeRef = useRef(onChange)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batteryRef = useRef<any>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    // Check if running in browser and Battery API is supported
    if (typeof window === 'undefined' || !('getBattery' in navigator)) {
      return
    }

    let mounted = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBatteryStatus = (battery: any) => {
      if (!mounted || !battery) return

      const newStatus: IBattery = {
        level: typeof battery.level === 'number' ? battery.level : 1,
        charging: typeof battery.charging === 'boolean' ? battery.charging : false,
        chargingTime: typeof battery.chargingTime === 'number' ? battery.chargingTime : Infinity,
        dischargingTime:
          typeof battery.dischargingTime === 'number' ? battery.dischargingTime : Infinity,
        supported: true,
      }

      setBatteryStatus(newStatus)
      onChangeRef.current?.(newStatus)
    }

    const initBattery = async () => {
      try {
        // @ts-ignore - getBattery is not in TypeScript lib yet
        const battery = await navigator.getBattery()

        // Validate battery object
        if (!battery || typeof battery !== 'object') {
          throw new Error('Invalid battery object')
        }

        batteryRef.current = battery

        if (!mounted) return undefined

        // Set initial status
        updateBatteryStatus(battery)

        // Add event listeners for battery changes
        const handleLevelChange = () => updateBatteryStatus(battery)
        const handleChargingChange = () => updateBatteryStatus(battery)
        const handleChargingTimeChange = () => updateBatteryStatus(battery)
        const handleDischargingTimeChange = () => updateBatteryStatus(battery)

        battery.addEventListener('levelchange', handleLevelChange)
        battery.addEventListener('chargingchange', handleChargingChange)
        battery.addEventListener('chargingtimechange', handleChargingTimeChange)
        battery.addEventListener('dischargingtimechange', handleDischargingTimeChange)

        // Cleanup function
        return () => {
          battery.removeEventListener('levelchange', handleLevelChange)
          battery.removeEventListener('chargingchange', handleChargingChange)
          battery.removeEventListener('chargingtimechange', handleChargingTimeChange)
          battery.removeEventListener('dischargingtimechange', handleDischargingTimeChange)
        }
      } catch (error) {
        console.warn('Error accessing battery status:', error)
        if (mounted) {
          setBatteryStatus({
            level: 1,
            charging: false,
            chargingTime: Infinity,
            dischargingTime: Infinity,
            supported: false,
          })
        }
        return undefined
      }
    }

    const cleanup = initBattery()

    return () => {
      mounted = false
      cleanup.then((cleanupFn) => cleanupFn?.())
    }
  }, [])

  return batteryStatus
}
