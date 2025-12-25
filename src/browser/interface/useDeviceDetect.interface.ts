/**
 * Device detection result
 */
export interface IDeviceDetect {
  /**
   * Device type flags
   */
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean

  /**
   * Operating system flags
   */
  isIOS: boolean
  isAndroid: boolean
  isWindows: boolean
  isMacOS: boolean
  isLinux: boolean

  /**
   * Browser environment flags
   */
  isBrowser: boolean

  /**
   * Raw user agent string
   */
  userAgent: string
}

/**
 * Options for useDeviceDetect hook
 */
export interface IDeviceDetectOptions {
  /**
   * Custom user agent string for testing
   * @default window.navigator.userAgent
   */
  userAgent?: string

  /**
   * Enable SSR mode (returns default values)
   * @default false
   */
  ssrMode?: boolean
}
