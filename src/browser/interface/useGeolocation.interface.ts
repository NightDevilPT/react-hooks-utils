/**
 * Geolocation coordinates
 */
export interface IGeolocationCoordinates {
  /**
   * Latitude in decimal degrees
   */
  latitude: number

  /**
   * Longitude in decimal degrees
   */
  longitude: number

  /**
   * Accuracy in meters
   */
  accuracy: number

  /**
   * Altitude in meters (null if not available)
   */
  altitude: number | null

  /**
   * Altitude accuracy in meters (null if not available)
   */
  altitudeAccuracy: number | null

  /**
   * Heading in degrees (null if not available)
   */
  heading: number | null

  /**
   * Speed in meters per second (null if not available)
   */
  speed: number | null
}

/**
 * Geolocation state
 */
export interface IGeolocation {
  /**
   * Loading state
   */
  loading: boolean

  /**
   * Error if geolocation failed
   */
  error: GeolocationPositionError | null

  /**
   * Current coordinates (null if not available yet)
   */
  coordinates: IGeolocationCoordinates | null
}

/**
 * Options for useGeolocation hook
 */
export interface IGeolocationOptions extends PositionOptions {
  /**
   * Whether to enable geolocation requests
   * @default false
   */
  enabled?: boolean

  /**
   * Whether to watch position continuously
   * @default false
   */
  watch?: boolean

  /**
   * Callback when position changes
   */
  onSuccess?: (coordinates: IGeolocationCoordinates) => void

  /**
   * Callback when error occurs
   */
  onError?: (error: GeolocationPositionError) => void
}
