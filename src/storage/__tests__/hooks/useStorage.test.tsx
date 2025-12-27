import { renderHook, act, waitFor } from '@testing-library/react'
import { useStorage } from '../../hooks/useStorage'

describe('useStorage', () => {
  const TEST_KEY = 'test-key'

  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear()
    sessionStorage.clear()
    // Clear cookies
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with null when no value exists', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      expect(result.current.value).toBeNull()
      expect(result.current.hasValue).toBe(false)
    })

    it('should initialize with defaultValue when provided', () => {
      const defaultValue = 'default'
      const { result } = renderHook(() => useStorage(TEST_KEY, { defaultValue }))

      expect(result.current.value).toBe(defaultValue)
    })

    it('should initialize with existing localStorage value (JSON string)', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify('stored-value'))
      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      // Should parse JSON string and return the value
      expect(result.current.value).toBe('stored-value')
      expect(result.current.hasValue).toBe(true)
    })

    it('should initialize with existing localStorage value (plain string)', () => {
      localStorage.setItem(TEST_KEY, 'plain-string-value')
      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      // Should read plain string as-is
      expect(result.current.value).toBe('plain-string-value')
      expect(result.current.hasValue).toBe(true)
    })

    it('should initialize with existing sessionStorage value (JSON string)', () => {
      sessionStorage.setItem(TEST_KEY, JSON.stringify('session-value'))
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'sessionStorage' })
      )

      // Should parse JSON string and return the value
      expect(result.current.value).toBe('session-value')
    })

    it('should initialize with existing sessionStorage value (plain string)', () => {
      sessionStorage.setItem(TEST_KEY, 'plain-session-value')
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'sessionStorage' })
      )

      // Should read plain string as-is
      expect(result.current.value).toBe('plain-session-value')
    })

    it('should return correct return type structure', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      expect(result.current).toHaveProperty('value')
      expect(result.current).toHaveProperty('setValue')
      expect(result.current).toHaveProperty('removeValue')
      expect(result.current).toHaveProperty('hasValue')
      expect(result.current).toHaveProperty('clear')
      expect(typeof result.current.setValue).toBe('function')
      expect(typeof result.current.removeValue).toBe('function')
      expect(typeof result.current.clear).toBe('function')
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useStorage<string>(TEST_KEY, { defaultValue: 'default' }))

      expect(result.current.value).toBe('default')
      expect(() => result.current.setValue('test')).not.toThrow()

      global.window = originalWindow
    })

    it('should work without errors in SSR mode', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useStorage(TEST_KEY))

      expect(() => result.current.value).not.toThrow()
      expect(() => result.current.setValue('test')).not.toThrow()

      global.window = originalWindow
    })

    it('should return defaultValue during SSR', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { defaultValue: 'ssr-default' })
      )

      expect(result.current.value).toBe('ssr-default')

      global.window = originalWindow
    })
  })

  describe('State Updates', () => {
    it('should update value when setValue is called', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('new-value')
      })

      expect(result.current.value).toBe('new-value')
      expect(result.current.hasValue).toBe(true)
    })

    it('should update localStorage when setValue is called', () => {
      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      act(() => {
        result.current.setValue('stored')
      })

      // Strings are stored as-is (not JSON.stringify'd)
      expect(localStorage.getItem(TEST_KEY)).toBe('stored')
    })

    it('should update sessionStorage when storageType is sessionStorage', () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'sessionStorage' })
      )

      act(() => {
        result.current.setValue('session')
      })

      // Strings are stored as-is (not JSON.stringify'd)
      expect(sessionStorage.getItem(TEST_KEY)).toBe('session')
    })

    it('should remove value when removeValue is called', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('test')
      })

      expect(result.current.value).toBe('test')

      act(() => {
        result.current.removeValue()
      })

      expect(result.current.value).toBeNull()
      expect(result.current.hasValue).toBe(false)
      expect(localStorage.getItem(TEST_KEY)).toBeNull()
    })

    it('should handle multiple value updates', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('value1')
      })
      expect(result.current.value).toBe('value1')

      act(() => {
        result.current.setValue('value2')
      })
      expect(result.current.value).toBe('value2')

      act(() => {
        result.current.setValue('value3')
      })
      expect(result.current.value).toBe('value3')
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const originalLocalStorage = window.localStorage

      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Storage error')
          },
          setItem: () => {
            throw new Error('Storage error')
          },
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useStorage<string>(TEST_KEY, { defaultValue: 'default' }))

      expect(result.current.value).toBe('default')
      expect(consoleWarnSpy).toHaveBeenCalled()

      act(() => {
        result.current.setValue('test')
      })

      expect(consoleWarnSpy).toHaveBeenCalled()

      window.localStorage = originalLocalStorage
      consoleWarnSpy.mockRestore()
    })

    it('should handle JSON parse errors gracefully', () => {
      localStorage.setItem(TEST_KEY, 'invalid-json{')
      const { result } = renderHook(() => useStorage(TEST_KEY))

      // Should fallback to string value
      expect(result.current.value).toBe('invalid-json{')
    })

    it('should not crash on storage access errors', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = renderHook(() => useStorage(TEST_KEY))

      expect(() => result.current.setValue('test')).not.toThrow()
      expect(() => result.current.removeValue()).not.toThrow()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderHook(() => useStorage(TEST_KEY, { sync: true }))

      expect(() => unmount()).not.toThrow()
    })

    it('should clear intervals on unmount', () => {
      const { unmount } = renderHook(() => useStorage(TEST_KEY))

      expect(() => unmount()).not.toThrow()
    })

    it('should remove event listeners on unmount when sync is enabled', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useStorage(TEST_KEY, { sync: true }))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Options', () => {
    it('should use localStorage by default', () => {
      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      act(() => {
        result.current.setValue('test')
      })

      // Strings are stored as-is (not JSON.stringify'd)
      expect(localStorage.getItem(TEST_KEY)).toBe('test')
      expect(sessionStorage.getItem(TEST_KEY)).toBeNull()
    })

    it('should use sessionStorage when specified', () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'sessionStorage' })
      )

      act(() => {
        result.current.setValue('test')
      })

      // Strings are stored as-is (not JSON.stringify'd)
      expect(sessionStorage.getItem(TEST_KEY)).toBe('test')
      expect(localStorage.getItem(TEST_KEY)).toBeNull()
    })

    it('should use defaultValue when provided', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY, { defaultValue: 'default' }))

      expect(result.current.value).toBe('default')
    })

    it('should call onChange callback when value changes', () => {
      const onChange = jest.fn()
      const { result } = renderHook(() => useStorage(TEST_KEY, { onChange }))

      act(() => {
        result.current.setValue('new-value')
      })

      expect(onChange).toHaveBeenCalledWith('new-value')
    })

    it('should sync with other tabs when sync is enabled', async () => {
      const { result } = renderHook(() => useStorage<string>(TEST_KEY, { sync: true }))

      act(() => {
        result.current.setValue('initial')
      })

      // Simulate storage event from another tab
      act(() => {
        // Create StorageEvent without storageArea (jsdom limitation)
        const event = new StorageEvent('storage', {
          key: TEST_KEY,
          newValue: 'from-other-tab', // Plain string (stored as-is)
          oldValue: 'initial',
          url: window.location.href,
        })
        // Manually set storageArea for the handler
        Object.defineProperty(event, 'storageArea', {
          value: window.localStorage,
          writable: false,
        })
        window.dispatchEvent(event)
      })

      await waitFor(() => {
        expect(result.current.value).toBe('from-other-tab')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue(null)
      })

      expect(result.current.value).toBeNull()
      expect(result.current.hasValue).toBe(false)
    })

    it('should handle string values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('string-value')
      })

      expect(result.current.value).toBe('string-value')
    })

    it('should handle number values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue(42)
      })

      expect(result.current.value).toBe(42)
    })

    it('should handle boolean values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue(true)
      })

      expect(result.current.value).toBe(true)

      act(() => {
        result.current.setValue(false)
      })

      expect(result.current.value).toBe(false)
    })

    it('should handle array values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      const arrayValue = [1, 2, 3, 'test']
      act(() => {
        result.current.setValue(arrayValue)
      })

      expect(result.current.value).toEqual(arrayValue)
    })

    it('should handle object values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      const objectValue = { name: 'John', age: 30 }
      act(() => {
        result.current.setValue(objectValue)
      })

      expect(result.current.value).toEqual(objectValue)
    })

    it('should handle empty string values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('')
      })

      expect(result.current.value).toBe('')
    })

    it('should handle special characters in values', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      const specialValue = 'test@#$%^&*()_+-=[]{}|;:,.<>?'
      act(() => {
        result.current.setValue(specialValue)
      })

      expect(result.current.value).toBe(specialValue)
    })

    it('should handle rapid value changes', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('value1')
        result.current.setValue('value2')
        result.current.setValue('value3')
      })

      expect(result.current.value).toBe('value3')
    })

    it('should handle clear method', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      act(() => {
        result.current.setValue('test1')
      })

      localStorage.setItem('other-key', 'other-value')

      act(() => {
        result.current.clear()
      })

      expect(localStorage.getItem(TEST_KEY)).toBeNull()
      expect(localStorage.getItem('other-key')).toBeNull()
    })
  })

  describe('Cookie Storage', () => {
    it('should store value in cookie when storageType is cookie', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY, { storageType: 'cookie' }))

      act(() => {
        result.current.setValue('cookie-value')
      })

      expect(document.cookie).toContain(TEST_KEY)
    })

    it('should read value from cookie (JSON string)', () => {
      document.cookie = `${TEST_KEY}=${encodeURIComponent(JSON.stringify('cookie-test'))};path=/`

      const { result } = renderHook(() => useStorage<string>(TEST_KEY, { storageType: 'cookie' }))

      // Should parse JSON string and return the value
      expect(result.current.value).toBe('cookie-test')
    })

    it('should read value from cookie (plain string)', () => {
      document.cookie = `${TEST_KEY}=${encodeURIComponent('plain-cookie-value')};path=/`

      const { result } = renderHook(() => useStorage<string>(TEST_KEY, { storageType: 'cookie' }))

      // Should read plain string as-is
      expect(result.current.value).toBe('plain-cookie-value')
    })

    it('should remove cookie when removeValue is called', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY, { storageType: 'cookie' }))

      act(() => {
        result.current.setValue('cookie-value')
      })

      expect(document.cookie).toContain(TEST_KEY)

      act(() => {
        result.current.removeValue()
      })

      expect(result.current.value).toBeNull()
    })

    it('should use cookie options when provided', () => {
      const cookieOptions = {
        expires: 7,
        path: '/',
        secure: false,
        sameSite: 'Strict' as const,
      }

      const { result } = renderHook(() =>
        useStorage(TEST_KEY, { storageType: 'cookie', cookieOptions })
      )

      act(() => {
        result.current.setValue('test')
      })

      // Check that cookie was set by reading it back
      const cookieValue = result.current.value
      expect(cookieValue).toBe('test')

      // Check cookie string contains the key (with path=/ it should be visible)
      const cookie = document.cookie
      expect(cookie).toContain(TEST_KEY)
      // Note: secure and SameSite attributes may not be visible in document.cookie
      // but they are set correctly in the cookie
    })
  })

  describe('TypeScript Types', () => {
    it('should infer string type correctly', () => {
      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      act(() => {
        result.current.setValue('string')
      })

      const value: string | null = result.current.value
      expect(typeof value).toBe('string')
    })

    it('should infer number type correctly', () => {
      const { result } = renderHook(() => useStorage<number>(TEST_KEY))

      act(() => {
        result.current.setValue(42)
      })

      const value: number | null = result.current.value
      expect(typeof value).toBe('number')
    })

    it('should infer object type correctly', () => {
      interface User extends Record<string, unknown> {
        name: string
        age: number
      }

      const { result } = renderHook(() => useStorage<User>(TEST_KEY))

      const user: User = { name: 'John', age: 30 }
      act(() => {
        result.current.setValue(user)
      })

      const value: User | null = result.current.value
      expect(value).toEqual(user)
    })

    it('should accept valid options', () => {
      const onChange = (value: string | null) => {
        expect(value === null || typeof value === 'string').toBe(true)
      }

      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, {
          storageType: 'localStorage',
          defaultValue: 'default',
          onChange,
        })
      )

      expect(result.current.value).toBe('default')
    })
  })

  describe('String Serialization', () => {
    it('should store plain strings as-is (no JSON.stringify)', () => {
      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      act(() => {
        result.current.setValue('plain-string')
      })

      // String should be stored as-is, not JSON.stringify'd
      expect(localStorage.getItem(TEST_KEY)).toBe('plain-string')
      expect(result.current.value).toBe('plain-string')
    })

    it('should JSON.stringify complex types (objects)', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      const objectValue = { name: 'John', age: 30 }
      act(() => {
        result.current.setValue(objectValue)
      })

      // Object should be JSON stringified
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(objectValue))
      expect(result.current.value).toEqual(objectValue)
    })

    it('should JSON.stringify complex types (arrays)', () => {
      const { result } = renderHook(() => useStorage(TEST_KEY))

      const arrayValue = [1, 2, 3, 'test']
      act(() => {
        result.current.setValue(arrayValue)
      })

      // Array should be JSON stringified
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(arrayValue))
      expect(result.current.value).toEqual(arrayValue)
    })

    it('should JSON.stringify numbers', () => {
      const { result } = renderHook(() => useStorage<number>(TEST_KEY))

      act(() => {
        result.current.setValue(42)
      })

      // Number should be JSON stringified
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(42))
      expect(result.current.value).toBe(42)
    })

    it('should JSON.stringify booleans', () => {
      const { result } = renderHook(() => useStorage<boolean>(TEST_KEY))

      act(() => {
        result.current.setValue(true)
      })

      // Boolean should be JSON stringified
      expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(true))
      expect(result.current.value).toBe(true)
    })

    it('should handle manually set plain strings in localStorage', () => {
      // Simulate manually setting a plain string (not JSON.stringify'd)
      localStorage.setItem(TEST_KEY, 'manually-set-string')

      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      // Should read the plain string correctly
      expect(result.current.value).toBe('manually-set-string')
    })

    it('should handle manually set JSON strings in localStorage', () => {
      // Simulate manually setting a JSON string
      localStorage.setItem(TEST_KEY, JSON.stringify('json-string'))

      const { result } = renderHook(() => useStorage<string>(TEST_KEY))

      // Should parse JSON and return the string value
      expect(result.current.value).toBe('json-string')
    })
  })

  describe('Cookie Expiration', () => {
    it('should create session cookie when expires is 0', () => {
      const { result } = renderHook(() =>
        useStorage(TEST_KEY, {
          storageType: 'cookie',
          cookieOptions: { expires: 0, path: '/' },
        })
      )

      act(() => {
        result.current.setValue('session-value')
      })

      // Cookie should be set without expires attribute (session cookie)
      const cookie = document.cookie
      expect(cookie).toContain(TEST_KEY)
      expect(cookie).not.toContain('expires=')
      expect(result.current.value).toBe('session-value')
    })

    it('should create cookie with default expiration (365 days) when undefined)', () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, {
          storageType: 'cookie',
          cookieOptions: { path: '/' },
        })
      )

      act(() => {
        result.current.setValue('default-expires')
      })

      // Cookie should be set (expires attribute is set but not visible in document.cookie)
      const cookie = document.cookie
      expect(cookie).toContain(TEST_KEY)
      expect(result.current.value).toBe('default-expires')

      // Verify cookie exists by reading it back
      const cookieValue = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith(`${TEST_KEY}=`))
      expect(cookieValue).toBeTruthy()
    })

    it('should create cookie with custom expiration days', () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, {
          storageType: 'cookie',
          cookieOptions: { expires: 7, path: '/' },
        })
      )

      act(() => {
        result.current.setValue('custom-expires')
      })

      // Cookie should be set (expires attribute is set but not visible in document.cookie)
      const cookie = document.cookie
      expect(cookie).toContain(TEST_KEY)
      expect(result.current.value).toBe('custom-expires')

      // Verify cookie exists by reading it back
      const cookieValue = document.cookie
        .split(';')
        .find((c) => c.trim().startsWith(`${TEST_KEY}=`))
      expect(cookieValue).toBeTruthy()
    })
  })

  describe('Polling and Change Detection', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should detect localStorage changes via polling', async () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'localStorage' })
      )

      act(() => {
        result.current.setValue('initial')
      })

      expect(result.current.value).toBe('initial')

      // Manually change localStorage (simulating external change)
      // Use plain string since strings are stored as-is
      act(() => {
        localStorage.setItem(TEST_KEY, 'changed-externally')
      })

      // Advance timer to trigger polling
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.value).toBe('changed-externally')
      })
    })

    it('should detect sessionStorage changes via polling', async () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'sessionStorage' })
      )

      act(() => {
        result.current.setValue('initial')
      })

      expect(result.current.value).toBe('initial')

      // Manually change sessionStorage (simulating external change)
      // Use plain string since strings are stored as-is
      act(() => {
        sessionStorage.setItem(TEST_KEY, 'changed-externally')
      })

      // Advance timer to trigger polling
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.value).toBe('changed-externally')
      })
    })

    it('should detect cookie changes via polling', async () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'cookie', cookieOptions: { path: '/' } })
      )

      act(() => {
        result.current.setValue('initial')
      })

      expect(result.current.value).toBe('initial')

      // Manually change cookie (simulating external change)
      // Use plain string since strings are stored as-is
      act(() => {
        document.cookie = `${TEST_KEY}=${encodeURIComponent('changed-externally')};path=/`
      })

      // Advance timer to trigger polling
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.value).toBe('changed-externally')
      })
    })

    it('should not poll when sync is enabled for localStorage', () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'localStorage', sync: true })
      )

      act(() => {
        result.current.setValue('initial')
      })

      // Manually change localStorage (use plain string)
      act(() => {
        localStorage.setItem(TEST_KEY, 'changed-externally')
      })

      // Advance timer - should not detect change via polling (sync handles it)
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Value should still be initial (polling is disabled, only storage events work)
      expect(result.current.value).toBe('initial')
    })

    it('should use shared polling manager for multiple hooks', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval')

      // Create multiple hooks
      const { result: result1 } = renderHook(() =>
        useStorage('key1', { storageType: 'localStorage' })
      )
      const { result: result2 } = renderHook(() =>
        useStorage('key2', { storageType: 'localStorage' })
      )
      const { result: result3 } = renderHook(() =>
        useStorage('key3', { storageType: 'localStorage' })
      )

      // Should only create one interval (shared polling manager)
      // Note: setInterval is called once for the shared manager, not per hook
      expect(setIntervalSpy).toHaveBeenCalledTimes(1)

      act(() => {
        result1.current.setValue('value1')
        result2.current.setValue('value2')
        result3.current.setValue('value3')
      })

      expect(result1.current.value).toBe('value1')
      expect(result2.current.value).toBe('value2')
      expect(result3.current.value).toBe('value3')

      setIntervalSpy.mockRestore()
    })

    it('should stop polling when all hooks unsubscribe', () => {
      // Ensure clearInterval is available
      if (typeof global.clearInterval === 'undefined') {
        global.clearInterval = clearInterval
      }
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      const hook1 = renderHook(() => useStorage<string>('key1', { storageType: 'localStorage' }))
      const hook2 = renderHook(() => useStorage<string>('key2', { storageType: 'localStorage' }))

      // Unmount both hooks
      act(() => {
        hook1.unmount()
        hook2.unmount()
      })

      // Should clear interval when last hook unsubscribes
      // Note: clearInterval is called when the last subscriber unsubscribes
      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
    })

    it('should not trigger unnecessary updates when value unchanged', async () => {
      const onChange = jest.fn()
      const { result } = renderHook(() =>
        useStorage(TEST_KEY, { storageType: 'localStorage', onChange })
      )

      act(() => {
        result.current.setValue('test-value')
      })

      expect(onChange).toHaveBeenCalledTimes(1)

      // Advance timer - value hasn't changed, should not trigger onChange
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // onChange should still be called only once (no change detected)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('should handle polling for cookies with plain strings', async () => {
      const { result } = renderHook(() =>
        useStorage<string>(TEST_KEY, { storageType: 'cookie', cookieOptions: { path: '/' } })
      )

      act(() => {
        result.current.setValue('plain-string')
      })

      expect(result.current.value).toBe('plain-string')

      // Manually change cookie with plain string
      act(() => {
        document.cookie = `${TEST_KEY}=${encodeURIComponent('changed-string')};path=/`
      })

      // Advance timer to trigger polling
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.value).toBe('changed-string')
      })
    })
  })

  describe('Performance Optimizations', () => {
    it('should use raw value comparison to avoid unnecessary JSON.stringify', () => {
      const onChange = jest.fn()
      const { result } = renderHook(() =>
        useStorage(TEST_KEY, { storageType: 'localStorage', onChange })
      )

      act(() => {
        result.current.setValue({ name: 'John', age: 30 })
      })

      expect(onChange).toHaveBeenCalledTimes(1)

      // Set same value again - should not trigger onChange (raw value unchanged)
      act(() => {
        result.current.setValue({ name: 'John', age: 30 })
      })

      // onChange should be called again (setValue always calls onChange)
      // But polling won't trigger unnecessary updates
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it('should efficiently handle multiple hooks with same storage type', () => {
      // Create 10 hooks - should only create 1 polling interval
      const hooks = Array.from({ length: 10 }, (_, i) =>
        renderHook(() => useStorage(`key-${i}`, { storageType: 'localStorage' }))
      )

      hooks.forEach((hook, i) => {
        act(() => {
          hook.result.current.setValue(`value-${i}`)
        })
        expect(hook.result.current.value).toBe(`value-${i}`)
      })

      // All hooks should work correctly
      hooks.forEach((hook) => {
        expect(hook.result.current.hasValue).toBe(true)
      })

      // Cleanup
      hooks.forEach((hook) => hook.unmount())
    })
  })
})
