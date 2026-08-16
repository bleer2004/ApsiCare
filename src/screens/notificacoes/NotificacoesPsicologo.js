import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';

const calcularIdade = (birthDate) => {
  if (!birthDate) return null;
  const hoje = new Date();
  const nasc = new Date(birthDate);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
};

const tempoAtras = (isoDate) => {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
};

const ICONS = {
  risk_alert: { name: 'alert-triangle', bg: '#DC2626' },
  share_alert: { name: 'share-2', bg: '#B367D4' },
};

const NotificacoesPsicologo = ({ navigation }) => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = await AsyncStorage.getItem('token');

      const [notifResp, pacientesResp] = await Promise.all([
        fetch(`${API_URL}/clinicians/${user.id}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/clinicians/${user.id}/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const notifData = await notifResp.json();
      if (notifResp.ok) setNotificacoes(notifData.notifications || []);

      const pacientesData = await pacientesResp.json();
      if (pacientesResp.ok) {
        setPacientes((pacientesData.patients || []).map(p => ({
          id: p.id || p.patientId,
          nome: p.name,
          email: p.email,
          telefone: p.phone || p.telefone || p.phoneNumber,
          birthDate: p.birthDate,
          idade: p.birthDate ? calcularIdade(p.birthDate) : null,
          diagnosticoPrincipal: p.diagnostico || 'Aguardando diagnóstico',
          condicao: 'Em acompanhamento',
          statusEmocional: 'Estável',
          melhoraPercentual: 0,
          isActive: p.isActive,
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const marcarComoLida = async (notif) => {
    if (notif.isRead) return;
    setNotificacoes(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/clinicians/${user.id}/notifications/${encodeURIComponent(notif.id)}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const handlePress = (notif) => {
    marcarComoLida(notif);
    if (notif.patientId) {
      const paciente = pacientes.find(p => p.id === notif.patientId);
      if (paciente) {
        const params = { paciente };
        if (notif.category === 'share_alert' && notif.relatedId) {
          params.abaInicial = 'arquivos';
          params.abrirAnotacaoId = notif.relatedId;
        }
        navigation.navigate('DashboardPaciente', params);
      }
    }
  };

  const renderItem = ({ item }) => {
    const icon = ICONS[item.category] || { name: 'bell', bg: '#94A3B8' };
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardNaoLida]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBg, { backgroundColor: icon.bg }]}>
          <Icon name={icon.name} size={18} color="#fff" />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitulo}>{item.title}</Text>
            {!item.isRead && <View style={styles.dotNaoLida} />}
          </View>
          <Text style={styles.cardTexto}>{item.body}</Text>
          <Text style={styles.cardTempo}>{tempoAtras(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      <View style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#B367D4" />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Icon name="bell" size={20} color="#B367D4" />
            <Text style={styles.headerTitle}>Notificações</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centro}><ActivityIndicator size="large" color="#B367D4" /></View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} colors={['#B367D4']} />
          }
          ListEmptyComponent={
            <View style={styles.centro}>
              <Icon name="bell-off" size={32} color="#CBD5E1" />
              <Text style={styles.vazioTexto}>Nenhuma notificação por enquanto</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  headerBlur: { backgroundColor: 'rgba(246, 246, 248, 0.80)', borderBottomWidth: 1, borderBottomColor: 'rgba(43, 108, 238, 0.10)' },
  headerContent: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#0F172A', fontSize: 20, fontFamily: 'Manrope', fontWeight: '700' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  vazioTexto: { color: '#94A3B8', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#EEF2F6' },
  cardNaoLida: { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' },
  iconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitulo: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '700' },
  dotNaoLida: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B367D4' },
  cardTexto: { color: '#475569', fontSize: 13, fontFamily: 'Manrope', fontWeight: '500' },
  cardTempo: { color: '#94A3B8', fontSize: 11, fontFamily: 'Manrope', fontWeight: '500', marginTop: 2 },
});

export default NotificacoesPsicologo;
