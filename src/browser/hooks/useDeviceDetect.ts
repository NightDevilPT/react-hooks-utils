import { useMemo } from 'react'
import type { IDeviceDetect, IDeviceDetectOptions } from '../interface'

/**
 * Detects device type and operating system
 *
 * @template IDeviceDetect
 * @param {IDeviceDetectOptions} options - Optional configuration
 * @returns {IDeviceDetect} Device detection result
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isMobile, isIOS, isAndroid } = useDeviceDetect()
 *
 *   if (isMobile) {
 *     return <MobileLayout />
 *   }
 *   return <DesktopLayout />
 * }
 * ```
 *
 * @see https://github.com/yourusername/react-hookify#usedevicedetect
 */
export function useDeviceDetect(options?: IDeviceDetectOptions): IDeviceDetect {
  const { userAgent: customUserAgent, ssrMode = false } = options || {}

  const deviceInfo = useMemo(() => {
    // SSR mode - return default values
    if (ssrMode) {
      return getDefaultDeviceInfo()
    }

    // Check if running in browser
    const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined'

    if (!isBrowser) {
      return getDefaultDeviceInfo()
    }

    try {
      const ua = customUserAgent || navigator.userAgent
      return detectDevice(ua)
    } catch (error) {
      console.warn('Error detecting device:', error)
      return getDefaultDeviceInfo()
    }
  }, [customUserAgent, ssrMode])

  return deviceInfo
}

/**
 * Default device info for SSR
 */
function getDefaultDeviceInfo(): IDeviceDetect {
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isWindows: false,
    isMacOS: false,
    isLinux: false,
    isBrowser: false,
    userAgent: '',
  }
}

/**
 * Detect device from user agent string
 */
function detectDevice(userAgent: string): IDeviceDetect {
  const ua = userAgent.toLowerCase()

  // Mobile detection
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i
  const isMobile = mobileRegex.test(ua)

  // Tablet detection
  const tabletRegex = /ipad|android(?!.*mobile)|tablet|kindle|silk/i
  const isTablet = tabletRegex.test(ua)

  // Desktop
  const isDesktop = !isMobile && !isTablet

  // OS detection
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isAndroid = /android/i.test(ua)
  const isWindows = /windows|win32|win64/i.test(ua)
  const isMacOS = /macintosh|mac os x/i.test(ua)
  const isLinux = /linux/i.test(ua) && !isAndroid

  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isWindows,
    isMacOS,
    isLinux,
    isBrowser: true,
    userAgent,
  }
}
