import { useState, useEffect, useRef } from 'react'
import type { IGeolocation, IGeolocationCoordinates, IGeolocationOptions } from '../interface'

/**
 * Access user's geolocation with permission handling
 *
 * @param {IGeolocationOptions} options - Optional configuration
 * @returns {IGeolocation} Geolocation state with coordinates, loading, and error
 */
export function useGeolocation(options?: IGeolocationOptions): IGeolocation {
  const {
    enabled = false,
    watch = false,
    enableHighAccuracy = false,
    timeout = 5000,
    maximumAge = 0,
    onSuccess,
    onError,
  } = options || {}

  const [state, setState] = useState<IGeolocation>({
    loading: false,
    error: null,
    coordinates: null,
  })

  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  useEffect(() => {
    // Don't request location if not enabled
    if (!enabled) {
      return
    }

    // Check if running in browser
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({
        loading: false,
        error: {
          code: 2,
          message: 'Geolocation is not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
        coordinates: null,
      })
      return
    }

    // Set loading state when request starts
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const handleSuccess = (position: GeolocationPosition) => {
      const coordinates: IGeolocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      }

      setState({
        loading: false,
        error: null,
        coordinates,
      })

      onSuccessRef.current?.(coordinates)
    }

    const handleError = (error: GeolocationPositionError) => {
      // Improve error messages for common issues
      let errorMessage = error.message

      // Handle network location provider errors (403, etc.)
      if (error.message.includes('403') || error.message.includes('Network location provider')) {
        errorMessage =
          'Network location service unavailable. Please check your internet connection or enable GPS.'
      } else if (error.message.includes('timeout') || error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.'
      } else if (error.code === 1) {
        errorMessage =
          'Location permission denied. Please enable location access in your browser settings.'
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your device location settings.'
      }

      const enhancedError = {
        ...error,
        message: errorMessage,
      } as GeolocationPositionError

      setState({
        loading: false,
        error: enhancedError,
        coordinates: null,
      })

      onErrorRef.current?.(enhancedError)
    }

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    try {
      if (watch) {
        // Watch position continuously
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          positionOptions
        )
      } else {
        // Get position once
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, positionOptions)
      }

      // Cleanup
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      }
    } catch (error) {
      console.warn('Error accessing geolocation:', error)
      setState({
        loading: false,
        error: {
          code: 2,
          message: 'Failed to access geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
        coordinates: null,
      })
      return undefined
    }
  }, [enabled, watch, enableHighAccuracy, timeout, maximumAge])

  return state
}
