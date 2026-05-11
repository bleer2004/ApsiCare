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
  const [selectedPeriod, setSelectedPeriod] = useState('semana');
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
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
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
      cor: '#EF4444',
      icon: 'alert-triangle',
    },
    {
      id: '2',
      nome: 'Marcos Oliveira',
      tipo: 'TENDÊNCIA',
      descricao: 'Isolamento social detectado (3 dias)',
      tempo: 'Emitido há 2 horas',
      origem: 'Inatividade em grupos',
      cor: '#F59E0B',
      icon: 'trending-up',
    },
    {
      id: '3',
      nome: 'Julia Mendes',
      tipo: 'CRÍTICO',
      descricao: 'Ideação recorrente em mensagens',
      tempo: 'Emitido há 45 minutos',
      origem: 'Gatilho linguístico IA',
      cor: '#EF4444',
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
    <View style={styles.pacienteCard}>
      <View style={styles.pacienteHeader}>
        <View style={styles.pacienteInfo}>
          <Text style={styles.pacienteNome}>{item.nome}</Text>
          <View style={[styles.tipoBadge, { backgroundColor: item.cor + '20' }]}>
            <Icon name={item.icon} size={12} color={item.cor} />
            <Text style={[styles.tipoTexto, { color: item.cor }]}>{item.tipo}</Text>
          </View>
        </View>
        <Icon name="more-horizontal" size={20} color="#9CA3AF" />
      </View>

      <Text style={styles.pacienteDescricao}>{item.descricao}</Text>
      
      <View style={styles.pacienteMeta}>
        <Icon name="clock" size={14} color="#9CA3AF" />
        <Text style={styles.metaTexto}>{item.tempo}</Text>
        <Icon name="info" size={14} color="#9CA3AF" style={styles.metaIcon} />
        <Text style={styles.metaTexto}>{item.origem}</Text>
      </View>

      <View style={styles.pacienteActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.prontuarioButton]}
          onPress={() => handleVerProntuario(item)}
        >
          <Icon name="file-text" size={16} color="#6366F1" />
          <Text style={styles.prontuarioButtonText}>Ver Prontuário</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.contatarButton]}
          onPress={() => item.tipo === 'CRÍTICO' ? handleContatar(item) : handleLigar(item)}
        >
          <Icon name={item.tipo === 'CRÍTICO' ? 'message-circle' : 'phone'} size={16} color="#FFFFFF" />
          <Text style={styles.contatarButtonText}>
            {item.tipo === 'CRÍTICO' ? 'Contatar' : 'Ligar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar pacientes..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity style={styles.configButton} onPress={() => navigation.navigate('Configuracoes')}>
            <Icon name="settings" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Visão geral</Text>
          <View style={styles.filters}>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, styles.criticosChip]}>
              <Icon name="alert-circle" size={14} color="#EF4444" />
              <Text style={[styles.filterChipText, styles.criticosText]}>Críticos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Icon name="trending-up" size={14} color="#F59E0B" />
              <Text style={styles.filterChipText}>Tendência</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Humor Geral dos Pacientes</Text>
            <View style={styles.periodButtons}>
              {['Dia', 'Semana', 'Mês', 'Ano'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.toLowerCase() && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.toLowerCase())}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period.toLowerCase() && styles.periodButtonTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <LineChart
            data={chartData}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#6366F1',
              },
            }}
            bezier
            style={styles.chart}
            formatYLabel={(value) => `${value}%`}
          />
        </View>

        <View style={styles.atencaoContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ATENÇÃO IMEDIATA</Text>
            <TouchableOpacity>
              <Text style={styles.verTodosText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={pacientesAtencao}
            keyExtractor={(item) => item.id}
            renderItem={renderPacienteCard}
            scrollEnabled={false}
            contentContainerStyle={styles.pacientesList}
          />
        </View>

        <View style={styles.urgenciasContainer}>
          <View style={styles.urgenciasHeader}>
            <View style={styles.urgenciasTitleContainer}>
              <Icon name="alert-octagon" size={20} color="#EF4444" />
              <Text style={styles.urgenciasTitle}>URGÊNCIAS</Text>
            </View>
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>3 Alertas</Text>
            </View>
          </View>

          <View style={styles.tendenciaCard}>
            <Text style={styles.tendenciaTitle}>Tendência de Piora Detectada</Text>
            <Text style={styles.tendenciaDescricao}>
              Pacientes: {tendenciaPiora.join(', ')} apresentaram quedas bruscas no humor semanal.
            </Text>
            <TouchableOpacity style={styles.relatorioButton}>
              <Text style={styles.relatorioButtonText}>Ver Relatórios Completos →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.configContaContainer}>
          <TouchableOpacity style={styles.configContaButton} onPress={() => navigation.navigate('Configuracoes')}>            
            <Icon name="sliders" size={20} color="#6366F1" />
            <Text style={styles.configContaText}>Configurações</Text>
            <Text style={styles.configContaSubtext}>AJUSTES DA CONTA</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========== BOTTOM NAVIGATION ========== */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate('VisaoGeral')}
        >
          <Icon name="home" size={24} color="#6366F1" />
          <Text style={[styles.navText, styles.navTextActive]}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Pacientes')}
        >
          <Icon name="users" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Pacientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Relatorios')}
        >
          <Icon name="bar-chart-2" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Relatórios</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Aumentado para dar espaço para o bottom nav
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  configButton: {
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  criticosChip: {
    backgroundColor: '#FEE2E2',
  },
  criticosText: {
    color: '#EF4444',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#6366F1',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chart: {
    marginLeft: -20,
    borderRadius: 16,
  },
  atencaoContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  verTodosText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  pacientesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  pacienteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pacienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pacienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pacienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tipoTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  pacienteDescricao: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  pacienteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaTexto: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  metaIcon: {
    marginLeft: 12,
  },
  pacienteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  prontuarioButton: {
    backgroundColor: '#EEF2FF',
  },
  prontuarioButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  contatarButton: {
    backgroundColor: '#6366F1',
  },
  contatarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  urgenciasContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  urgenciasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  urgenciasTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgenciasTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  alertCount: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  tendenciaCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tendenciaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tendenciaDescricao: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 12,
    lineHeight: 20,
  },
  relatorioButton: {
    alignSelf: 'flex-start',
  },
  relatorioButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  configContaContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  configContaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  configContaText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  configContaSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    // Estilo ativo
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  navTextActive: {
    color: '#6366F1',
    fontWeight: '500',
  },
});

export default VisaoGeral;