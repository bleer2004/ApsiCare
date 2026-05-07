import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';

const RelatoriosPaciente = ({ paciente, standalone = false }) => {
  const [periodo, setPeriodo] = useState('semana');
  const screenWidth = Dimensions.get('window').width;

  // Dados do paciente
  const pacienteData = paciente || {
    nome: 'Ana Carolina',
    diagnostico: 'Transtorno de Ansiedade Generalizada (TAG)',
  };

  // Dados do gráfico de correlação
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

  // Dados para o gráfico de evolução mensal
  const evolucaoData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        data: [45, 55, 68, 72],
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Estatísticas
  const estatisticas = {
    totalSessoes: 24,
    mediaHumor: 72,
    melhoraPercentual: 15,
    diasAtivo: 180,
  };

  const handleExportarRelatorio = async () => {
    try {
      await Share.share({
        message: `Relatório do paciente ${pacienteData.nome}\n\nDiagnóstico: ${pacienteData.diagnostico}\nMédia de humor: ${estatisticas.mediaHumor}%\nMelhora: ${estatisticas.melhoraPercentual}%\nTotal de sessões: ${estatisticas.totalSessoes}`,
        title: `Relatório - ${pacienteData.nome}`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório');
    }
  };

  const handleExportarPDF = () => {
    Alert.alert('Exportar PDF', 'Gerando relatório em PDF...');
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header com Exportar */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportarRelatorio}>
          <Icon name="share-2" size={18} color="#6366F1" />
          <Text style={styles.exportButtonText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportarPDF}>
          <Icon name="download" size={18} color="#6366F1" />
          <Text style={styles.exportButtonText}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Cards de estatísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Icon name="calendar" size={20} color="#6366F1" />
          </View>
          <Text style={styles.statValue}>{estatisticas.totalSessoes}</Text>
          <Text style={styles.statLabel}>Total de sessões</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Icon name="smile" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{estatisticas.mediaHumor}%</Text>
          <Text style={styles.statLabel}>Média de humor</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Icon name="trending-up" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>+{estatisticas.melhoraPercentual}%</Text>
          <Text style={styles.statLabel}>Melhora total</Text>
        </View>
      </View>

      {/* Gráfico: Correlação Semanal */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Correlação Semanal</Text>
          <Text style={styles.chartSubtitle}>Humor vs Qualidade do Sono</Text>
        </View>
        
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
              stroke: '#FFFFFF',
            },
            formatYLabel: (value) => `${value}%`,
          }}
          bezier
          style={styles.chart}
          legend={['Humor', 'Sono']}
        />
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#6366F1' }]} />
            <Text style={styles.legendText}>Humor</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Qualidade do Sono</Text>
          </View>
        </View>
      </View>

      {/* Gráfico: Evolução Mensal */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Evolução do Humor</Text>
          <Text style={styles.chartSubtitle}>Últimas 4 semanas</Text>
        </View>
        
        <LineChart
          data={evolucaoData}
          width={screenWidth - 64}
          height={200}
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
            formatYLabel: (value) => `${value}%`,
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Resumo Clínico */}
      <View style={styles.resumoCard}>
        <Text style={styles.resumoTitle}>Resumo Clínico</Text>
        <Text style={styles.resumoText}>
          Paciente apresenta melhora significativa nos episódios de ansiedade nas últimas 4 semanas. 
          A adesão ao tratamento tem sido consistente, com relatos de melhor qualidade do sono 
          e redução de crises noturnas.
        </Text>
        
        <View style={styles.resumoTags}>
          <View style={styles.resumoTag}>
            <Icon name="check-circle" size={14} color="#10B981" />
            <Text style={styles.resumoTagText}>Adesão: 92%</Text>
          </View>
          <View style={styles.resumoTag}>
            <Icon name="activity" size={14} color="#6366F1" />
            <Text style={styles.resumoTagText}>Evolução positiva</Text>
          </View>
          <View style={styles.resumoTag}>
            <Icon name="calendar" size={14} color="#F59E0B" />
            <Text style={styles.resumoTagText}>Meta: reduzir crises</Text>
          </View>
        </View>
      </View>

      {/* Indicadores */}
      <View style={styles.indicadoresGrid}>
        <View style={styles.indicadorCard}>
          <Text style={styles.indicadorLabel}>Melhor dia da semana</Text>
          <Text style={styles.indicadorValor}>Sexta-feira</Text>
          <Text style={styles.indicadorTrend}>Média: 78% 😊</Text>
        </View>
        <View style={styles.indicadorCard}>
          <Text style={styles.indicadorLabel}>Pior dia da semana</Text>
          <Text style={styles.indicadorValor}>Segunda-feira</Text>
          <Text style={styles.indicadorTrend}>Média: 65% 😟</Text>
        </View>
      </View>

      {/* Botão para relatório completo */}
      <TouchableOpacity style={styles.relatorioCompletoBtn} onPress={handleExportarPDF}>
        <Icon name="file-text" size={20} color="#6366F1" />
        <Text style={styles.relatorioCompletoText}>Gerar relatório completo</Text>
        <Icon name="chevron-right" size={18} color="#6366F1" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chart: {
    marginLeft: -24,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resumoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  resumoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  resumoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  resumoTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resumoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  resumoTagText: {
    fontSize: 12,
    color: '#4B5563',
  },
  indicadoresGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  indicadorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  indicadorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  indicadorValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  indicadorTrend: {
    fontSize: 11,
    color: '#6366F1',
  },
  relatorioCompletoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  relatorioCompletoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
});

export default RelatoriosPaciente;