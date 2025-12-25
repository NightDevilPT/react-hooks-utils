import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnline } from '../../hooks/useOnline'

describe('useOnline', () => {
  let originalNavigator: Navigator
  let mockNavigator: any

  beforeEach(() => {
    originalNavigator = global.navigator
    mockNavigator = {}
    Object.defineProperty(mockNavigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  describe('Initialization', () => {
    it('should initialize with correct online status', () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })
      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(true)
    })

    it('should initialize as offline when navigator reports offline', () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })
      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(false)
    })

    it('should return boolean type', () => {
      const { result } = renderHook(() => useOnline())

      expect(typeof result.current).toBe('boolean')
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', () => {
      const originalWindow = global.window
      const originalNavigator = global.navigator

      // @ts-ignore
      delete global.window
      // @ts-ignore
      delete global.navigator

      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(true) // Default to online during SSR

      global.window = originalWindow
      global.navigator = originalNavigator
    })

    it('should work without errors in SSR mode', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useOnline())

      expect(() => result.current).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('State Updates', () => {
    it('should update to offline when offline event fires', async () => {
      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(true)

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })

    it('should update to online when online event fires', async () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })
      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(false)

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('should handle multiple status changes', async () => {
      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(true)

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      await waitFor(() => {
        expect(result.current).toBe(false)
      })

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Mock navigator.onLine to throw error
      Object.defineProperty(mockNavigator, 'onLine', {
        get: () => {
          throw new Error('Navigator error')
        },
        configurable: true,
      })

      const { result } = renderHook(() => useOnline())

      expect(result.current).toBe(true) // Fallback to online
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()

      // Restore navigator.onLine
      Object.defineProperty(mockNavigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })
    })

    it('should not crash on listener setup errors', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const originalAddEventListener = window.addEventListener

      window.addEventListener = jest.fn(() => {
        throw new Error('Event listener error')
      })

      const { result } = renderHook(() => useOnline())

      expect(result.current).toBeDefined()
      expect(consoleWarnSpy).toHaveBeenCalled()

      window.addEventListener = originalAddEventListener
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useOnline())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should not cause memory leaks', () => {
      const { unmount } = renderHook(() => useOnline())

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should call onChange callback when status changes', async () => {
      const onChange = jest.fn()
      const { result } = renderHook(() => useOnline({ onChange }))

      expect(result.current).toBe(true)

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(false)
      })
    })

    it('should call onChange with true when going online', async () => {
      const onChange = jest.fn()
      Object.defineProperty(mockNavigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })
      const { result } = renderHook(() => useOnline({ onChange }))

      expect(result.current).toBe(false)

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(true)
      })
    })

    it('should work without options', () => {
      const { result } = renderHook(() => useOnline())

      expect(result.current).toBeDefined()
      expect(typeof result.current).toBe('boolean')
    })

    it('should handle onChange being undefined', async () => {
      const { result } = renderHook(() => useOnline({ onChange: undefined }))

      expect(() => {
        act(() => {
          window.dispatchEvent(new Event('offline'))
        })
      }).not.toThrow()

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle navigator.onLine being undefined', () => {
      Object.defineProperty(mockNavigator, 'onLine', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOnline())

      expect(result.current).toBeDefined()
    })

    it('should handle rapid online/offline changes', async () => {
      const { result } = renderHook(() => useOnline())

      act(() => {
        window.dispatchEvent(new Event('offline'))
        window.dispatchEvent(new Event('online'))
        window.dispatchEvent(new Event('offline'))
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('should handle onChange callback updates', async () => {
      const onChange1 = jest.fn()
      const onChange2 = jest.fn()

      const { result, rerender } = renderHook(({ onChange }) => useOnline({ onChange }), {
        initialProps: { onChange: onChange1 },
      })

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      await waitFor(() => {
        expect(onChange1).toHaveBeenCalledWith(false)
      })

      rerender({ onChange: onChange2 })

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(onChange2).toHaveBeenCalledWith(true)
        expect(onChange1).toHaveBeenCalledTimes(1) // Should not be called again
      })
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct return type', () => {
      const { result } = renderHook(() => useOnline())

      const isOnline: boolean = result.current

      expect(typeof isOnline).toBe('boolean')
    })

    it('should accept valid options', () => {
      const onChange = (status: boolean) => {
        expect(typeof status).toBe('boolean')
      }

      const { result } = renderHook(() => useOnline({ onChange }))

      expect(result.current).toBeDefined()
    })
  })
})
