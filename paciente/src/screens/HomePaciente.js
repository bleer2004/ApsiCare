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
import { useAccessibilityStyles } from '../hooks/useAccessibilityStyles';

const HomePaciente = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const [selectedMood, setSelectedMood] = useState(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);
  const [paciente, setPaciente] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);

  // Hooks de acessibilidade
  const {
    baixaVisao,
    daltonismo,
    getColors,
    getTextStyle,
    getButtonStyle,
    getCardStyle,
    getIconProps,
    getSpacing,
    adaptarCor,
  } = useAccessibilityStyles();

  const colors = getColors();

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
      style={[
        styles.notificacaoItem, 
        !item.lida && styles.notificacaoItemNaoLida,
        { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderLeftColor: !item.lida ? colors.primary : colors.border,
        }
      ]}
      onPress={() => setNotificacoes(notificacoes.map(n => n.id === item.id ? { ...n, lida: true } : n))}
    >
      <View style={[styles.notificacaoIcon, { backgroundColor: colors.border }]}>
        <Icon name={item.icon} {...getIconProps(item.icon, 'medium', !item.lida ? colors.primary : colors.textMuted)} />
      </View>
      <View style={styles.notificacaoContent}>
        <Text style={[
          styles.notificacaoTitulo, 
          !item.lida && styles.notificacaoTituloNaoLida,
          getTextStyle('medium', !item.lida ? colors.text : colors.textSecondary, !item.lida ? '600' : '400')
        ]}>{item.titulo}</Text>
        <Text style={[styles.notificacaoMensagem, getTextStyle('small', colors.textMuted)]}>{item.mensagem}</Text>
        <Text style={[styles.notificacaoData, getTextStyle('small', colors.textMuted)]}>{item.data}</Text>
      </View>
      {!item.lida && <View style={[styles.notificacaoDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={baixaVisao ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarBorder, { borderColor: baixaVisao ? colors.border : 'rgba(43, 108, 238, 0.20)' }]}>
              <View style={[styles.avatar, { backgroundColor: baixaVisao ? colors.cardBackground : '#E2E8F0' }]}>
                <Icon name="user" {...getIconProps('user', 'medium', colors.primary)} />
              </View>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, getTextStyle('small', colors.textSecondary)]}>Olá, espero que esteja bem,</Text>
            <Text style={[styles.userName, getTextStyle('large', colors.text, '700')]}>{primeiroNome}</Text>
          </View>
          <TouchableOpacity style={[
            styles.notificationButton, 
            { 
              backgroundColor: colors.cardBackground,
              borderColor: baixaVisao ? colors.border : '#F2EEF6',
            }
          ]} onPress={() => setNotificationsVisible(true)}>
            <Icon name="bell" {...getIconProps('bell', 'medium', colors.text)} />
            {notificacoesNaoLidas > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]}>
                <Text style={[styles.notificationBadgeText, getTextStyle('small', '#FFFFFF', '700')]}>{notificacoesNaoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Seção de Humor */}
        <View style={[styles.moodSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.sectionTitle, getTextStyle('large', colors.text, '700'), { textAlign: 'center' }]}>
            Como está se sentindo hoje?
          </Text>
          <View style={[
            styles.moodContainer, 
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }
          ]}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodItem, selectedMood === mood.id && styles.moodItemSelected]}
                onPress={() => handleMoodPress(mood)}
                disabled={loadingMood}
              >
                <View style={[
                  styles.moodIconWrapper, 
                  { 
                    backgroundColor: baixaVisao ? colors.cardBackground : mood.color,
                    borderWidth: baixaVisao ? 2 : 0,
                    borderColor: baixaVisao ? colors.border : 'transparent',
                    width: baixaVisao ? 72 : 56,
                    height: baixaVisao ? 72 : 56,
                    borderRadius: baixaVisao ? 20 : 16,
                  }
                ]}>
                  <Icon 
                    name={mood.icon} 
                    size={baixaVisao ? 32 : 24} 
                    color={baixaVisao ? colors.text : adaptarCor(mood.iconColor)} 
                  />
                </View>
                <Text style={[
                  styles.moodLabel, 
                  getTextStyle('small', baixaVisao ? colors.text : '#475569', '500')
                ]}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Emergência */}
        <TouchableOpacity 
          style={[
            styles.emergencyButton, 
            { 
              backgroundColor: adaptarCor('#EF4444'),
              borderColor: adaptarCor('#DC2626'),
              marginHorizontal: getSpacing('medium'),
              paddingVertical: baixaVisao ? 16 : 12,
            }
          ]} 
          onPress={() => Alert.alert('Emergência', 'Em caso de emergência ligue 192 (SAMU) ou 188 (CVV)')}
        >
          <Text style={[
            styles.emergencyButtonText, 
            getTextStyle('large', '#E2E8F0', '700'),
            { textAlign: 'center' }
          ]}>
            Ligar para emergência
          </Text>
        </TouchableOpacity>

        {/* Card Anotações */}
        <TouchableOpacity 
          style={[
            styles.notesCard, 
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              marginHorizontal: getSpacing('medium'),
              padding: baixaVisao ? 24 : 20,
            }
          ]} 
          onPress={() => navigation.navigate('DiarioPaciente')}
        >
          <View style={[styles.notesIconWrapper, { backgroundColor: baixaVisao ? 'rgba(179,103,212,0.15)' : 'rgba(43, 108, 238, 0.10)' }]}>
            <Icon name="edit-2" {...getIconProps('edit-2', 'medium', colors.primary)} />
          </View>
          <View style={styles.notesTextContainer}>
            <Text style={[styles.notesTitle, getTextStyle('medium', colors.text, '700')]}>Anotações diárias</Text>
            <Text style={[styles.notesSubtitle, getTextStyle('small', colors.textSecondary)]}>Escreva suas anotações diárias</Text>
          </View>
          <Icon name="chevron-right" {...getIconProps('chevron-right', 'small', colors.textMuted)} />
        </TouchableOpacity>

        {/* Card Metas */}
        <TouchableOpacity 
          style={[
            styles.goalsCard, 
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              marginHorizontal: getSpacing('medium'),
              padding: baixaVisao ? 24 : 20,
            }
          ]} 
          onPress={() => navigation.navigate('MetasPaciente')}
        >
          <View style={styles.goalsHeader}>
            <Text style={[styles.goalsTitle, getTextStyle('medium', colors.text, '700')]}>Minhas metas</Text>
            <Icon name="target" {...getIconProps('target', 'medium', colors.primary)} />
          </View>
          <Text style={[styles.goalsSubtitle, getTextStyle('small', colors.textSecondary)]}>Veja as metas definidas pelo seu psicólogo</Text>
        </TouchableOpacity>

        {/* Gráfico */}
        <View style={[styles.chartSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.sectionTitle, getTextStyle('large', colors.text, '700'), { textAlign: 'center' }]}>
            Histórico emocional
          </Text>
          <View style={[
            styles.chartContainer, 
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              padding: baixaVisao ? 24 : 20,
            }
          ]}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={baixaVisao ? 240 : 200}
              chartConfig={{
                backgroundColor: colors.cardBackground,
                backgroundGradientFrom: colors.cardBackground,
                backgroundGradientTo: colors.cardBackground,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
                labelColor: (opacity = 1) => baixaVisao ? `rgba(255, 255, 255, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: baixaVisao ? '7' : '5', strokeWidth: baixaVisao ? '3' : '2', stroke: colors.primary },
                propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border },
              }}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `${value}%`}
              fromZero
            />
            <View style={styles.chartLegend}>
              <View style={[styles.chartLegendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.chartLegendText, getTextStyle('small', colors.textSecondary)]}>Nível de bem-estar emocional</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Notificações */}
      <Modal animationType="slide" transparent={true} visible={notificationsVisible} onRequestClose={() => setNotificationsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.cardBackground,
              borderTopLeftRadius: baixaVisao ? 28 : 24,
              borderTopRightRadius: baixaVisao ? 28 : 24,
            }
          ]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, getTextStyle('large', colors.text, '600')]}>Notificações</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Icon name="x" {...getIconProps('x', 'medium', colors.textMuted)} />
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

      {/* Bottom Navigation */}
      <View style={[
        styles.bottomNavigation, 
        { 
          backgroundColor: baixaVisao ? colors.cardBackground : 'rgba(255, 255, 255, 0.80)',
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="home" {...getIconProps('home', 'medium', colors.primary)} />
          <Text style={[styles.navText, styles.navTextActive, getTextStyle('small', colors.primary, '700')]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" {...getIconProps('book-open', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" {...getIconProps('target', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" {...getIconProps('user', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 12,
  },
  greeting: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
  },
  userName: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 22.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
  moodSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodLabel: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 16,
  },
  emergencyButton: {
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emergencyButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
  },
  notesIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notesTextContainer: {
    flex: 1,
  },
  notesTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  notesSubtitle: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 4,
  },
  goalsCard: {
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  goalsSubtitle: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartContainer: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
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
    marginRight: 8,
  },
  chartLegendText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  bottomNavigation: {
    flexDirection: 'row',
    borderTopWidth: 1,
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
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  navTextActive: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  notificacoesList: {
    padding: 16,
  },
  notificacaoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  notificacaoItemNaoLida: {
    borderLeftWidth: 3,
  },
  notificacaoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificacaoContent: {
    flex: 1,
  },
  notificacaoTitulo: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    marginBottom: 4,
  },
  notificacaoTituloNaoLida: {
    fontWeight: '600',
  },
  notificacaoMensagem: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    marginBottom: 4,
  },
  notificacaoData: {
    fontFamily: 'Manrope',
    fontWeight: '400',
  },
  notificacaoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
});

export default HomePaciente;