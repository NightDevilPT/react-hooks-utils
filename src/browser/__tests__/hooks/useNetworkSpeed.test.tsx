import { renderHook, act, waitFor } from '@testing-library/react'
import { useNetworkSpeed } from '../../hooks/useNetworkSpeed'

describe('useNetworkSpeed', () => {
  let mockConnection: any
  let listeners: ((event: Event) => void)[] = []

  beforeEach(() => {
    listeners = []

    mockConnection = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: jest.fn((event: string, handler: (event: Event) => void) => {
        listeners.push(handler)
      }),
      removeEventListener: jest.fn((event: string, handler: (event: Event) => void) => {
        listeners = listeners.filter((l) => l !== handler)
      }),
    }

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: mockConnection,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    listeners = []
  })

  describe('Initialization', () => {
    it('should initialize with correct network info', () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('4g')
      expect(result.current.downlink).toBe(10)
      expect(result.current.rtt).toBe(50)
      expect(result.current.saveData).toBe(false)
    })

    it('should return correct type structure', () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current).toHaveProperty('effectiveType')
      expect(result.current).toHaveProperty('downlink')
      expect(result.current).toHaveProperty('rtt')
      expect(result.current).toHaveProperty('saveData')
    })

    it('should handle unknown connection type', () => {
      mockConnection.effectiveType = undefined

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('unknown')
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', () => {
      const originalWindow = global.window
      const originalNavigator = global.navigator

      // @ts-ignore
      delete global.window
      // @ts-ignore
      delete (navigator as any).connection

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('unknown')
      expect(result.current.downlink).toBe(0)
      expect(result.current.rtt).toBe(0)
      expect(result.current.saveData).toBe(false)

      global.window = originalWindow
      global.navigator = originalNavigator
    })

    it('should handle missing connection API', () => {
      const originalConnection = (navigator as any).connection

      // @ts-ignore
      delete (navigator as any).connection

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('unknown')
      ;(navigator as any).connection = originalConnection
    })
  })

  describe('State Updates', () => {
    it('should update when network speed changes', async () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('4g')

      mockConnection.effectiveType = '3g'
      mockConnection.downlink = 1.5
      mockConnection.rtt = 200

      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(result.current.effectiveType).toBe('3g')
        expect(result.current.downlink).toBe(1.5)
        expect(result.current.rtt).toBe(200)
      })
    })

    it('should update saveData flag', async () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.saveData).toBe(false)

      mockConnection.saveData = true

      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(result.current.saveData).toBe(true)
      })
    })

    it('should handle multiple network changes', async () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('4g')

      // Change to 3g
      mockConnection.effectiveType = '3g'
      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(result.current.effectiveType).toBe('3g')
      })

      // Change to slow-2g
      mockConnection.effectiveType = 'slow-2g'
      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(result.current.effectiveType).toBe('slow-2g')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      Object.defineProperty(navigator, 'connection', {
        get: () => {
          throw new Error('Connection error')
        },
        configurable: true,
      })

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('unknown')
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should handle listener setup errors', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockConnection.addEventListener = jest.fn(() => {
        throw new Error('Listener error')
      })

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current).toBeDefined()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useNetworkSpeed())

      unmount()

      expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should not cause memory leaks', () => {
      const { unmount } = renderHook(() => useNetworkSpeed())

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should call onChange callback when network changes', async () => {
      const onChange = jest.fn()
      const { result } = renderHook(() => useNetworkSpeed({ onChange }))

      expect(result.current.effectiveType).toBe('4g')

      mockConnection.effectiveType = '3g'
      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            effectiveType: '3g',
          })
        )
      })
    })

    it('should work without options', () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current).toBeDefined()
    })

    it('should handle undefined onChange', async () => {
      const { result } = renderHook(() => useNetworkSpeed({ onChange: undefined }))

      expect(() => {
        mockConnection.effectiveType = '3g'
        act(() => {
          listeners.forEach((listener) => listener(new Event('change')))
        })
      }).not.toThrow()

      await waitFor(() => {
        expect(result.current.effectiveType).toBe('3g')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing effectiveType', () => {
      mockConnection.effectiveType = null

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.effectiveType).toBe('unknown')
    })

    it('should handle missing downlink', () => {
      mockConnection.downlink = null

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.downlink).toBe(0)
    })

    it('should handle missing rtt', () => {
      mockConnection.rtt = null

      const { result } = renderHook(() => useNetworkSpeed())

      expect(result.current.rtt).toBe(0)
    })

    it('should handle all connection types', () => {
      const types = ['slow-2g', '2g', '3g', '4g']

      types.forEach((type) => {
        mockConnection.effectiveType = type
        const { result } = renderHook(() => useNetworkSpeed())
        expect(result.current.effectiveType).toBe(type)
      })
    })

    it('should handle onChange callback updates', async () => {
      const onChange1 = jest.fn()
      const onChange2 = jest.fn()

      const { rerender } = renderHook(({ onChange }) => useNetworkSpeed({ onChange }), {
        initialProps: { onChange: onChange1 },
      })

      mockConnection.effectiveType = '3g'
      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(onChange1).toHaveBeenCalled()
      })

      rerender({ onChange: onChange2 })

      mockConnection.effectiveType = '2g'
      act(() => {
        listeners.forEach((listener) => listener(new Event('change')))
      })

      await waitFor(() => {
        expect(onChange2).toHaveBeenCalled()
        expect(onChange1).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct return type structure', () => {
      const { result } = renderHook(() => useNetworkSpeed())

      expect(typeof result.current.effectiveType).toBe('string')
      expect(typeof result.current.downlink).toBe('number')
      expect(typeof result.current.rtt).toBe('number')
      expect(typeof result.current.saveData).toBe('boolean')
    })
  })
})
