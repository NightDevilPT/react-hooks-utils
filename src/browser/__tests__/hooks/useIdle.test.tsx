import { renderHook, act, waitFor } from '@testing-library/react'
import { useIdle } from '../../hooks/useIdle'

describe('useIdle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useIdle(5000))

      expect(result.current).toBe(false)
      expect(typeof result.current).toBe('boolean')
    })

    it('should initialize with custom initial state', () => {
      const { result } = renderHook(() => useIdle(5000, { initialState: true }))

      expect(result.current).toBe(true)
    })

    it('should return boolean type', () => {
      const { result } = renderHook(() => useIdle(3000))

      expect(typeof result.current).toBe('boolean')
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useIdle(5000))

      expect(result.current).toBe(false)

      global.window = originalWindow
    })

    it('should work without errors in SSR mode', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useIdle(3000))

      expect(() => result.current).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('State Updates', () => {
    it('should become idle after timeout', () => {
      const { result } = renderHook(() => useIdle(5000))

      expect(result.current).toBe(false)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current).toBe(true)
    })

    it('should reset timer on user activity', () => {
      const { result } = renderHook(() => useIdle(5000))

      expect(result.current).toBe(false)

      // Advance time partially
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(result.current).toBe(false)

      // Trigger activity
      act(() => {
        window.dispatchEvent(new Event('mousemove'))
      })

      // Advance remaining time (should not be idle yet)
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current).toBe(false)

      // Advance full timeout from activity
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(result.current).toBe(true)
    })

    it('should become active after activity when idle', () => {
      const { result } = renderHook(() => useIdle(5000))

      // Become idle
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current).toBe(true)

      // Trigger activity
      act(() => {
        window.dispatchEvent(new Event('keydown'))
      })

      expect(result.current).toBe(false)
    })

    it('should handle multiple activity events', () => {
      const { result } = renderHook(() => useIdle(2000))

      expect(result.current).toBe(false)

      act(() => {
        jest.advanceTimersByTime(1000)
        window.dispatchEvent(new Event('mousemove'))
        jest.advanceTimersByTime(1000)
        window.dispatchEvent(new Event('mousedown'))
        jest.advanceTimersByTime(1000)
        window.dispatchEvent(new Event('scroll'))
      })

      expect(result.current).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const originalAddEventListener = window.addEventListener

      window.addEventListener = jest.fn(() => {
        throw new Error('Event listener error')
      })

      const { result } = renderHook(() => useIdle(5000))

      expect(result.current).toBeDefined()
      expect(consoleWarnSpy).toHaveBeenCalled()

      window.addEventListener = originalAddEventListener
      consoleWarnSpy.mockRestore()
    })

    it('should not crash on invalid timeout', () => {
      const { result } = renderHook(() => useIdle(-1))

      expect(result.current).toBeDefined()
    })
  })

  describe('Cleanup', () => {
    it('should clear timer on unmount', () => {
      const { unmount } = renderHook(() => useIdle(5000))

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useIdle(5000))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should not cause memory leaks', () => {
      const { unmount } = renderHook(() => useIdle(5000))

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should call onIdle callback when becoming idle', () => {
      const onIdle = jest.fn()
      const { result } = renderHook(() => useIdle(5000, { onIdle }))

      expect(result.current).toBe(false)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current).toBe(true)
      expect(onIdle).toHaveBeenCalledTimes(1)
    })

    it('should call onActive callback when becoming active', () => {
      const onActive = jest.fn()
      const { result } = renderHook(() => useIdle(5000, { onActive }))

      // Become idle
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current).toBe(true)

      // Become active
      act(() => {
        window.dispatchEvent(new Event('mousemove'))
      })

      expect(result.current).toBe(false)
      expect(onActive).toHaveBeenCalledTimes(1)
    })

    it('should use custom events', () => {
      const { result } = renderHook(() => useIdle(3000, { events: ['click', 'dblclick'] }))

      expect(result.current).toBe(false)

      act(() => {
        jest.advanceTimersByTime(2000)
        window.dispatchEvent(new Event('click'))
      })

      expect(result.current).toBe(false)
    })

    it('should work without options', () => {
      const { result } = renderHook(() => useIdle(5000))

      expect(result.current).toBeDefined()
      expect(typeof result.current).toBe('boolean')
    })

    it('should handle undefined callbacks', () => {
      const { result } = renderHook(() => useIdle(3000, { onIdle: undefined, onActive: undefined }))

      expect(() => {
        act(() => {
          jest.advanceTimersByTime(3000)
        })
      }).not.toThrow()

      expect(result.current).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero timeout', () => {
      const { result } = renderHook(() => useIdle(0))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(result.current).toBeDefined()
    })

    it('should handle very large timeout', () => {
      const { result } = renderHook(() => useIdle(Number.MAX_SAFE_INTEGER))

      expect(result.current).toBe(false)
    })

    it('should handle rapid activity changes', () => {
      const { result } = renderHook(() => useIdle(1000))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current).toBe(true)

      act(() => {
        window.dispatchEvent(new Event('mousemove'))
        window.dispatchEvent(new Event('keydown'))
        window.dispatchEvent(new Event('scroll'))
      })

      expect(result.current).toBe(false)
    })

    it('should handle timeout updates', () => {
      const { result, rerender } = renderHook(({ timeout }) => useIdle(timeout), {
        initialProps: { timeout: 5000 },
      })

      expect(result.current).toBe(false)

      rerender({ timeout: 2000 })

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current).toBe(true)
    })

    it('should handle callback updates', () => {
      const onIdle1 = jest.fn()
      const onIdle2 = jest.fn()

      const { rerender } = renderHook(({ onIdle }) => useIdle(3000, { onIdle }), {
        initialProps: { onIdle: onIdle1 },
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(onIdle1).toHaveBeenCalledTimes(1)

      rerender({ onIdle: onIdle2 })

      act(() => {
        window.dispatchEvent(new Event('mousemove'))
        jest.advanceTimersByTime(3000)
      })

      expect(onIdle2).toHaveBeenCalledTimes(1)
      expect(onIdle1).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should handle empty events array', () => {
      const { result } = renderHook(() => useIdle(2000, { events: [] }))

      expect(result.current).toBe(false)

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current).toBe(true)
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct return type', () => {
      const { result } = renderHook(() => useIdle(5000))

      const isIdle: boolean = result.current

      expect(typeof isIdle).toBe('boolean')
    })

    it('should accept valid options', () => {
      const onIdle = (status: void) => {
        expect(status).toBeUndefined()
      }

      const { result } = renderHook(() =>
        useIdle(5000, {
          onIdle,
          onActive: () => {},
          initialState: false,
          events: ['click'],
        })
      )

      expect(result.current).toBeDefined()
    })
  })
})
