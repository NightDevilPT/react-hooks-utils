/**
 * Options for useOnline hook
 */
export interface IOnlineOptions {
  /**
   * Callback when online status changes
   */
  onChange?: (isOnline: boolean) => void
}
