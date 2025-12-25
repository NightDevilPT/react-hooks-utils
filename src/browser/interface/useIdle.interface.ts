/**
 * Options for useIdle hook
 */
export interface IIdleOptions {
  /**
   * Events to listen for user activity
   * @default ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
   */
  events?: string[]

  /**
   * Initial idle state
   * @default false
   */
  initialState?: boolean

  /**
   * Callback when user becomes idle
   */
  onIdle?: () => void

  /**
   * Callback when user becomes active
   */
  onActive?: () => void
}
