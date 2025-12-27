/**
 * Storage type options
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookie'

/**
 * Storage value types
 */
export type StorageValue = string | number | boolean | unknown[] | Record<string, unknown> | null

/**
 * Options for useStorage hook
 */
export interface IUseStorageOptions<T extends StorageValue = StorageValue> {
  /**
   * Storage type to use
   * @default 'localStorage'
   */
  storageType?: StorageType

  /**
   * Default value if key doesn't exist
   * @default null
   */
  defaultValue?: T

  /**
   * Whether to sync with other tabs/windows
   * Only works with localStorage
   * @default false
   */
  sync?: boolean

  /**
   * Cookie-specific options
   */
  cookieOptions?: {
    /**
     * Cookie expiration in days
     * @default 365
     */
    expires?: number
    /**
     * Cookie path
     * @default '/'
     */
    path?: string
    /**
     * Cookie domain
     */
    domain?: string
    /**
     * Secure cookie (HTTPS only)
     * @default false
     */
    secure?: boolean
    /**
     * SameSite cookie attribute
     * @default 'Lax'
     */
    sameSite?: 'Strict' | 'Lax' | 'None'
  }

  /**
   * Callback when value changes
   */
  onChange?: (value: T | null) => void
}

/**
 * Return type for useStorage hook
 */
export interface IUseStorageReturn<T extends StorageValue = StorageValue> {
  /**
   * Current stored value
   */
  value: T | null

  /**
   * Set value in storage
   */
  setValue: (value: T | null) => void

  /**
   * Remove value from storage
   */
  removeValue: () => void

  /**
   * Check if value exists in storage
   */
  hasValue: boolean

  /**
   * Clear all storage (only for localStorage/sessionStorage)
   */
  clear: () => void
}
