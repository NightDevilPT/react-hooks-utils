import { useState, useEffect, useCallback, useRef } from 'react'
import type { IUseStorageOptions, IUseStorageReturn, StorageValue } from '../interface'

/**
 * Shared polling manager for all useStorage hooks
 * Prevents multiple intervals when using multiple hooks
 */
class StoragePollingManager {
  private intervalId: NodeJS.Timeout | null = null
  private subscribers: Set<() => void> = new Set()
  private readonly POLL_INTERVAL = 2000 // 2 seconds - longer interval to reduce overhead

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)

    // Start polling if this is the first subscriber
    if (this.subscribers.size === 1 && this.intervalId === null) {
      this.startPolling()
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)

      // Stop polling if no more subscribers
      if (this.subscribers.size === 0 && this.intervalId !== null) {
        this.stopPolling()
      }
    }
  }

  private startPolling(): void {
    if (typeof window === 'undefined') {
      return
    }

    this.intervalId = setInterval(() => {
      // Notify all subscribers
      this.subscribers.forEach((callback) => {
        try {
          callback()
        } catch (error) {
          // Silently handle errors in callbacks
        }
      })
    }, this.POLL_INTERVAL)
  }

  private stopPolling(): void {
    if (this.intervalId !== null) {
      if (typeof clearInterval !== 'undefined') {
        clearInterval(this.intervalId)
      }
      this.intervalId = null
    }
  }
}

// Singleton instance
const pollingManager = new StoragePollingManager()

/**
 * Hook for managing storage (localStorage, sessionStorage, or cookies)
 * Supports string, number, boolean, array, and JSON object values
 *
 * @template T - Type of the stored value
 * @param {string} key - Storage key
 * @param {IUseStorageOptions<T>} options - Optional configuration
 * @returns {IUseStorageReturn<T>} Storage management object
 *
 * @example
 * ```tsx
 * function App() {
 *   const { value, setValue, removeValue } = useStorage('user', {
 *     defaultValue: null,
 *     storageType: 'localStorage'
 *   })
 *
 *   return (
 *     <div>
 *       <p>Value: {JSON.stringify(value)}</p>
 *       <button onClick={() => setValue({ name: 'John' })}>Set Value</button>
 *       <button onClick={removeValue}>Remove</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @see https://github.com/yourusername/react-hookify#usestorage
 */
export function useStorage<T extends StorageValue = StorageValue>(
  key: string,
  options?: IUseStorageOptions<T>
): IUseStorageReturn<T> {
  const {
    storageType = 'localStorage',
    defaultValue = null,
    sync = false,
    cookieOptions,
    onChange,
  } = options || {}

  // SSR-safe initialization
  const [value, setValueState] = useState<T | null>(() => {
    if (typeof window === 'undefined') {
      return defaultValue ?? null
    }

    try {
      let rawValue: string | null = null

      if (storageType === 'cookie') {
        rawValue = getCookie(key)
      } else if (storageType === 'localStorage') {
        rawValue = window.localStorage.getItem(key)
      } else if (storageType === 'sessionStorage') {
        rawValue = window.sessionStorage.getItem(key)
      }

      if (rawValue === null) {
        return defaultValue ?? null
      }

      // Try to parse as JSON first, fallback to string
      try {
        const parsed = JSON.parse(rawValue)
        return parsed as T
      } catch {
        // If not JSON, return as string (handles plain strings stored without JSON.stringify)
        return rawValue as T
      }
    } catch (error) {
      console.warn(`Error reading storage for key "${key}":`, error)
      return defaultValue ?? null
    }
  })

  const onChangeRef = useRef(onChange)
  const keyRef = useRef(key)
  const storageTypeRef = useRef(storageType)
  const lastValueRef = useRef<string | null>(null) // Track last raw value for polling optimization

  // Update refs
  useEffect(() => {
    onChangeRef.current = onChange
    keyRef.current = key
    storageTypeRef.current = storageType
  }, [onChange, key, storageType])

  // Set value in storage
  const setValue = useCallback(
    (newValue: T | null) => {
      if (typeof window === 'undefined') {
        return
      }

      try {
        const storageKey = keyRef.current
        const type = storageTypeRef.current

        if (newValue === null) {
          // Remove value
          if (type === 'cookie') {
            removeCookie(storageKey, cookieOptions)
            lastValueRef.current = null
          } else if (type === 'localStorage') {
            window.localStorage.removeItem(storageKey)
            lastValueRef.current = null
          } else if (type === 'sessionStorage') {
            window.sessionStorage.removeItem(storageKey)
            lastValueRef.current = null
          }
        } else {
          // Store value - serialize based on type for efficiency
          // Strings are stored as-is, other types are JSON stringified
          const stringValue = typeof newValue === 'string' ? newValue : JSON.stringify(newValue)

          if (type === 'cookie') {
            setCookie(storageKey, stringValue, cookieOptions)
            lastValueRef.current = stringValue
          } else if (type === 'localStorage') {
            window.localStorage.setItem(storageKey, stringValue)
            lastValueRef.current = stringValue
          } else if (type === 'sessionStorage') {
            window.sessionStorage.setItem(storageKey, stringValue)
            lastValueRef.current = stringValue
          }
        }

        setValueState(newValue)
        onChangeRef.current?.(newValue)
      } catch (error) {
        console.warn(`Error setting ${storageTypeRef.current} for key "${keyRef.current}":`, error)
      }
    },
    [cookieOptions]
  )

  // Remove value from storage
  const removeValue = useCallback(() => {
    setValue(null)
  }, [setValue])

  // Clear all storage (only for localStorage/sessionStorage)
  const clear = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const type = storageTypeRef.current
      if (type === 'localStorage') {
        window.localStorage.clear()
      } else if (type === 'sessionStorage') {
        window.sessionStorage.clear()
      }
      // Cookies cannot be cleared all at once
    } catch (error) {
      console.warn(`Error clearing ${storageTypeRef.current}:`, error)
    }
  }, [])

  // Check if value exists
  const hasValue = value !== null

  // Sync with other tabs/windows (only for localStorage)
  useEffect(() => {
    if (typeof window === 'undefined' || !sync || storageType !== 'localStorage') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        const rawValue = e.newValue
        lastValueRef.current = rawValue

        let newValue: T | null = null
        if (rawValue !== null) {
          try {
            // Try to parse as JSON first
            newValue = JSON.parse(rawValue) as T
          } catch {
            // If not JSON, treat as string
            newValue = rawValue as T
          }
        }

        setValueState(newValue)
        onChangeRef.current?.(newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, sync, storageType])

  // Listen for changes in the same window (for programmatic changes)
  // Uses shared polling manager to prevent multiple intervals when using multiple hooks
  // Polls for localStorage, sessionStorage, and cookies to detect programmatic changes
  // Only skips polling when sync is enabled for localStorage (storage events handle it)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const type = storageTypeRef.current

    // Skip polling only if sync is enabled for localStorage (storage events handle it)
    if (sync && type === 'localStorage') {
      return
    }

    const checkValue = () => {
      try {
        const storageKey = keyRef.current
        const currentType = storageTypeRef.current
        let rawValue: string | null = null

        if (currentType === 'cookie') {
          rawValue = getCookie(storageKey)
        } else if (currentType === 'localStorage') {
          rawValue = window.localStorage.getItem(storageKey)
        } else if (currentType === 'sessionStorage') {
          rawValue = window.sessionStorage.getItem(storageKey)
        }

        // Only update if the raw value changed (avoid unnecessary JSON.stringify)
        if (rawValue !== lastValueRef.current) {
          lastValueRef.current = rawValue

          let currentValue: T | null = null
          if (rawValue !== null) {
            try {
              // Try to parse as JSON first
              currentValue = JSON.parse(rawValue) as T
            } catch {
              // If not JSON, treat as string
              currentValue = rawValue as T
            }
          }

          setValueState(currentValue)
          onChangeRef.current?.(currentValue)
        }
      } catch (error) {
        // Silently fail
      }
    }

    // Initialize last value (with error handling)
    const storageKey = keyRef.current
    try {
      if (type === 'cookie') {
        lastValueRef.current = getCookie(storageKey)
      } else if (type === 'localStorage') {
        lastValueRef.current = window.localStorage.getItem(storageKey)
      } else if (type === 'sessionStorage') {
        lastValueRef.current = window.sessionStorage.getItem(storageKey)
      }
    } catch (error) {
      // Silently handle errors during initialization
      lastValueRef.current = null
    }

    // Subscribe to shared polling manager (prevents multiple intervals)
    const unsubscribe = pollingManager.subscribe(checkValue)

    return () => {
      unsubscribe()
      lastValueRef.current = null
    }
  }, [key, storageType, sync])

  return {
    value,
    setValue,
    removeValue,
    hasValue,
    clear,
  }
}

/**
 * Get cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const nameEQ = name + '='
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length))
    }
  }

  return null
}

/**
 * Set cookie value
 */
function setCookie(
  name: string,
  value: string,
  options?: IUseStorageOptions['cookieOptions']
): void {
  if (typeof document === 'undefined') {
    return
  }

  const { expires, path = '/', domain, secure = false, sameSite = 'Lax' } = options || {}

  let cookieString = `${name}=${encodeURIComponent(value)}`

  // Handle expiration: undefined = default (365 days), 0 = session cookie, number = days
  if (expires !== undefined && expires !== 0) {
    const date = new Date()
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000)
    cookieString += `; expires=${date.toUTCString()}`
  } else if (expires === undefined) {
    // Default to 365 days if not specified
    const date = new Date()
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000)
    cookieString += `; expires=${date.toUTCString()}`
  }
  // If expires === 0, don't add expires attribute (session cookie)

  cookieString += `; path=${path}`

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  if (secure) {
    cookieString += '; secure'
  }

  cookieString += `; SameSite=${sameSite}`

  document.cookie = cookieString
}

/**
 * Remove cookie
 */
function removeCookie(name: string, options?: IUseStorageOptions['cookieOptions']): void {
  if (typeof document === 'undefined') {
    return
  }

  const { path = '/', domain } = options || {}

  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`

  if (domain) {
    cookieString += `; domain=${domain}`
  }

  document.cookie = cookieString
}
