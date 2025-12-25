import { renderHook } from '@testing-library/react'
import { useDeviceDetect } from '../../hooks/useDeviceDetect'

describe('useDeviceDetect', () => {
  const originalNavigator = global.navigator

  beforeEach(() => {
    // Reset navigator before each test
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    })
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    test('should initialize with correct device detection', () => {
      const { result } = renderHook(() => useDeviceDetect())

      expect(result.current).toHaveProperty('isMobile')
      expect(result.current).toHaveProperty('isTablet')
      expect(result.current).toHaveProperty('isDesktop')
      expect(result.current).toHaveProperty('isIOS')
      expect(result.current).toHaveProperty('isAndroid')
      expect(result.current).toHaveProperty('userAgent')
    })

    test('should detect desktop by default', () => {
      const { result } = renderHook(() => useDeviceDetect())

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
    })
  })

  describe('SSR Compatibility', () => {
    test('should handle SSR with ssrMode option', () => {
      const { result } = renderHook(() => useDeviceDetect({ ssrMode: true }))

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isBrowser).toBe(false)
      expect(result.current.isMobile).toBe(false)
      expect(result.current.userAgent).toBe('')
    })

    test('should return default values in SSR mode', () => {
      const { result } = renderHook(() => useDeviceDetect({ ssrMode: true }))

      // All device types should be false except desktop
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isIOS).toBe(false)
      expect(result.current.isAndroid).toBe(false)
      expect(result.current.isWindows).toBe(false)
      expect(result.current.isMacOS).toBe(false)
      expect(result.current.isLinux).toBe(false)
      expect(result.current.isBrowser).toBe(false)
    })
  })

  describe('Device Detection', () => {
    test('should detect mobile devices', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        })
      )

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.isIOS).toBe(true)
    })

    test('should detect Android devices', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
        })
      )

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isAndroid).toBe(true)
      expect(result.current.isIOS).toBe(false)
    })

    test('should detect tablets', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        })
      )

      expect(result.current.isTablet).toBe(true)
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isIOS).toBe(true)
    })

    test('should detect Windows', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        })
      )

      expect(result.current.isWindows).toBe(true)
      expect(result.current.isDesktop).toBe(true)
    })

    test('should detect macOS', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        })
      )

      expect(result.current.isMacOS).toBe(true)
      expect(result.current.isDesktop).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Force an error by making navigator.userAgent throw
      Object.defineProperty(global.navigator, 'userAgent', {
        get: () => {
          throw new Error('Test error')
        },
      })

      const { result } = renderHook(() => useDeviceDetect())

      // Should return default values
      expect(result.current.isDesktop).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Options', () => {
    test('should accept custom userAgent', () => {
      const customUA = 'Custom User Agent String'
      const { result } = renderHook(() => useDeviceDetect({ userAgent: customUA }))

      expect(result.current.userAgent).toBe(customUA)
    })

    test('should work without options', () => {
      const { result } = renderHook(() => useDeviceDetect())

      expect(result.current).toBeDefined()
      expect(result.current.isBrowser).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty user agent', () => {
      const { result } = renderHook(() => useDeviceDetect({ userAgent: '' }))

      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isMobile).toBe(false)
    })

    test('should handle unusual user agent strings', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'Some weird bot/crawler string!@#$%',
        })
      )

      expect(result.current).toBeDefined()
      expect(typeof result.current.isMobile).toBe('boolean')
    })

    test('should handle case sensitivity', () => {
      const { result } = renderHook(() =>
        useDeviceDetect({
          userAgent: 'MOZILLA/5.0 (IPHONE; CPU IPHONE OS 14_0)',
        })
      )

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isIOS).toBe(true)
    })
  })

  describe('Memoization', () => {
    test('should memoize result for same options', () => {
      const { result, rerender } = renderHook(({ ua }) => useDeviceDetect({ userAgent: ua }), {
        initialProps: { ua: 'test-ua' },
      })

      const firstResult = result.current

      rerender({ ua: 'test-ua' })

      expect(result.current).toBe(firstResult)
    })

    test('should recalculate when options change', () => {
      const { result, rerender } = renderHook(({ ua }) => useDeviceDetect({ userAgent: ua }), {
        initialProps: { ua: 'Mozilla/5.0 (Windows NT 10.0)' },
      })

      const firstResult = result.current

      rerender({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)' })

      expect(result.current).not.toBe(firstResult)
      expect(result.current.isMobile).toBe(true)
      expect(firstResult.isMobile).toBe(false)
    })
  })

  describe('TypeScript Types', () => {
    test('should have correct return type structure', () => {
      const { result } = renderHook(() => useDeviceDetect())

      expect(typeof result.current.isMobile).toBe('boolean')
      expect(typeof result.current.isTablet).toBe('boolean')
      expect(typeof result.current.isDesktop).toBe('boolean')
      expect(typeof result.current.isIOS).toBe('boolean')
      expect(typeof result.current.isAndroid).toBe('boolean')
      expect(typeof result.current.isWindows).toBe('boolean')
      expect(typeof result.current.isMacOS).toBe('boolean')
      expect(typeof result.current.isLinux).toBe('boolean')
      expect(typeof result.current.isBrowser).toBe('boolean')
      expect(typeof result.current.userAgent).toBe('string')
    })
  })
})
