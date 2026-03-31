import { getMockSaude } from './mockSaude';

const USAR_MOCK = false;

import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';

export async function getDadosSaude() {
  if (USAR_MOCK) {
    return getMockSaude();
  }
  
  await requestPermission([
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'Steps' },
  ]);

  const agora = new Date();
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  const intervalo = {
    operator: 'between' as const,
    startTime: ontem.toISOString(),
    endTime: agora.toISOString(),
  };

  const fc = await readRecords('HeartRate', {
    timeRangeFilter: intervalo,
  });

  const passos = await readRecords('Steps', {
    timeRangeFilter: intervalo,
  });

  return {
    frequenciaCardiaca: fc.records.length,
    passos: passos.records.length,
    hrv: null,
    sono: null,
  };
}