import { useState, useEffect, useCallback, useRef } from 'react'
import type { IOnlineOptions } from '../interface'

/**
 * Detects online/offline network status
 *
 * @param {IOnlineOptions} options - Optional configuration
 * @returns {boolean} True if online, false if offline
 *
 * @example
 * ```tsx
 * function App() {
 *   const isOnline = useOnline()
 *
 *   if (!isOnline) {
 *     return <div>You are offline</div>
 *   }
 *   return <div>You are online</div>
 * }
 * ```
 *
 * @see https://github.com/yourusername/react-hookify#useonline
 */
export function useOnline(options?: IOnlineOptions): boolean {
  const { onChange } = options || {}

  // SSR-safe initialization
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return true // Default to online during SSR
    }

    try {
      return navigator.onLine ?? true // Default to true if undefined
    } catch (error) {
      console.warn('Error checking online status:', error)
      return true
    }
  })

  // Store onChange callback in ref to avoid effect re-runs
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    onChangeRef.current?.(true)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    onChangeRef.current?.(false)
  }, [])

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return
    }

    try {
      // Set up event listeners
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Cleanup on unmount
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    } catch (error) {
      console.warn('Error setting up online/offline listeners:', error)
      return undefined
    }
  }, [handleOnline, handleOffline])

  return isOnline
}
