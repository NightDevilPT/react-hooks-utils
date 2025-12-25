import { renderHook, waitFor } from '@testing-library/react'
import { useGeolocation } from '../../hooks/useGeolocation'

describe('useGeolocation', () => {
  let mockGeolocation: any

  beforeEach(() => {
    mockGeolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    }

    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true,
      configurable: true,
      value: mockGeolocation,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should start in non-loading state when disabled', () => {
      const { result } = renderHook(() => useGeolocation({ enabled: false }))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.coordinates).toBe(null)
    })

    it('should start in loading state when enabled', () => {
      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.coordinates).toBe(null)
    })

    it('should have correct state structure', () => {
      const { result } = renderHook(() => useGeolocation())

      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('coordinates')
    })
  })

  describe('SSR Compatibility', () => {
    it('should handle SSR (no window)', async () => {
      const originalWindow = global.window
      const originalGeolocation = (navigator as any).geolocation

      // @ts-ignore
      delete global.window
      // @ts-ignore
      delete (navigator as any).geolocation

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeTruthy()
        expect(result.current.error?.message).toContain('not supported')
      })

      global.window = originalWindow
      ;(navigator as any).geolocation = originalGeolocation
    })

    it('should handle missing geolocation API', () => {
      const originalGeolocation = navigator.geolocation

      // @ts-ignore
      delete (navigator as any).geolocation

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
      ;(navigator as any).geolocation = originalGeolocation
    })
  })

  describe('State Updates', () => {
    it('should update with coordinates on success', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(null)
        expect(result.current.coordinates).toEqual({
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        })
      })
    })

    it('should handle geolocation error', async () => {
      const mockError = {
        code: 1,
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any) => {
        error(mockError)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeTruthy()
        expect(result.current.error?.code).toBe(1)
        expect(result.current.error?.message).toContain('permission denied')
        expect(result.current.coordinates).toBe(null)
      })
    })

    it('should watch position continuously when watch is true', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.watchPosition.mockImplementation((success: any) => {
        success(mockPosition)
        return 123
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true, watch: true }))

      await waitFor(() => {
        expect(result.current.coordinates).toBeTruthy()
      })

      expect(mockGeolocation.watchPosition).toHaveBeenCalled()
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any) => {
        error(mockError)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.error?.code).toBe(1)
      })
    })

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2,
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any) => {
        error(mockError)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.error?.code).toBe(2)
      })
    })

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any) => {
        error(mockError)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.error?.code).toBe(3)
      })
    })

    it('should handle exceptions gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockGeolocation.getCurrentPosition.mockImplementation(() => {
        throw new Error('Geolocation error')
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should clear watch on unmount when watching', async () => {
      mockGeolocation.watchPosition.mockImplementation(() => 123)

      const { unmount } = renderHook(() => useGeolocation({ enabled: true, watch: true }))

      await waitFor(() => {
        expect(mockGeolocation.watchPosition).toHaveBeenCalled()
      })

      unmount()

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123)
    })

    it('should not cause memory leaks', () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {})

      const { unmount } = renderHook(() => useGeolocation({ enabled: true }))

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Options', () => {
    it('should call onSuccess callback when coordinates are available', async () => {
      const onSuccess = jest.fn()
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition)
      })

      renderHook(() => useGeolocation({ enabled: true, onSuccess }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: 40.7128,
            longitude: -74.006,
          })
        )
      })
    })

    it('should call onError callback when error occurs', async () => {
      const onError = jest.fn()
      const mockError = {
        code: 1,
        message: 'Permission denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any) => {
        error(mockError)
      })

      renderHook(() => useGeolocation({ enabled: true, onError }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
        const errorArg = onError.mock.calls[0][0]
        expect(errorArg.code).toBe(1)
        expect(errorArg.message).toContain('permission denied')
      })
    })

    it('should pass position options to geolocation API', () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {})

      renderHook(() =>
        useGeolocation({
          enabled: true,
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      )

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })

    it('should work without options', () => {
      const { result } = renderHook(() => useGeolocation())

      expect(result.current).toBeDefined()
      expect(result.current.loading).toBe(false)
    })

    it('should handle undefined callbacks', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition)
      })

      const { result } = renderHook(() =>
        useGeolocation({ enabled: true, onSuccess: undefined, onError: undefined })
      )

      await waitFor(() => {
        expect(result.current.coordinates).toBeTruthy()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle position with all optional fields', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 90,
          speed: 5.5,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(result.current.coordinates).toEqual({
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 90,
          speed: 5.5,
        })
      })
    })

    it('should switch from getCurrentPosition to watchPosition when watch changes', () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {})
      mockGeolocation.watchPosition.mockImplementation(() => 123)

      const { rerender } = renderHook(({ watch }) => useGeolocation({ enabled: true, watch }), {
        initialProps: { watch: false },
      })

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()

      rerender({ watch: true })

      expect(mockGeolocation.watchPosition).toHaveBeenCalled()
    })
  })

  describe('TypeScript Types', () => {
    it('should have correct state type structure', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation({ enabled: true }))

      await waitFor(() => {
        expect(typeof result.current.loading).toBe('boolean')
        expect(result.current.error === null || typeof result.current.error === 'object').toBe(true)
        expect(
          result.current.coordinates === null || typeof result.current.coordinates === 'object'
        ).toBe(true)
      })
    })
  })
})
