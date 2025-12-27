// Export browser feature
export {
  useDeviceDetect,
  useOnline,
  useIdle,
  useMediaQuery,
  useNetworkSpeed,
  useGeolocation,
  useBattery,
} from './browser'

export type {
  IDeviceDetect,
  IDeviceDetectOptions,
  IOnlineOptions,
  IIdleOptions,
  IMediaQueryOptions,
  ConnectionType,
  INetworkSpeed,
  INetworkSpeedOptions,
  IGeolocationCoordinates,
  IGeolocation,
  IGeolocationOptions,
  IBattery,
  IBatteryOptions,
} from './browser'

// Export storage feature
export { useStorage } from './storage'

export type { StorageType, StorageValue, IUseStorageOptions, IUseStorageReturn } from './storage'
