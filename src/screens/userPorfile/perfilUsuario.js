import React, { useState, useEffect } from 'react';
import { API_URL } from '../../services/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';

const DashboardPaciente = ({ navigation, route }) => {
  const screenWidth = Dimensions.get('window').width;
  const [loading, setLoading] = useState(true);
  
  const [paciente, setPaciente] = useState(route?.params?.paciente || {
    id: '45092',
    nome: 'Ana Carolina',
    idade: 32,
    diagnosticoPrincipal: 'F41.1 - Transtorno de Ansiedade Generalizada (TAG)',
    condicao: 'Anorexia',
    statusEmocional: 'Estável',
    melhoraPercentual: 15,
  });

  // Mantendo sua lista de metas original como fallback (MOCKS)
  const [metas, setMetas] = useState([
    {
      id: '1',
      titulo: 'Reduzir episódios de pânico',
      progresso: 'Frequência caiu 40% este mês',
      status: 'concluido',
      link: 'https://www.google.com/search?q=reduzir+episodios+de+pânico',
    },
    {
      id: '2',
      titulo: 'Exercício 3x por semana',
      progresso: 'Em andamento - 1/3 concluído',
      status: 'andamento',
      link: 'https://www.google.com/search?q=exercicio+3x+por+semana',
    },
    {
      id: '3',
      titulo: 'Higiene do sono (Desligar telas)',
      progresso: 'Novo objetivo estabelecido',
      status: 'novo',
      link: 'https://www.google.com/search?q=higiene+do+sono',
    },
  ]);

  const [smartwatchData, setSmartwatchData] = useState({
    batimentos: 72,
    qualidadeSono: 84,
    nivelStress: 'Baixo',
  });

  const USE_REAL_API = false; 

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!USE_REAL_API) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [resMetas, resPhysio] = await Promise.all([
          fetch(`${API_URL}/patients/${paciente.id}/goals`),
          fetch(`${API_URL}/patients/${paciente.id}/physio`)
        ]);

        const dataMetas = await resMetas.json();
        const dataPhysio = await resPhysio.json();

        if (dataMetas.goals) setMetas(dataMetas.goals);
        if (dataPhysio.samples?.length > 0) {
          const last = dataPhysio.samples[0];
          setSmartwatchData({
            batimentos: Math.round(last.hr),
            qualidadeSono: 84, 
            nivelStress: last.hr > 100 ? 'Alto' : 'Baixo',
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [paciente.id]);

  const correlacaoData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [65, 70, 68, 72, 75, 78, 80],
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
        legend: 'Humor (%)',
      },
      {
        data: [70, 72, 68, 75, 78, 82, 84],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
        legend: 'Sono (%)',
      },
    ],
  };

  const handleExportarRelatorio = async () => {
    try {
      await Share.share({
        message: `Relatório do paciente ${paciente.nome}\n\nDiagnóstico: ${paciente.diagnosticoPrincipal}\nStatus: ${paciente.statusEmocional}\nMelhora: ${paciente.melhoraPercentual}%`,
        title: `Relatório - ${paciente.nome}`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório');
    }
  };

  const handleMetaPress = (meta) => {
    Alert.alert(
      meta.titulo,
      `${meta.progresso}\n\nLink: ${meta.link}`, // Incluindo o link no alerta
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Ver mais', onPress: () => console.log('Ver mais:', meta) }
      ]
    );
  };

  const renderStatusBadge = () => {
    const isEstavel = paciente.statusEmocional === 'Estável';
    return (
      <View style={[styles.statusBadge, isEstavel ? styles.statusEstavel : styles.statusInstavel]}>
        <Icon name={isEstavel ? 'check-circle' : 'alert-circle'} size={16} color={isEstavel ? '#10B981' : '#F59E0B'} />
        <Text style={[styles.statusText, isEstavel ? styles.statusTextEstavel : styles.statusTextInstavel]}>
          {paciente.statusEmocional}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header com Voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportarRelatorio} style={styles.exportButton}>
            <Icon name="download" size={20} color="#6366F1" />
            <Text style={styles.exportText}>Exportar</Text>
          </TouchableOpacity>
        </View>

        {/* Informações do Paciente */}
        <View style={styles.pacienteInfo}>
          <View style={styles.pacienteHeader}>
            <Text style={styles.pacienteNome}>{paciente.nome}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>ID: {paciente.id}</Text>
            </View>
          </View>
          <Text style={styles.pacienteIdade}> {paciente.idade} anos</Text>
          
          <View style={styles.condicaoContainer}>
            <Text style={styles.condicaoLabel}>CONDIÇÃO</Text>
            <Text style={styles.condicaoValor}>{paciente.condicao}</Text>
          </View>
        </View>

        {/* Status Emocional */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status Emocional (Semana)</Text>
            {renderStatusBadge()}
          </View>
          <Text style={styles.melhoraText}>
            Melhora de {paciente.melhoraPercentual}% em relação à semana anterior
          </Text>
        </View>

        {/* Diagnóstico Principal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Diagnóstico Principal</Text>
          <Text style={styles.diagnosticoCodigo}>{paciente.diagnosticoPrincipal}</Text>
          <Text style={styles.diagnosticoDescricao}>
            Paciente apresenta sintomas persistentes de preocupação excessiva, 
            tensão muscular e distúrbios de sono há mais de 6 meses.
          </Text>
        </View>

        {/* Resumo Clínico */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo Clínico</Text>
          <Text style={styles.resumoTexto}>
            O paciente apresenta melhora nos episódios depressivos, com maior engajamento 
            em atividades sociais. Sono permanece como fator crítico de oscilação emocional.
          </Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Icon name="check-circle" size={14} color="#10B981" />
              <Text style={styles.tagText}>ADESÃO MEDICAMENTOSA</Text>
            </View>
            <View style={styles.tag}>
              <Icon name="heart" size={14} color="#6366F1" />
              <Text style={styles.tagText}>MINDFULNESS SEMANAL</Text>
            </View>
          </View>
        </View>

        {/* Smartwatch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Smartwatch</Text>
          <View style={styles.smartwatchRow}>
            <View style={styles.smartwatchItem}>
              <Icon name="activity" size={24} color="#6366F1" />
              <Text style={styles.smartwatchValue}>{smartwatchData.batimentos}</Text>
              <Text style={styles.smartwatchLabel}>BPM</Text>
            </View>
            <View style={styles.smartwatchDivider} />
            <View style={styles.smartwatchItem}>
              <Icon name="moon" size={24} color="#6366F1" />
              <Text style={styles.smartwatchValue}>{smartwatchData.qualidadeSono}%</Text>
              <Text style={styles.smartwatchLabel}>Qualidade Sono</Text>
            </View>
            <View style={styles.smartwatchDivider} />
            <View style={styles.smartwatchItem}>
              <Icon name="zap" size={24} color="#10B981" />
              <Text style={[styles.smartwatchValue, { color: '#10B981' }]}>{smartwatchData.nivelStress}</Text>
              <Text style={styles.smartwatchLabel}>Nível de Stress</Text>
            </View>
          </View>
        </View>

        {/* Metas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Metas</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            metas.map((meta) => (
              <TouchableOpacity 
                key={meta.id} 
                style={styles.metaItem}
                onPress={() => handleMetaPress(meta)}
              >
                <View style={styles.metaContent}>
                  <View style={[
                    styles.metaStatusDot,
                    meta.status === 'concluido' && styles.metaStatusConcluido,
                    meta.status === 'andamento' && styles.metaStatusAndamento,
                    meta.status === 'novo' && styles.metaStatusNovo,
                  ]} />
                  <View style={styles.metaTextContainer}>
                    <Text style={styles.metaTitulo}>{meta.titulo}</Text>
                    <Text style={styles.metaProgresso}>{meta.progresso}</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Correlação Semanal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Correlação Semanal</Text>
          <Text style={styles.correlacaoSubtitle}>Humor vs Qualidade do Sono</Text>
          
          <LineChart
            data={correlacaoData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1, index) => {
                if (index === 0) return `rgba(99, 102, 241, ${opacity})`;
                return `rgba(16, 185, 129, ${opacity})`;
              },
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
            legend={['Humor', 'Sono']}
            formatYLabel={(value) => `${value}%`}
          />
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('VisaoGeral')}
          >
            <Icon name="home" size={24} color="#9CA3AF" />
            <Text style={styles.navText}>Início</Text>
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
      </ScrollView>
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
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  pacienteInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pacienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  pacienteNome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  idBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  idText: {
    fontSize: 12,
    color: '#6B7280',
  },
  pacienteIdade: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  condicaoContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  condicaoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  condicaoValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusEstavel: {
    backgroundColor: '#D1FAE5',
  },
  statusInstavel: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextEstavel: {
    color: '#10B981',
  },
  statusTextInstavel: {
    color: '#F59E0B',
  },
  melhoraText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  diagnosticoCodigo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  diagnosticoDescricao: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  resumoTexto: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  smartwatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  smartwatchItem: {
    alignItems: 'center',
    flex: 1,
  },
  smartwatchDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  smartwatchValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  smartwatchLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  metaStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  metaStatusConcluido: {
    backgroundColor: '#10B981',
  },
  metaStatusAndamento: {
    backgroundColor: '#F59E0B',
  },
  metaStatusNovo: {
    backgroundColor: '#6366F1',
  },
  metaTextContainer: {
    flex: 1,
  },
  metaTitulo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  metaProgresso: {
    fontSize: 12,
    color: '#6B7280',
  },
  correlacaoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  chart: {
    marginLeft: -25,
    borderRadius: 16,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default DashboardPaciente;