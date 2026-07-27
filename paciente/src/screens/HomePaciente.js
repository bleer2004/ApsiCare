import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, Image, Alert, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const HomePaciente = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const [selectedMood, setSelectedMood] = useState(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);
  const [paciente, setPaciente] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);

  const moods = [
    { id: 'feliz', label: 'Feliz', color: '#E3F2FD', iconColor: '#2563EB', icon: 'smile', valence: 8, arousal: 7 },
    { id: 'calmo', label: 'Calmo', color: '#E0F2F1', iconColor: '#0D9488', icon: 'wind', valence: 7, arousal: 3 },
    { id: 'ansioso', label: 'Ansioso', color: '#F3E5F5', iconColor: '#9333EA', icon: 'zap', valence: 3, arousal: 8 },
    { id: 'triste', label: 'Triste', color: '#FCE4EC', iconColor: '#DB2777', icon: 'frown', valence: 2, arousal: 2 },
    { id: 'neutro', label: 'Neutro', color: '#F1F5F9', iconColor: '#64748B', icon: 'meh', valence: 5, arousal: 5 },
  ];

  const [notificacoes, setNotificacoes] = useState([
    { id: '1', titulo: 'Bem-vindo ao ApsiCare!', mensagem: 'Registre seu humor diariamente para acompanhar seu progresso.', data: 'Hoje', lida: false, icon: 'heart' },
  ]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setPaciente(user);
        await carregarMoods(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const carregarMoods = async (patientId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${patientId}/moods?limit=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setMoodHistory(data.moods || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoodPress = async (mood) => {
    setSelectedMood(mood.id);
    setLoadingMood(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);

      const response = await fetch(`${API_URL}/patients/${user.id}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          valenceScore: mood.valence,
          arousalScore: mood.arousal,
          contextTags: [mood.id],
        })
      });

      if (response.ok) {
        Alert.alert('Humor registrado!', `Você está se sentindo ${mood.label} hoje.`);
        await carregarMoods(user.id);
      } else {
        Alert.alert('Erro', 'Não foi possível registrar o humor');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível registrar o humor');
    } finally {
      setLoadingMood(false);
    }
  };

  // Gráfico corrigido - com largura adequada para não cortar
  const chartWidth = screenWidth - 60;
  
  const moodHistorySlice = moodHistory.length >= 2 ? moodHistory.slice(0, 7).reverse() : [];
  const chartData = {
    labels: moodHistorySlice.length >= 2
      ? moodHistorySlice.map((_, i) => {
          const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
          return dias[i] || '';
        })
      : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{
      data: moodHistorySlice.length >= 2
        ? moodHistorySlice.map(m => m.emotionalScore || 50)
        : [42, 74, 53, 95, 68, 47, 21],
      color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
      strokeWidth: 2,
    }],
    legend: ['Nível Emocional'],
  };

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;
  const primeiroNome = paciente?.name?.split(' ')[0] || 'você';

  const renderNotificacaoItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificacaoItem, !item.lida && styles.notificacaoItemNaoLida]}
      onPress={() => setNotificacoes(notificacoes.map(n => n.id === item.id ? { ...n, lida: true } : n))}
    >
      <View style={styles.notificacaoIcon}>
        <Icon name={item.icon} size={20} color={!item.lida ? '#B367D4' : '#94A3B8'} />
      </View>
      <View style={styles.notificacaoContent}>
        <Text style={[styles.notificacaoTitulo, !item.lida && styles.notificacaoTituloNaoLida]}>{item.titulo}</Text>
        <Text style={styles.notificacaoMensagem}>{item.mensagem}</Text>
        <Text style={styles.notificacaoData}>{item.data}</Text>
      </View>
      {!item.lida && <View style={styles.notificacaoDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <View style={styles.avatar}>
                <Icon name="user" size={20} color="#B367D4" />
              </View>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Olá, espero que esteja bem,</Text>
            <Text style={styles.userName}>{primeiroNome}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => setNotificationsVisible(true)}>
            <Icon name="bell" size={20} color="#475569" />
            {notificacoesNaoLidas > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificacoesNaoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>Como está se sentindo hoje?</Text>
          <View style={styles.moodContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodItem, selectedMood === mood.id && styles.moodItemSelected]}
                onPress={() => handleMoodPress(mood)}
                disabled={loadingMood}
              >
                <View style={[styles.moodIconWrapper, { backgroundColor: mood.color }]}>
                  <Icon name={mood.icon} size={24} color={mood.iconColor} />
                </View>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.emergencyButton} onPress={() => Alert.alert('Emergência', 'Em caso de emergência ligue 192 (SAMU) ou 188 (CVV)')}>
          <Text style={styles.emergencyButtonText}>Ligar para emergência</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.notesCard} onPress={() => navigation.navigate('DiarioPaciente')}>
          <View style={styles.notesIconWrapper}>
            <Icon name="edit-2" size={18} color="#B367D4" />
          </View>
          <View style={styles.notesTextContainer}>
            <Text style={styles.notesTitle}>Anotações diárias</Text>
            <Text style={styles.notesSubtitle}>Escreva suas anotações diárias</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#CBD5E1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.goalsCard} onPress={() => navigation.navigate('MetasPaciente')}>
          <View style={styles.goalsHeader}>
            <Text style={styles.goalsTitle}>Minhas metas</Text>
            <Icon name="target" size={20} color="#B367D4" />
          </View>
          <Text style={styles.goalsSubtitle}>Veja as metas definidas pelo seu psicólogo</Text>
        </TouchableOpacity>

        {/* GRÁFICO CORRIGIDO */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Histórico emocional</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={200}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#B367D4' },
                propsForBackgroundLines: { strokeDasharray: '', stroke: '#E2E8F0' },
              }}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `${value}%`}
              fromZero
            />
            <View style={styles.chartLegend}>
              <View style={styles.chartLegendDot} />
              <Text style={styles.chartLegendText}>Nível de bem-estar emocional</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={notificationsVisible} onRequestClose={() => setNotificationsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notificações</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={notificacoes}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificacaoItem}
              contentContainerStyle={styles.notificacoesList}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="home" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F6F6F8',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(43, 108, 238, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 12,
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moodSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  moodItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: 2,
  },
  moodItemSelected: {
    opacity: 0.7,
  },
  moodIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  emergencyButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#E2E8F0',
    lineHeight: 24,
    textAlign: 'center',
  },
  // NOVOS ESTILOS PARA O CARD DE SONHOS
  dreamsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dreamsIconWrapper: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dreamsTextContainer: {
    flex: 1,
  },
  dreamsTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  dreamsSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginTop: 4,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  notesIconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(43, 108, 238, 0.10)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notesTextContainer: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  notesSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  goalsSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
    alignItems: 'center',
  },
  chart: {
    marginLeft: -30,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B367D4',
    marginRight: 8,
  },
  chartLegendText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {},
  navText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  navTextActive: {
    color: '#B367D4',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#1F2937',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#EF4444',
  },
  notificacoesList: {
    padding: 16,
  },
  notificacaoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notificacaoItemNaoLida: {
    backgroundColor: '#FAFAFF',
    borderLeftWidth: 3,
    borderLeftColor: '#B367D4',
  },
  notificacaoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificacaoContent: {
    flex: 1,
  },
  notificacaoTitulo: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notificacaoTituloNaoLida: {
    color: '#1F2937',
  },
  notificacaoMensagem: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  notificacaoData: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#D1D5DB',
  },
  notificacaoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B367D4',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyNotificationsTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyNotificationsText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default HomePaciente;