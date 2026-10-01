import { Platform, Linking } from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export const isHealthConnectSupported = () => Platform.OS === 'android';

export const PLAY_STORE_HEALTH_CONNECT_URL =
  'market://details?id=com.google.android.apps.healthdata';
export const PLAY_STORE_HEALTH_CONNECT_WEB_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

export const openHealthConnectInPlayStore = async () => {
  try {
    await Linking.openURL(PLAY_STORE_HEALTH_CONNECT_URL);
  } catch {
    await Linking.openURL(PLAY_STORE_HEALTH_CONNECT_WEB_URL);
  }
};

export const checkAvailability = async () => {
  if (!isHealthConnectSupported()) {
    return { available: false, reason: 'unsupported_platform' };
  }

  await initialize();
  const status = await getSdkStatus();

  if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
    return { available: true };
  }
  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
    return { available: false, reason: 'provider_update_required' };
  }
  return { available: false, reason: 'unavailable' };
};

export const requestHeartRatePermission = async () => {
  const granted = await requestPermission([
    { accessType: 'read', recordType: 'HeartRate' },
  ]);
  return granted.some((permission) => permission.recordType === 'HeartRate');
};

export const hasHeartRatePermission = async () => {
  const granted = await getGrantedPermissions();
  return granted.some((permission) => permission.recordType === 'HeartRate');
};

export const readHeartRateSince = async (hours = 24) => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  const records = [];
  let pageToken;
  do {
    const page = await readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      ...(pageToken ? { pageToken } : {}),
    });
    records.push(...(page.records ?? []));
    pageToken = page.pageToken;
  } while (pageToken);

  return records;
};

export const mapToHealthIngestSamples = (heartRateRecords) => {
  const porMinuto = new Map();

  for (const record of heartRateRecords) {
    for (const sample of record.samples ?? []) {
      const hr = sample.beatsPerMinute;
      const time = new Date(sample.time);
      if (!hr || hr <= 0 || isNaN(time)) continue;

      time.setSeconds(0, 0);
      const minuto = time.toISOString();
      const acc = porMinuto.get(minuto) ?? { soma: 0, n: 0 };
      acc.soma += hr;
      acc.n += 1;
      porMinuto.set(minuto, acc);
    }
  }

  return [...porMinuto.entries()].map(([minuto, { soma, n }]) => {
    const hr = soma / n;
    return { hr, ibi: 60000 / hr, time_s: minuto };
  });
};
