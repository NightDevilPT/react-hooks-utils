/**
 * Options for useMediaQuery hook
 */
export interface IMediaQueryOptions {
  /**
   * Default value to return during SSR or if matchMedia is not supported
   * @default false
   */
  defaultValue?: boolean

  /**
   * Callback when media query match state changes
   */
  onChange?: (matches: boolean) => void
}
