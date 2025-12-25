import { renderHook, waitFor, act } from '@testing-library/react'
import { useBattery } from '../../hooks/useBattery'

describe('useBattery', () => {
  let mockBattery: any
  let listeners: Record<string, Function[]>

  beforeEach(() => {
    listeners = {
      levelchange: [],
      chargingchange: [],
      chargingtimechange: [],
      dischargingtimechange: [],
    }

    mockBattery = {
      level: 0.8,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 3600,
      addEventListener: jest.fn((event: string, handler: Function) => {
        listeners[event]?.push(handler)
      }),
      removeEventListener: jest.fn((event: string, handler: Function) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((l) => l !== handler)
        }
      }),
    }
    ;(navigator as any).getBattery = jest.fn().mockResolvedValue(mockBattery)
  })

  afterEach(() => {
    jest.clearAllMocks()
    listeners = {
      levelchange: [],
      chargingchange: [],
      chargingtimechange: [],
      dischargingtimechange: [],
    }
  })

  describe('Initialization', () => {
    it('should initialize with default unsupported state', () => {
      const { result } = renderHook(() => useBattery())

      expect(result.current.level).toBe(1)
      expect(result.current.charging).toBe(false)
      expect(result.current.chargingTime).toBe(Infinity)
      expect(result.current.dischargingTime).toBe(Infinity)
      expect(result.current.supported).toBe(false)
    })

    it('should have correct state structure', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current).toHaveProperty('level')
        expect(result.current).toHaveProperty('charging')
        expect(result.current).toHaveProperty('chargingTime')
        expect(result.current).toHaveProperty('dischargingTime')
        expect(result.current).toHaveProperty('supported')
      })
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useBattery())

      expect(result.current.supported).toBe(false)
      expect(result.current.level).toBe(1)

      global.window = originalWindow
    })

    it('should handle missing getBattery API', () => {
      const originalGetBattery = (navigator as any).getBattery

      delete (navigator as any).getBattery

      const { result } = renderHook(() => useBattery())

      expect(result.current.supported).toBe(false)
      ;(navigator as any).getBattery = originalGetBattery
    })
  })

  describe('State Updates', () => {
    it('should update with battery status on mount', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.level).toBe(0.8)
        expect(result.current.charging).toBe(false)
        expect(result.current.chargingTime).toBe(Infinity)
        expect(result.current.dischargingTime).toBe(3600)
        expect(result.current.supported).toBe(true)
      })
    })

    it('should update when battery level changes', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      mockBattery.level = 0.5

      act(() => {
        listeners.levelchange.forEach((listener) => listener())
      })

      await waitFor(() => {
        expect(result.current.level).toBe(0.5)
      })
    })

    it('should update when charging status changes', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      mockBattery.charging = true
      mockBattery.chargingTime = 1800

      act(() => {
        listeners.chargingchange.forEach((listener) => listener())
      })

      await waitFor(() => {
        expect(result.current.charging).toBe(true)
      })
    })

    it('should update when charging time changes', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      mockBattery.chargingTime = 900

      act(() => {
        listeners.chargingtimechange.forEach((listener) => listener())
      })

      await waitFor(() => {
        expect(result.current.chargingTime).toBe(900)
      })
    })

    it('should update when discharging time changes', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      mockBattery.dischargingTime = 1800

      act(() => {
        listeners.dischargingtimechange.forEach((listener) => listener())
      })

      await waitFor(() => {
        expect(result.current.dischargingTime).toBe(1800)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle getBattery errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      ;(navigator as any).getBattery = jest.fn().mockRejectedValue(new Error('Battery error'))

      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.supported).toBe(false)
      })

      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    it('should handle exceptions in initialization', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      ;(navigator as any).getBattery = jest.fn(() => {
        throw new Error('Initialization error')
      })

      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.supported).toBe(false)
      })

      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', async () => {
      const { unmount } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(mockBattery.addEventListener).toHaveBeenCalled()
      })

      unmount()

      await waitFor(() => {
        expect(mockBattery.removeEventListener).toHaveBeenCalledWith(
          'levelchange',
          expect.any(Function)
        )
        expect(mockBattery.removeEventListener).toHaveBeenCalledWith(
          'chargingchange',
          expect.any(Function)
        )
        expect(mockBattery.removeEventListener).toHaveBeenCalledWith(
          'chargingtimechange',
          expect.any(Function)
        )
        expect(mockBattery.removeEventListener).toHaveBeenCalledWith(
          'dischargingtimechange',
          expect.any(Function)
        )
      })
    })

    it('should not cause memory leaks', async () => {
      const { unmount } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(mockBattery.addEventListener).toHaveBeenCalled()
      })

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should call onChange callback when battery status changes', async () => {
      const onChange = jest.fn()
      const { result } = renderHook(() => useBattery({ onChange }))

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      mockBattery.level = 0.6

      act(() => {
        listeners.levelchange.forEach((listener) => listener())
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 0.6,
            supported: true,
          })
        )
      })
    })

    it('should work without options', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
    })

    it('should handle undefined onChange', async () => {
      const { result } = renderHook(() => useBattery({ onChange: undefined }))

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      mockBattery.level = 0.7

      expect(() => {
        act(() => {
          listeners.levelchange.forEach((listener) => listener())
        })
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle full battery', async () => {
      mockBattery.level = 1.0
      mockBattery.charging = false
      mockBattery.chargingTime = Infinity
      mockBattery.dischargingTime = Infinity

      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.level).toBe(1.0)
        expect(result.current.chargingTime).toBe(Infinity)
      })
    })

    it('should handle empty battery', async () => {
      mockBattery.level = 0.0
      mockBattery.charging = false
      mockBattery.dischargingTime = 0

      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.level).toBe(0.0)
        expect(result.current.dischargingTime).toBe(0)
      })
    })

    it('should handle charging state with finite charging time', async () => {
      mockBattery.level = 0.5
      mockBattery.charging = true
      mockBattery.chargingTime = 3600
      mockBattery.dischargingTime = Infinity

      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(result.current.charging).toBe(true)
        expect(result.current.chargingTime).toBe(3600)
        expect(result.current.dischargingTime).toBe(Infinity)
      })
    })

    it('should handle onChange callback updates', async () => {
      const onChange1 = jest.fn()
      const onChange2 = jest.fn()

      const { rerender } = renderHook(({ onChange }) => useBattery({ onChange }), {
        initialProps: { onChange: onChange1 },
      })

      await waitFor(() => {
        expect(onChange1).toHaveBeenCalled()
      })

      rerender({ onChange: onChange2 })

      mockBattery.level = 0.4

      act(() => {
        listeners.levelchange.forEach((listener) => listener())
      })

      await waitFor(() => {
        expect(onChange2).toHaveBeenCalled()
      })
    })

    it('should not update after unmount', async () => {
      const onChange = jest.fn()
      const { unmount } = renderHook(() => useBattery({ onChange }))

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
      })

      const callCount = onChange.mock.calls.length

      unmount()

      // Try to trigger changes after unmount
      mockBattery.level = 0.3

      act(() => {
        listeners.levelchange.forEach((listener) => listener())
      })

      // onChange should not be called again
      expect(onChange).toHaveBeenCalledTimes(callCount)
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct return type structure', async () => {
      const { result } = renderHook(() => useBattery())

      await waitFor(() => {
        expect(typeof result.current.level).toBe('number')
        expect(typeof result.current.charging).toBe('boolean')
        expect(typeof result.current.chargingTime).toBe('number')
        expect(typeof result.current.dischargingTime).toBe('number')
        expect(typeof result.current.supported).toBe('boolean')
      })
    })
  })
})
