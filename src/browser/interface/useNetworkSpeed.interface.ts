/**
 * Network connection type
 */
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'

/**
 * Network speed information
 */
export interface INetworkSpeed {
  /**
   * Effective connection type
   */
  effectiveType: ConnectionType

  /**
   * Downlink speed in Mbps
   */
  downlink: number

  /**
   * Round-trip time in milliseconds
   */
  rtt: number

  /**
   * Whether data saver mode is enabled
   */
  saveData: boolean
}

/**
 * Options for useNetworkSpeed hook
 */
export interface INetworkSpeedOptions {
  /**
   * Callback when network speed changes
   */
  onChange?: (info: INetworkSpeed) => void
}
