import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import {
  checkAvailability,
  openHealthConnectInPlayStore,
  requestHeartRatePermission,
  hasHeartRatePermission,
  readHeartRateSince,
  mapToHealthIngestSamples,
} from '../../services/healthConnect';

const SYNC_WINDOW_HOURS = 24;

const stressLabelFromScore = (stressPhysio) => {
  const score = Number(stressPhysio);
  if (Number.isNaN(score)) return '--';
  if (score >= 0.6) return 'Alto';
  if (score >= 0.3) return 'Médio';
  return 'Baixo';
};

const SmartwatchPaciente = ({ paciente, standalone = false }) => {
  const [conectado, setConectado] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dadosSmartwatch, setDadosSmartwatch] = useState({
    batimentos: '--',
    nivelStress: '--',
    ultimaSincronizacao: null,
  });

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        const { available } = await checkAvailability();
        if (!available) return;
        const jaConectado = await hasHeartRatePermission();
        if (jaConectado) {
          setConectado(true);
          await sincronizar(true);
        }
      } catch (err) {
        console.error('Erro ao verificar permissão Health Connect:', err);
      }
    })();
  }, [paciente?.id]);

  const sincronizar = async (silencioso = false) => {
    if (!paciente?.id) {
      if (!silencioso) Alert.alert('Erro', 'Paciente não identificado.');
      return;
    }

    setRefreshing(true);
    try {
      const records = await readHeartRateSince(SYNC_WINDOW_HOURS);
      const samples = mapToHealthIngestSamples(records);

      if (samples.length === 0) {
        if (!silencioso) {
          Alert.alert(
            'Nenhuma medição encontrada',
            'Para sincronizar, primeiro meça sua frequência cardíaca no relógio (abra o app de batimentos nele, ou aguarde uma medição automática). Depois volte aqui e toque em "Sincronizar Agora" de novo.'
          );
        }
        return;
      }

      const token = await AsyncStorage.getItem('token');

      const healthRes = await fetch(`${API_URL}/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: paciente.id, samples }),
      });
      if (!healthRes.ok) throw new Error(`health-ingest retornou ${healthRes.status}`);

      await fetch(`${API_URL}/patients/${paciente.id}/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });

      const insightsResponse = await fetch(`${API_URL}/patients/${paciente.id}/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const insightsData = await insightsResponse.json();
      const ultimoInsight = insightsData?.insights?.find((i) => !i.dias);

      const ultimaAmostra = samples.reduce((mais_recente, s) =>
        new Date(s.time_s) > new Date(mais_recente.time_s) ? s : mais_recente
      );

      setDadosSmartwatch({
        batimentos: String(Math.round(ultimaAmostra.hr)),
        nivelStress: stressLabelFromScore(ultimoInsight?.stress_physio),
        ultimaSincronizacao: new Date().toLocaleString(),
      });

      if (!silencioso) Alert.alert('Sincronizado!', 'Dados do smartwatch atualizados com sucesso.');
    } catch (err) {
      console.error('Erro ao sincronizar Health Connect:', err);
      if (!silencioso) Alert.alert('Erro ao sincronizar', 'Não foi possível ler ou enviar os dados do smartwatch.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleConectar = async () => {
    try {
      const { available, reason } = await checkAvailability();

      if (!available) {
        if (reason === 'provider_update_required' || reason === 'unavailable') {
          Alert.alert(
            'Health Connect não disponível',
            'Para conectar seu smartwatch, instale ou atualize o app Health Connect.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir Play Store', onPress: openHealthConnectInPlayStore },
            ]
          );
        } else {
          Alert.alert('Não suportado', 'Esse recurso está disponível apenas em dispositivos Android.');
        }
        return;
      }

      const granted = await requestHeartRatePermission();
      if (!granted) {
        Alert.alert(
          'Permissão negada',
          'Sem a permissão de leitura de batimentos cardíacos não é possível sincronizar os dados do seu smartwatch.'
        );
        return;
      }

      setConectado(true);
      await sincronizar();
    } catch (err) {
      console.error('Erro ao conectar Health Connect:', err);
      Alert.alert('Erro', 'Não foi possível conectar ao Health Connect.');
    }
  };

  const handleDesconectar = () => {
    Alert.alert(
      'Desconectar Smartwatch',
      'Isso só remove a conexão dentro do app. Para revogar a permissão de leitura, use as configurações do Health Connect no seu celular.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: () => {
            setConectado(false);
            setDadosSmartwatch({
              batimentos: '--',
              nivelStress: '--',
              ultimaSincronizacao: null,
            });
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    if (!conectado) {
      Alert.alert('Dispositivo não conectado', 'Conecte seu smartwatch para sincronizar os dados');
      return;
    }
    sincronizar();
  };

  const renderNaoSuportado = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon name="watch" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Recurso não disponível</Text>
      <Text style={styles.emptyText}>
        A sincronização com smartwatch via Health Connect está disponível apenas em dispositivos Android.
      </Text>
    </View>
  );

  const renderDesconectado = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon name="watch" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Nenhum dispositivo conectado</Text>
      <Text style={styles.emptyText}>
        Conecte seu smartwatch para acompanhar seus dados de saúde em tempo real.
      </Text>
      <TouchableOpacity style={styles.conectarButton} onPress={handleConectar}>
        <Icon name="bluetooth" size={20} color="#FFFFFF" />
        <Text style={styles.conectarButtonText}>Conectar Smartwatch</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Icon name="info" size={16} color="#6366F1" />
        <Text style={styles.infoText}>
          Conecte via Health Connect — funciona com qualquer app de smartwatch que sincronize dados de saúde com ele (Galaxy Wearable, Mi Fitness, Wear OS, entre outros).
        </Text>
      </View>
    </View>
  );

  const renderConectado = () => (
    <>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusBadge}>
            <Icon name="bluetooth" size={14} color="#10B981" />
            <Text style={styles.statusBadgeText}>Conectado</Text>
          </View>
          <TouchableOpacity onPress={handleDesconectar}>
            <Text style={styles.desconectarText}>Desconectar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.ultimaSincronizacao}>
          Última sincronização: {dadosSmartwatch.ultimaSincronizacao || '--'}
        </Text>
      </View>

      {dadosSmartwatch.batimentos === '--' && (
        <View style={styles.infoBox}>
          <Icon name="info" size={16} color="#6366F1" />
          <Text style={styles.infoText}>
            Nenhuma medição ainda. Meça sua frequência cardíaca no relógio (abra o app de batimentos nele) e depois toque em "Sincronizar Agora".
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="activity" size={24} color="#EF4444" />
          </View>
          <Text style={styles.statValue}>{dadosSmartwatch.batimentos}</Text>
          <Text style={styles.statLabel}>BPM</Text>
        </View>
      </View>

      <View style={styles.stressCard}>
        <Text style={styles.stressTitle}>Nível de Stress</Text>
        <View style={styles.stressLevel}>
          <Text style={[
            styles.stressValue,
            dadosSmartwatch.nivelStress === 'Baixo' && styles.stressBaixo,
            dadosSmartwatch.nivelStress === 'Médio' && styles.stressMedio,
            dadosSmartwatch.nivelStress === 'Alto' && styles.stressAlto,
          ]}>
            {dadosSmartwatch.nivelStress}
          </Text>
        </View>
        <View style={styles.stressBarContainer}>
          <View style={[styles.stressBar, { width: dadosSmartwatch.nivelStress === 'Baixo' ? '33%' : dadosSmartwatch.nivelStress === 'Médio' ? '66%' : dadosSmartwatch.nivelStress === 'Alto' ? '100%' : '0%' }]} />
        </View>
        <Text style={styles.stressDesc}>
          {dadosSmartwatch.nivelStress === 'Baixo' && 'Você está com níveis saudáveis de stress. Continue com suas práticas de mindfulness!'}
          {dadosSmartwatch.nivelStress === 'Médio' && 'Seu nível de stress está moderado. Considere exercícios de respiração.'}
          {dadosSmartwatch.nivelStress === 'Alto' && 'Seu nível de stress está elevado. Recomendamos contatar seu psicólogo.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.sincronizarButton} onPress={onRefresh} disabled={refreshing}>
        <Icon name="refresh-cw" size={18} color="#6366F1" />
        <Text style={styles.sincronizarText}>{refreshing ? 'Sincronizando...' : 'Sincronizar Agora'}</Text>
      </TouchableOpacity>
    </>
  );

  if (!isAndroid()) {
    return (
      <View style={styles.contentContainer}>
        {renderNaoSuportado()}
      </View>
    );
  }

  const conteudo = !conectado ? renderDesconectado() : renderConectado();

  if (!standalone) {
    return <View style={styles.contentContainer}>{conteudo}</View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {conteudo}
    </ScrollView>
  );
};

const isAndroid = () => Platform.OS === 'android';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  conectarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    marginBottom: 20,
  },
  conectarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4338CA',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  desconectarText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  ultimaSincronizacao: {
    fontSize: 11,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  stressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  stressLevel: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stressValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  stressBaixo: {
    color: '#10B981',
  },
  stressMedio: {
    color: '#F59E0B',
  },
  stressAlto: {
    color: '#EF4444',
  },
  stressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  stressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  stressDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  sincronizarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  sincronizarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
});

export default SmartwatchPaciente;
