import { renderHook, act, waitFor } from '@testing-library/react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

describe('useMediaQuery', () => {
  let mockMatchMedia: jest.Mock
  let listeners: ((event: MediaQueryListEvent) => void)[] = []

  beforeEach(() => {
    listeners = []

    mockMatchMedia = jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
        listeners.push(handler)
      }),
      removeEventListener: jest.fn(
        (event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler)
        }
      ),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    listeners = []
  })

  describe('Initialization', () => {
    it('should initialize with correct default value', () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(false)
      expect(typeof result.current).toBe('boolean')
    })

    it('should use media query initial matches value', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(max-width: 768px)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(true)
    })

    it('should return boolean type', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

      expect(typeof result.current).toBe('boolean')
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', () => {
      const originalWindow = global.window

      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(false)

      global.window = originalWindow
    })

    it('should handle missing matchMedia API', () => {
      const originalMatchMedia = window.matchMedia

      // @ts-ignore
      delete window.matchMedia

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(false)

      window.matchMedia = originalMatchMedia
    })
  })

  describe('State Updates', () => {
    it('should update when media query matches', async () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(false)

      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: true, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('should update when media query stops matching', async () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(max-width: 768px)',
        addEventListener: jest.fn(
          (event: string, handler: (event: MediaQueryListEvent) => void) => {
            listeners.push(handler)
          }
        ),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(true)

      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: false, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })

    it('should handle multiple state changes', async () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(false)

      // Change to true
      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: true, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(result.current).toBe(true)
      })

      // Change back to false
      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: false, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      window.matchMedia = jest.fn(() => {
        throw new Error('matchMedia error')
      })

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should handle invalid query strings', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = renderHook(() => useMediaQuery('invalid query'))

      expect(result.current).toBeDefined()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.fn()

      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(max-width: 768px)',
        addEventListener: jest.fn(),
        removeEventListener: removeEventListenerSpy,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should handle legacy removeListener for old browsers', () => {
      const removeListenerSpy = jest.fn()

      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(max-width: 768px)',
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: jest.fn(),
        removeListener: removeListenerSpy,
        dispatchEvent: jest.fn(),
      })

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      unmount()

      expect(removeListenerSpy).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should not cause memory leaks', () => {
      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should call onChange callback when match state changes', async () => {
      const onChange = jest.fn()
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)', { onChange }))

      expect(result.current).toBe(false)

      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: true, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(true)
      })
    })

    it('should call onChange with false when stops matching', async () => {
      const onChange = jest.fn()

      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(max-width: 768px)',
        addEventListener: jest.fn(
          (event: string, handler: (event: MediaQueryListEvent) => void) => {
            listeners.push(handler)
          }
        ),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)', { onChange }))

      expect(result.current).toBe(true)

      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: false, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(false)
      })
    })

    it('should work without options', () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      expect(result.current).toBeDefined()
      expect(typeof result.current).toBe('boolean')
    })

    it('should handle undefined onChange callback', async () => {
      const { result } = renderHook(() =>
        useMediaQuery('(max-width: 768px)', { onChange: undefined })
      )

      expect(() => {
        act(() => {
          listeners.forEach((listener) => {
            listener({ matches: true, media: '(max-width: 768px)' } as MediaQueryListEvent)
          })
        })
      }).not.toThrow()

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query string', () => {
      const { result } = renderHook(() => useMediaQuery(''))

      expect(result.current).toBeDefined()
    })

    it('should handle complex media queries', () => {
      const query = '(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)'
      const { result } = renderHook(() => useMediaQuery(query))

      expect(result.current).toBeDefined()
      expect(mockMatchMedia).toHaveBeenCalledWith(query)
    })

    it('should handle query updates', () => {
      const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
        initialProps: { query: '(max-width: 768px)' },
      })

      expect(result.current).toBe(false)

      rerender({ query: '(min-width: 1024px)' })

      expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
    })

    it('should handle onChange callback updates', async () => {
      const onChange1 = jest.fn()
      const onChange2 = jest.fn()

      const { rerender } = renderHook(
        ({ onChange }) => useMediaQuery('(max-width: 768px)', { onChange }),
        { initialProps: { onChange: onChange1 } }
      )

      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: true, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(onChange1).toHaveBeenCalledWith(true)
      })

      rerender({ onChange: onChange2 })

      act(() => {
        listeners.forEach((listener) => {
          listener({ matches: false, media: '(max-width: 768px)' } as MediaQueryListEvent)
        })
      })

      await waitFor(() => {
        expect(onChange2).toHaveBeenCalledWith(false)
        expect(onChange1).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle prefers-color-scheme queries', () => {
      const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))

      expect(result.current).toBeDefined()
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('should handle orientation queries', () => {
      const { result } = renderHook(() => useMediaQuery('(orientation: portrait)'))

      expect(result.current).toBeDefined()
      expect(mockMatchMedia).toHaveBeenCalledWith('(orientation: portrait)')
    })

    it('should handle hover queries', () => {
      const { result } = renderHook(() => useMediaQuery('(hover: hover)'))

      expect(result.current).toBeDefined()
      expect(mockMatchMedia).toHaveBeenCalledWith('(hover: hover)')
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct return type', () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'))

      const matches: boolean = result.current

      expect(typeof matches).toBe('boolean')
    })

    it('should accept valid options', () => {
      const onChange = (matches: boolean) => {
        expect(typeof matches).toBe('boolean')
      }

      const { result } = renderHook(() =>
        useMediaQuery('(max-width: 768px)', {
          defaultValue: true,
          onChange,
        })
      )

      expect(result.current).toBeDefined()
    })
  })
})
