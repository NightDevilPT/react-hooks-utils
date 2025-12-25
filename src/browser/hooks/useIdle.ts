import { useState, useEffect, useRef, useCallback } from 'react'
import type { IIdleOptions } from '../interface'

/**
 * Detects user inactivity after a specified timeout
 *
 * @param {number} timeout - Idle timeout in milliseconds
 * @param {IIdleOptions} options - Optional configuration
 * @returns {boolean} True if user is idle, false if active
 *
 * @example
 * ```tsx
 * function App() {
 *   const isIdle = useIdle(300000) // 5 minutes
 *
 *   useEffect(() => {
 *     if (isIdle) {
 *       console.log('User is idle - pausing operations')
 *     }
 *   }, [isIdle])
 * }
 * ```
 *
 * @see https://github.com/yourusername/react-hookify#useidle
 */
export function useIdle(timeout: number, options?: IIdleOptions): boolean {
  const {
    events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'],
    initialState = false,
    onIdle,
    onActive,
  } = options || {}

  const [isIdle, setIsIdle] = useState<boolean>(initialState)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onIdleRef = useRef(onIdle)
  const onActiveRef = useRef(onActive)

  // Update callback refs
  useEffect(() => {
    onIdleRef.current = onIdle
    onActiveRef.current = onActive
  }, [onIdle, onActive])

  const handleActivity = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set user as active if they were idle
    if (isIdle) {
      setIsIdle(false)
      onActiveRef.current?.()
    }

    // Set new timer for idle state
    timerRef.current = setTimeout(() => {
      setIsIdle(true)
      onIdleRef.current?.()
    }, timeout)
  }, [timeout, isIdle])

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return
    }

    try {
      // Set initial timer
      timerRef.current = setTimeout(() => {
        setIsIdle(true)
        onIdleRef.current?.()
      }, timeout)

      // Add event listeners for user activity
      events.forEach((event) => {
        window.addEventListener(event, handleActivity)
      })

      // Cleanup on unmount
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        events.forEach((event) => {
          window.removeEventListener(event, handleActivity)
        })
      }
    } catch (error) {
      console.warn('Error setting up idle detection:', error)
      return undefined
    }
  }, [timeout, events, handleActivity])

  return isIdle
}
