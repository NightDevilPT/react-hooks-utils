import { useState, useEffect, useRef } from 'react'
import type { IMediaQueryOptions } from '../interface'

/**
 * Listens to CSS media queries and returns match status
 *
 * @param {string} query - CSS media query string
 * @param {IMediaQueryOptions} options - Optional configuration
 * @returns {boolean} True if media query matches, false otherwise
 *
 * @example
 * ```tsx
 * function App() {
 *   const isMobile = useMediaQuery('(max-width: 768px)')
 *   const isDark = useMediaQuery('(prefers-color-scheme: dark)')
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileNav /> : <DesktopNav />}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see https://github.com/yourusername/react-hookify#usemediaquery
 */
export function useMediaQuery(query: string, options?: IMediaQueryOptions): boolean {
  const { defaultValue = false, onChange } = options || {}

  // Initialize with default value for SSR, or actual value in browser
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return defaultValue
    }

    try {
      const mediaQuery = window.matchMedia(query)
      return mediaQuery.matches
    } catch {
      return defaultValue
    }
  })

  const onChangeRef = useRef(onChange)

  // Update onChange ref
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    try {
      // Create MediaQueryList object
      const mediaQuery = window.matchMedia(query)

      // Event handler for media query changes
      const handleChange = (event: MediaQueryListEvent) => {
        const newMatches = event.matches
        setMatches(newMatches)
        onChangeRef.current?.(newMatches)
      }

      // Add event listener
      // Note: Some older browsers use addListener instead of addEventListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        // @ts-ignore - addListener is deprecated but still needed for old browsers
        mediaQuery.addListener(handleChange)
      }

      // Cleanup
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange)
        } else {
          // Fallback for older browsers
          // @ts-ignore - removeListener is deprecated but still needed for old browsers
          mediaQuery.removeListener(handleChange)
        }
      }
    } catch (error) {
      console.warn('Error setting up media query listener:', error)
      return undefined
    }
  }, [query])

  return matches
}
