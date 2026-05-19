import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';

const USAR_MOCK = true; 

const VisaoGeral = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [searchText, setSearchText] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicianId, setClinicianId] = useState(null);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    console.log('=== carregarDados chamado ===');
    console.log('USAR_MOCK:', USAR_MOCK);
    
    if (USAR_MOCK) {
      console.log('Usando mock, saindo...');
      setLoading(false);
      return;
    }

    console.log('Buscando dados reais...');
    
    try {
      const userStr = await AsyncStorage.getItem('user');
      console.log('userStr:', userStr);
      const user = JSON.parse(userStr);
      console.log('user:', user);
      setClinicianId(user.id);

      const token = await AsyncStorage.getItem('token');
      console.log('token:', token);

      const url = `${API_URL}/clinicians/${user.id}/patients`;
      console.log('URL:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('response status:', response.status);
      const data = await response.json();
      console.log('data:', JSON.stringify(data));
      
      if (response.ok) {
        setPacientes(data.patients || []);
        console.log('pacientes setados:', data.patients?.length);
      }
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // dados mock graph
  const chartData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Hoje', 'Sem 6', 'Sem 7'],
    datasets: [
      {
        data: [78, 75, 72, 70, 68, 72, 78],
        color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Humor (%)'],
  };

  // mock de usuários
  const pacientesAtencao = [
    {
      id: '1',
      nome: 'Ana Clara Souza',
      tipo: 'CRÍTICO',
      descricao: 'Queda brusca no humor (Score -40%)',
      tempo: 'Emitido há 12 minutos',
      origem: 'Relatado via App Diário',
      cor: '#DC2626',
      corBg: '#FEE2E2',
      icon: 'alert-triangle',
    },
    {
      id: '2',
      nome: 'Marcos Oliveira',
      tipo: 'TENDÊNCIA',
      descricao: 'Isolamento social detectado (3 dias)',
      tempo: 'Emitido há 2 horas',
      origem: 'Inatividade em grupos',
      cor: '#D97706',
      corBg: '#FEF3C7',
      icon: 'trending-up',
    },
    {
      id: '3',
      nome: 'Julia Mendes',
      tipo: 'CRÍTICO',
      descricao: 'Ideação recorrente em mensagens',
      tempo: 'Emitido há 45 minutos',
      origem: 'Gatilho linguístico IA',
      cor: '#DC2626',
      corBg: '#FEE2E2',
      icon: 'alert-triangle',
    },
  ];

  const tendenciaPiora = useMemo(() => {
    return USAR_MOCK
      ? ['Mariana L.', 'Pedro H.', 'Julia S.']
      : pacientes.slice(0, 3).map(p => p.name.split(' ')[0]);
  }, [pacientes]);

  const handleVerProntuario = (paciente) => {
    console.log('Ver prontuário:', paciente.nome);
  };

  const handleContatar = (paciente) => {
    console.log('Contatar:', paciente.nome);
  };

  const handleLigar = (paciente) => {
    console.log('Ligar para:', paciente.nome);
  };

  const renderPacienteCard = ({ item }) => (
    <View style={[styles.alertCard, item.tipo === 'CRÍTICO' ? styles.criticalCard : styles.trendCard]}>
      <View style={styles.alertCardHeader}>
        <View style={[styles.avatar, item.tipo === 'CRÍTICO' ? styles.criticalAvatar : styles.trendAvatar]}>
          <View style={styles.avatarImage} />
        </View>
        <View style={styles.alertCardInfo}>
          <View style={styles.alertCardNameRow}>
            <Text style={styles.alertCardName}>{item.nome}</Text>
            <View style={[styles.criticalBadge, { backgroundColor: item.corBg }]}>
              <Text style={[styles.criticalBadgeText, { color: item.cor }]}>{item.tipo}</Text>
            </View>
          </View>
          <View style={styles.alertMessageRow}>
            <View style={[styles.criticalIconSmall, { backgroundColor: item.cor }]} />
            <Text style={[styles.criticalMessageText, { color: item.cor }]}>{item.descricao}</Text>
          </View>
          <Text style={styles.alertMeta}>Emitido há {item.tempo === 'Emitido há 12 minutos' ? '12 minutos' : item.tempo === 'Emitido há 2 horas' ? '2 horas' : '45 minutos'} • {item.origem}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleVerProntuario(item)}>
              <Text style={styles.primaryButtonText}>Ver Prontuário</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => item.tipo === 'CRÍTICO' ? handleContatar(item) : handleLigar(item)}>
              <View style={styles.secondaryIcon} />
              <Text style={styles.secondaryButtonText}>{item.tipo === 'CRÍTICO' ? 'Contatar' : 'Ligar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={[styles.statusBar, item.tipo === 'CRÍTICO' ? styles.criticalStatusBar : styles.trendStatusBar]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />

      {/* Header com blur */}
      <View style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <View style={styles.headerIconPlaceholder} />
            </View>
            <Text style={styles.headerTitle}>Visão geral</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
            <Text style={styles.filterChipTextActive}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChipOutline}>
            <View style={styles.criticalDot} />
            <Text style={styles.filterChipOutlineText}>Críticos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChipOutline}>
            <View style={styles.trendDot} />
            <Text style={styles.filterChipOutlineText}>Tendência</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico de Humor */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Humor Geral dos Pacientes</Text>
          <View style={styles.chartPeriodContainer}>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'dia' && styles.periodButtonActive]} 
              onPress={() => setSelectedPeriod('dia')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'dia' && styles.periodButtonTextActive]}>Dia</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'semana' && styles.periodButtonActive]} 
              onPress={() => setSelectedPeriod('semana')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'semana' && styles.periodButtonTextActive]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'mes' && styles.periodButtonActive]} 
              onPress={() => setSelectedPeriod('mes')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'mes' && styles.periodButtonTextActive]}>Mês</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, selectedPeriod === 'ano' && styles.periodButtonActive]} 
              onPress={() => setSelectedPeriod('ano')}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === 'ano' && styles.periodButtonTextActive]}>Ano</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartBarsContainer}>
            <View style={[styles.chartBar, { height: 115 }]} />
            <View style={[styles.chartBar, { height: 144 }]} />
            <View style={[styles.chartBar, { height: 77 }]} />
            <View style={[styles.chartBar, { height: 106 }]} />
            <View style={[styles.chartBarGreen, { height: 173 }]}>
              <View style={styles.chartTooltip}>
                <Text style={styles.chartTooltipText}>78%</Text>
              </View>
            </View>
            <View style={[styles.chartBar, { height: 125 }]} />
            <View style={[styles.chartBar, { height: 134 }]} />
          </View>
          
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Sem 1</Text>
            <Text style={styles.chartLabel}>Sem 2</Text>
            <Text style={styles.chartLabel}>Sem 3</Text>
            <Text style={styles.chartLabel}>Sem 4</Text>
            <Text style={[styles.chartLabel, styles.chartLabelActive]}>Hoje</Text>
            <Text style={styles.chartLabel}>Sem 6</Text>
            <Text style={styles.chartLabel}>Sem 7</Text>
          </View>
        </View>

        {/* Atenção Imediata */}
        <Text style={styles.sectionTitle}>Atenção Imediata</Text>

        {/* Cards de pacientes */}
        <View style={styles.cardsContainer}>
          <FlatList
            data={pacientesAtencao}
            keyExtractor={(item) => item.id}
            renderItem={renderPacienteCard}
            scrollEnabled={false}
          />
        </View>

        {/* Urgências */}
        <View style={styles.urgencySection}>
          <View style={styles.urgencyHeader}>
            <Text style={styles.sectionTitle}>Urgências</Text>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>3 Alertas</Text>
            </View>
          </View>
          <View style={styles.urgencyCard}>
            <View style={styles.urgencyIconContainer}>
              <View style={styles.urgencyIcon} />
            </View>
            <View style={styles.urgencyInfo}>
              <Text style={styles.urgencyTitle}>Tendência de Piora Detectada</Text>
              <Text style={styles.urgencyDescription}>
                Pacientes: {tendenciaPiora.join(', ')} apresentaram quedas bruscas no humor semanal.
              </Text>
              <TouchableOpacity style={styles.urgencyLink}>
                <Text style={styles.urgencyLinkText}>Ver Relatórios Completos</Text>
                <View style={styles.urgencyLinkIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Configurações */}
        <TouchableOpacity style={styles.settingsCard} onPress={() => navigation.navigate('Configuracoes')}>
          <View style={styles.settingsIconContainer}>
            <View style={styles.settingsIcon} />
          </View>
          <Text style={styles.settingsTitle}>Configurações</Text>
          <Text style={styles.settingsSubtitle}>Ajustes da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('VisaoGeral')}
        >
          <View style={styles.navIconInicio} />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate('Pacientes')}
        >
          <View style={styles.navIconPacientes} />
          <Text style={[styles.navText, styles.navTextActive]}>Pacientes</Text>
          <View style={styles.navBadge} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Relatorios')}
        >
          <View style={styles.navIconRelatorios} />
          <Text style={styles.navText}>Relatórios</Text>
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
  // Header com blur
  headerBlur: {
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43, 108, 238, 0.10)',
  },
  headerContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 16,
    height: 16,
  },
  headerIconPlaceholder: {
    width: 16,
    height: 16,
    backgroundColor: '#B367D4',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 25,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  // Filtros
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterChip: {
    height: 40,
    paddingHorizontal: 20,
    backgroundColor: '#B367D4',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#B367D4',
  },
  filterChipTextActive: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
  },
  filterChipOutline: {
    height: 40,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criticalDot: {
    width: 16.67,
    height: 16.67,
    backgroundColor: '#EF4444',
  },
  trendDot: {
    width: 16.67,
    height: 10,
    backgroundColor: '#F59E0B',
  },
  filterChipOutlineText: {
    color: '#475569',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
  },
  // Gráfico
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 16,
  },
  chartPeriodContainer: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 16,
  },
  periodButtonTextActive: {
    color: 'rgba(179, 103, 212, 0.84)',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    height: 192,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  chartBar: {
    flex: 1,
    backgroundColor: 'rgba(179, 103, 212, 0.20)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartBarGreen: {
    flex: 1,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    position: 'relative',
  },
  chartTooltip: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    alignItems: 'center',
  },
  chartTooltipText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 15,
  },
  chartLabels: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  chartLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 15,
  },
  chartLabelActive: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontWeight: '700',
  },
  // Seção
  sectionTitle: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 20,
    letterSpacing: 0.70,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  alertCard: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  criticalCard: {
    borderColor: '#FECACA',
  },
  trendCard: {
    borderColor: '#FDE68A',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
  },
  criticalAvatar: {
    borderColor: '#FEE2E2',
  },
  trendAvatar: {
    borderColor: '#FEF3C7',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  alertCardInfo: {
    flex: 1,
  },
  alertCardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertCardName: {
    color: '#0F172A',
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
  },
  criticalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  alertMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  criticalIconSmall: {
    width: 12.83,
    height: 11.08,
  },
  criticalMessageText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  alertMeta: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#B367D4',
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 16,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(43, 108, 238, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryIcon: {
    width: 11.67,
    height: 11.67,
    backgroundColor: '#B367D4',
  },
  secondaryButtonText: {
    color: '#B367D4',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 16,
  },
  statusBar: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 4,
    height: '100%',
  },
  criticalStatusBar: {
    backgroundColor: '#EF4444',
  },
  trendStatusBar: {
    backgroundColor: '#F59E0B',
  },
  // Urgências
  urgencySection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  urgencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 9999,
  },
  alertBadgeText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 16,
  },
  urgencyCard: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    gap: 16,
  },
  urgencyIconContainer: {
    padding: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  urgencyIcon: {
    width: 22,
    height: 19,
    backgroundColor: 'white',
  },
  urgencyInfo: {
    flex: 1,
  },
  urgencyTitle: {
    color: '#7F1D1D',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  urgencyDescription: {
    color: '#B91C1C',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 8,
  },
  urgencyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyLinkText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 16,
  },
  urgencyLinkIcon: {
    width: 9.33,
    height: 9.33,
    backgroundColor: '#DC2626',
  },
  // Configurações
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  settingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsIcon: {
    width: 25.13,
    height: 25,
    backgroundColor: '#475569',
  },
  settingsTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  settingsSubtitle: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  // Bottom Navigation
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#F6F6F8',
    borderTopWidth: 1,
    borderTopColor: 'rgba(43, 108, 238, 0.10)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  navItemActive: {
    // active style
  },
  navIconInicio: {
    width: 17.33,
    height: 19.5,
    backgroundColor: '#94A3B8',
  },
  navIconPacientes: {
    width: 23.83,
    height: 17.33,
    backgroundColor: '#B367D4',
  },
  navIconRelatorios: {
    width: 17.33,
    height: 17.33,
    backgroundColor: '#94A3B8',
  },
  navText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
    letterSpacing: 1,
  },
  navTextActive: {
    color: '#B367D4',
  },
  navBadge: {
    position: 'absolute',
    top: 8,
    right: 85,
    width: 15,
    height: 14,
    backgroundColor: '#EF4444',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#F6F6F8',
  },
});

export default VisaoGeral;