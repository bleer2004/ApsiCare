import { initialize, requestPermission, readRecords, getGrantedPermissions } from 'react-native-health-connect';

// Lista completa de permissões necessárias
const PERMISSOES = [
  { accessType: 'read' as const, recordType: 'HeartRate' as const },
  { accessType: 'read' as const, recordType: 'RestingHeartRate' as const },
  { accessType: 'read' as const, recordType: 'HeartRateVariabilityRmssd' as const },
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'SleepSession' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'Distance' as const },
  { accessType: 'read' as const, recordType: 'OxygenSaturation' as const },
  { accessType: 'read' as const, recordType: 'BloodPressure' as const },
  { accessType: 'read' as const, recordType: 'BodyTemperature' as const },
  { accessType: 'read' as const, recordType: 'Weight' as const },
  { accessType: 'read' as const, recordType: 'Height' as const },
];

export async function solicitarPermissoes() {
  try {
    console.log("1. Inicializando...");
    const isInitialized = await initialize();

    if (!isInitialized) {
      throw new Error("Health Connect não disponível");
    }

    console.log("2. Abrindo tela de permissões para todos os tipos...");
    // Solicitando a lista completa de uma vez
    const result = await requestPermission(PERMISSOES);

    console.log("3. Resultado da solicitação:", result);
    return result;

  } catch (err: any) {
    console.error("ERRO requestPermission:", err);
    throw err;
  }
}

export async function getDadosSaude() {
  try {
    const isInitialized = await initialize();
    if (!isInitialized) throw new Error("Health Connect não disponível");

    const agora = new Date();
    const semanaPassada = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

    const intervalo7d = {
      operator: 'between' as const,
      startTime: semanaPassada.toISOString(),
      endTime: agora.toISOString(),
    };

    // Realiza todas as leituras
    const [
      fc, fcRepouso, hrv, passos, sono,
      calorias, distancia, oxigenio,
      pressao, temperatura, peso, altura
    ] = await Promise.all([
      readRecords('HeartRate',                 { timeRangeFilter: intervalo7d }),
      readRecords('RestingHeartRate',          { timeRangeFilter: intervalo7d }),
      readRecords('HeartRateVariabilityRmssd', { timeRangeFilter: intervalo7d }),
      readRecords('Steps',                     { timeRangeFilter: intervalo7d }),
      readRecords('SleepSession',              { timeRangeFilter: intervalo7d }),
      readRecords('ActiveCaloriesBurned',      { timeRangeFilter: intervalo7d }),
      readRecords('Distance',                  { timeRangeFilter: intervalo7d }),
      readRecords('OxygenSaturation',          { timeRangeFilter: intervalo7d }),
      readRecords('BloodPressure',             { timeRangeFilter: intervalo7d }),
      readRecords('BodyTemperature',           { timeRangeFilter: intervalo7d }),
      readRecords('Weight',                    { timeRangeFilter: intervalo7d }),
      readRecords('Height',                    { timeRangeFilter: intervalo7d }),
    ]);

    // Processamento de Sono
    const horasSono = sono.records.length > 0
      ? sono.records.reduce((acc, r) =>
          acc + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60), 0)
      : null;

    let faseSono = null;
    if (sono.records.length > 0) {
      const ultimaSessao: any = sono.records.at(-1);
      if (ultimaSessao?.stages?.length > 0) {
        const calcHoras = (stageId: number) =>
          ultimaSessao.stages
            .filter((s: any) => s.stage === stageId)
            .reduce((acc: number, s: any) =>
              acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60), 0);

        faseSono = {
          leve:     parseFloat(calcHoras(4).toFixed(1)),
          profundo: parseFloat(calcHoras(5).toFixed(1)),
          rem:      parseFloat(calcHoras(6).toFixed(1)),
        };
      }
    }

    const totalPassos    = passos.records.reduce((acc, r) => acc + (r.count ?? 0), 0);
    const totalDistancia = distancia.records.reduce((acc, r: any) => acc + (r.distance?.inMeters ?? 0), 0);
    const totalCalorias  = calorias.records.reduce((acc, r: any) => acc + (r.energy?.inKilocalories ?? 0), 0);

    return {
      frequenciaCardiaca: fc.records.at(-1)?.samples?.at(-1)?.beatsPerMinute ?? null,
      fcRepouso:          fcRepouso.records.at(-1)?.beatsPerMinute ?? null,
      hrv:                (hrv.records.at(-1) as any)?.heartRateVariabilityMillis ?? null,
      pressaoSistolica:   (pressao.records.at(-1) as any)?.systolic?.inMillimetersOfMercury ?? null,
      pressaoDiastolica:  (pressao.records.at(-1) as any)?.diastolic?.inMillimetersOfMercury ?? null,
      oxigenio:           (oxigenio.records.at(-1) as any)?.percentage ?? null,
      temperatura:        (temperatura.records.at(-1) as any)?.temperature?.inCelsius ?? null,
      passos:             totalPassos > 0 ? totalPassos : null,
      distancia:          totalDistancia > 0 ? parseFloat((totalDistancia / 1000).toFixed(2)) : null,
      caloriasAtivas:     totalCalorias > 0 ? Math.round(totalCalorias) : null,
      sono:               horasSono ? parseFloat(horasSono.toFixed(1)) : null,
      faseSono,
      peso:               (peso.records.at(-1) as any)?.weight?.inKilograms ?? null,
      altura:             (altura.records.at(-1) as any)?.height?.inMeters ?? null,
    };

  } catch (err: any) {
    console.error('Erro Health Connect:', err);
    throw new Error(err?.message || "Erro ao acessar dados de saúde");
  }
}