import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Alert,
  Modal,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomNav from '../../components/BottomNav';

const Relatorios = ({ navigation }) => {
  // ========== ESTADOS ==========
  const [loading, setLoading] = useState(false);
  const [modalAnaliseVisible, setModalAnaliseVisible] = useState(false);
  const [analiseSelecionada, setAnaliseSelecionada] = useState(null);
  
  // Estados dos filtros
  const [selectedPaciente, setSelectedPaciente] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState('todos');
  
  // Dropdown de pacientes
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  
  // Lista de pacientes (mock)
  const [pacientesList, setPacientesList] = useState([]);

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/clinicians/${user.id}/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPacientesList((data.patients || []).map(p => ({
          id: p.patientId || p.id,
          nome: p.name,
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    }
  };

  // Dados mockados de relatórios
  const [relatorios, setRelatorios] = useState([
    {
      id: '1',
      pacienteNome: 'Ana Clara Silva',
      pacienteId: '1',
      tipo: 'smartwatch',
      titulo: 'Relatório de Dados do Smartwatch - Semana 21',
      data: '25/05/2024',
      descricao: 'Dados de frequência cardíaca, sono e atividade física da semana.',
      conteudo: {
        batimentos: { media: 72, max: 89, min: 65 },
        sono: { qualidade: 84, profundo: '2h40', rem: '3h15' },
        passos: { total: 58432, media: 8347 },
        stress: 'Baixo',
      },
      analiseIA: 'Paciente apresentou melhora na qualidade do sono em 15% comparado à semana anterior. Níveis de stress mantiveram-se baixos, indicando boa resposta ao tratamento. Recomenda-se manter a rotina atual de exercícios.',
    },
    {
      id: '2',
      pacienteNome: 'Ana Clara Silva',
      pacienteId: '1',
      tipo: 'anotacoes',
      titulo: 'Anotações do Diário - Semana 21',
      data: '24/05/2024',
      descricao: 'Registros diários de humor e reflexões do paciente.',
      conteudo: 'Dia 1: Me senti ansiosa. Dia 2: Melhorei depois da terapia. Dia 3: Consegui sair com amigos!',
      analiseIA: 'IA identificou padrão de ansiedade no início da semana, com melhora progressiva após a sessão de terapia. Evento social positivo no final de semana indica progresso no engajamento social.',
    },
    {
      id: '3',
      pacienteNome: 'Marcos Oliveira',
      pacienteId: '2',
      tipo: 'smartwatch',
      titulo: 'Relatório de Dados do Smartwatch - Semana 20',
      data: '18/05/2024',
      descricao: 'Dados de frequência cardíaca, sono e atividade física da semana.',
      conteudo: {
        batimentos: { media: 78, max: 95, min: 70 },
        sono: { qualidade: 72, profundo: '1h50', rem: '2h45' },
        passos: { total: 42100, media: 6014 },
        stress: 'Médio',
      },
      analiseIA: 'Paciente apresenta níveis de stress elevados. Qualidade do sono abaixo da média recomendada. Sugere-se revisão das estratégias de relaxamento e aumento da atividade física.',
    },
    {
      id: '4',
      pacienteNome: 'Beatriz Santos',
      pacienteId: '3',
      tipo: 'anotacoes',
      titulo: 'Anotações do Diário - Semana 19',
      data: '15/05/2024',
      descricao: 'Registros diários de humor e reflexões do paciente.',
      conteudo: 'Semana desafiadora. Consegui aplicar as técnicas de respiração.',
      analiseIA: 'Paciente demonstra adesão às técnicas de respiração. Relatos indicam melhora no controle da ansiedade. Manter o reforço positivo.',
    },
  ]);

  // ========== FUNÇÕES DE FILTRO ==========
  const getFilteredRelatorios = () => {
    let filtered = [...relatorios];
    
    if (selectedPaciente !== 'todos') {
      filtered = filtered.filter(r => r.pacienteId === selectedPaciente);
    }
    
    if (tipoRelatorio !== 'todos') {
      filtered = filtered.filter(r => r.tipo === tipoRelatorio);
    }
    
    if (dataInicio) {
      filtered = filtered.filter(r => {
        const [dia, mes, ano] = r.data.split('/');
        const dataRelatorio = new Date(`${ano}-${mes}-${dia}`);
        const dataInicioDate = new Date(dataInicio.split('/').reverse().join('-'));
        return dataRelatorio >= dataInicioDate;
      });
    }
    
    if (dataFim) {
      filtered = filtered.filter(r => {
        const [dia, mes, ano] = r.data.split('/');
        const dataRelatorio = new Date(`${ano}-${mes}-${dia}`);
        const dataFimDate = new Date(dataFim.split('/').reverse().join('-'));
        return dataRelatorio <= dataFimDate;
      });
    }
    
    return filtered;
  };

  // ========== AÇÕES DOS RELATÓRIOS ==========
  const handleBaixarRelatorio = async (relatorio) => {
    try {
      let conteudoTexto = '';
      
      if (relatorio.tipo === 'smartwatch') {
        conteudoTexto = `
📊 RELATÓRIO SMARTWATCH - ${relatorio.pacienteNome}
📅 Data: ${relatorio.data}
📝 ${relatorio.titulo}

📈 DADOS DE SAÚDE:
• Batimentos cardíacos: Média ${relatorio.conteudo.batimentos.media} BPM | Máx ${relatorio.conteudo.batimentos.max} | Mín ${relatorio.conteudo.batimentos.min}
• Qualidade do sono: ${relatorio.conteudo.sono.qualidade}%
• Sono profundo: ${relatorio.conteudo.sono.profundo}
• Sono REM: ${relatorio.conteudo.sono.rem}
• Passos: ${relatorio.conteudo.passos.total.toLocaleString()} (média ${relatorio.conteudo.passos.media}/dia)
• Nível de stress: ${relatorio.conteudo.stress}

🤖 ANÁLISE DA IA:
${relatorio.analiseIA}

---
Relatório gerado por PsicoCare - Plataforma de Saúde Mental
`;
      } else {
        conteudoTexto = `
📝 RELATÓRIO DE ANOTAÇÕES - ${relatorio.pacienteNome}
📅 Data: ${relatorio.data}
📝 ${relatorio.titulo}

📓 CONTEÚDO:
${relatorio.conteudo}

🤖 ANÁLISE DA IA:
${relatorio.analiseIA}

---
Relatório gerado por PsicoCare - Plataforma de Saúde Mental
`;
      }
      
      await Share.share({
        message: conteudoTexto,
        title: `Relatorio_${relatorio.pacienteNome}_${relatorio.data}.txt`,
      });
      
      Alert.alert('Sucesso', 'Relatório compartilhado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório');
    }
  };
  
  const handleAnalisarIA = (relatorio) => {
    setAnaliseSelecionada(relatorio);
    setModalAnaliseVisible(true);
  };
  
  const handleLimparFiltros = () => {
    setSelectedPaciente('todos');
    setDataInicio('');
    setDataFim('');
    setTipoRelatorio('todos');
  };
  
  const handleExportarTodos = async () => {
    const relatoriosFiltrados = getFilteredRelatorios();
    
    if (relatoriosFiltrados.length === 0) {
      Alert.alert('Aviso', 'Nenhum relatório para exportar');
      return;
    }
    
    let textoExportacao = '📊 RELATÓRIOS PSICOCARE 📊\n';
    textoExportacao += `Data de geração: ${new Date().toLocaleDateString('pt-BR')}\n`;
    textoExportacao += `Total de relatórios: ${relatoriosFiltrados.length}\n`;
    textoExportacao += '='.repeat(50) + '\n\n';
    
    relatoriosFiltrados.forEach((relatorio, index) => {
      textoExportacao += `📄 ${index + 1}. ${relatorio.titulo}\n`;
      textoExportacao += `Paciente: ${relatorio.pacienteNome}\n`;
      textoExportacao += `Data: ${relatorio.data}\n`;
      textoExportacao += `Tipo: ${relatorio.tipo === 'smartwatch' ? 'Smartwatch' : 'Anotações'}\n`;
      textoExportacao += `Descrição: ${relatorio.descricao}\n`;
      textoExportacao += `\n🤖 Análise IA: ${relatorio.analiseIA}\n`;
      textoExportacao += '-'.repeat(50) + '\n\n';
    });
    
    try {
      await Share.share({
        message: textoExportacao,
        title: 'Relatorios_PsicoCare.txt',
      });
      Alert.alert('Sucesso', 'Relatórios exportados com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar os relatórios');
    }
  };
  
  const formatDate = (event, selectedDate, type) => {
    if (type === 'start') {
      setShowStartPicker(false);
      if (selectedDate) {
        const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
        setDataInicio(formattedDate);
      }
    } else {
      setShowEndPicker(false);
      if (selectedDate) {
        const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
        setDataFim(formattedDate);
      }
    }
  };
  
  const getTipoIcon = (tipo) => {
    return tipo === 'smartwatch' ? 'watch' : 'file-text';
  };
  
  const getTipoColor = (tipo) => {
    return tipo === 'smartwatch' ? '#B367D4' : '#10B981';
  };
  
  const getTipoLabel = (tipo) => {
    return tipo === 'smartwatch' ? 'Smartwatch' : 'Anotações';
  };
  
  const renderRelatorioCard = (relatorio) => (
    <View key={relatorio.id} style={styles.relatorioCard}>
      <View style={styles.relatorioHeader}>
        <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(relatorio.tipo) + '20' }]}>
          <Icon name={getTipoIcon(relatorio.tipo)} size={14} color={getTipoColor(relatorio.tipo)} />
          <Text style={[styles.tipoBadgeText, { color: getTipoColor(relatorio.tipo) }]}>
            {getTipoLabel(relatorio.tipo)}
          </Text>
        </View>
        <Text style={styles.relatorioData}>{relatorio.data}</Text>
      </View>
      
      <Text style={styles.relatorioTitulo}>{relatorio.titulo}</Text>
      <Text style={styles.relatorioPaciente}>
        <Icon name="user" size={12} color="#94A3B8" /> {relatorio.pacienteNome}
      </Text>
      <Text style={styles.relatorioDescricao} numberOfLines={2}>
        {relatorio.descricao}
      </Text>
      
      <View style={styles.relatorioActions}>
        <TouchableOpacity style={styles.analisarBtn} onPress={() => handleAnalisarIA(relatorio)}>
          <Icon name="cpu" size={18} color="#B367D4" />
          <Text style={styles.analisarBtnText}>Analisar com IA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.baixarBtn} onPress={() => handleBaixarRelatorio(relatorio)}>
          <Icon name="download" size={18} color="#10B981" />
          <Text style={styles.baixarBtnText}>Baixar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const filteredRelatorios = getFilteredRelatorios();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatórios</Text>
          <TouchableOpacity style={styles.exportAllButton} onPress={handleExportarTodos}>
            <Icon name="download" size={18} color="#B367D4" />
            <Text style={styles.exportAllText}>Exportar Tudo</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtros</Text>
          
          {/* Filtro por Paciente */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Paciente</Text>
            <TouchableOpacity 
              style={styles.filterSelect}
              onPress={() => setShowPacienteDropdown(!showPacienteDropdown)}
            >
              <Text style={styles.filterSelectText}>
                {selectedPaciente === 'todos' ? 'Todos os pacientes' : pacientesList.find(p => p.id === selectedPaciente)?.nome}
              </Text>
              <Icon name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            {showPacienteDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedPaciente('todos'); setShowPacienteDropdown(false); }}>
                  <Text style={styles.dropdownItemText}>Todos os pacientes</Text>
                </TouchableOpacity>
                {pacientesList.map(paciente => (
                  <TouchableOpacity 
                    key={paciente.id} 
                    style={styles.dropdownItem} 
                    onPress={() => { setSelectedPaciente(paciente.id); setShowPacienteDropdown(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{paciente.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Filtro por Data */}
          <View style={styles.filterRow}>
            <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.filterLabel}>Data Início</Text>
              <TouchableOpacity style={styles.filterSelect} onPress={() => setShowStartPicker(true)}>
                <Text style={[styles.filterSelectText, !dataInicio && styles.placeholderText]}>
                  {dataInicio || 'Selecionar data'}
                </Text>
                <Icon name="calendar" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.filterGroup, { flex: 1 }]}>
              <Text style={styles.filterLabel}>Data Fim</Text>
              <TouchableOpacity style={styles.filterSelect} onPress={() => setShowEndPicker(true)}>
                <Text style={[styles.filterSelectText, !dataFim && styles.placeholderText]}>
                  {dataFim || 'Selecionar data'}
                </Text>
                <Icon name="calendar" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Filtro por Tipo */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Tipo de Relatório</Text>
            <View style={styles.tipoFilterRow}>
              <TouchableOpacity 
                style={[styles.tipoFilterBtn, tipoRelatorio === 'todos' && styles.tipoFilterBtnActive]}
                onPress={() => setTipoRelatorio('todos')}
              >
                <Text style={[styles.tipoFilterText, tipoRelatorio === 'todos' && styles.tipoFilterTextActive]}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tipoFilterBtn, tipoRelatorio === 'smartwatch' && styles.tipoFilterBtnActive]}
                onPress={() => setTipoRelatorio('smartwatch')}
              >
                <Icon name="watch" size={14} color={tipoRelatorio === 'smartwatch' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tipoFilterText, tipoRelatorio === 'smartwatch' && styles.tipoFilterTextActive]}>Smartwatch</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tipoFilterBtn, tipoRelatorio === 'anotacoes' && styles.tipoFilterBtnActive]}
                onPress={() => setTipoRelatorio('anotacoes')}
              >
                <Icon name="file-text" size={14} color={tipoRelatorio === 'anotacoes' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tipoFilterText, tipoRelatorio === 'anotacoes' && styles.tipoFilterTextActive]}>Anotações</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Botão Limpar Filtros */}
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleLimparFiltros}>
            <Icon name="x" size={16} color="#B367D4" />
            <Text style={styles.clearFiltersText}>Limpar filtros</Text>
          </TouchableOpacity>
        </View>
        
        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredRelatorios.length}</Text>
            <Text style={styles.statLabel}>Relatórios encontrados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {filteredRelatorios.filter(r => r.tipo === 'smartwatch').length}
            </Text>
            <Text style={styles.statLabel}>Smartwatch</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {filteredRelatorios.filter(r => r.tipo === 'anotacoes').length}
            </Text>
            <Text style={styles.statLabel}>Anotações</Text>
          </View>
        </View>
        
        {/* Lista de Relatórios */}
        <View style={styles.relatoriosContainer}>
          <Text style={styles.relatoriosTitle}>
            Histórico de Relatórios
            {filteredRelatorios.length > 0 && <Text style={styles.relatoriosCount}> ({filteredRelatorios.length})</Text>}
          </Text>
          
          {filteredRelatorios.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="file-text" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>Nenhum relatório encontrado</Text>
              <Text style={styles.emptyStateText}>
                Tente ajustar os filtros para encontrar mais resultados
              </Text>
            </View>
          ) : (
            filteredRelatorios.map(renderRelatorioCard)
          )}
        </View>
      </ScrollView>
      
      {/* DatePickers */}
      {showStartPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => formatDate(event, date, 'start')}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => formatDate(event, date, 'end')}
        />
      )}
      
      {/* Modal de Análise da IA */}
      <Modal animationType="fade" transparent={true} visible={modalAnaliseVisible} onRequestClose={() => setModalAnaliseVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.analiseModalContainer}>
            <View style={styles.analiseModalHeader}>
              <View style={styles.analiseIcon}>
                <Icon name="cpu" size={24} color="#B367D4" />
              </View>
              <View style={styles.analiseHeaderText}>
                <Text style={styles.analiseModalTitle}>Análise da IA</Text>
                <Text style={styles.analiseModalSubtitle}>
                  {analiseSelecionada?.pacienteNome} - {analiseSelecionada?.data}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalAnaliseVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.analiseModalContent}>
              <View style={styles.analiseTipoBadge}>
                <Icon name={getTipoIcon(analiseSelecionada?.tipo)} size={14} color={getTipoColor(analiseSelecionada?.tipo)} />
                <Text style={[styles.analiseTipoText, { color: getTipoColor(analiseSelecionada?.tipo) }]}>
                  {getTipoLabel(analiseSelecionada?.tipo)}
                </Text>
              </View>
              
              <Text style={styles.analiseTitulo}>{analiseSelecionada?.titulo}</Text>
              <Text style={styles.analiseDescricao}>{analiseSelecionada?.descricao}</Text>
              
              <View style={styles.analiseDivider} />
              
              <Text style={styles.analiseSectionTitle}>
                <Icon name="brain" size={16} color="#B367D4" /> Análise Inteligente
              </Text>
              <Text style={styles.analiseText}>{analiseSelecionada?.analiseIA}</Text>
              
              {analiseSelecionada?.tipo === 'smartwatch' && analiseSelecionada?.conteudo && (
                <View style={styles.detalhesContainer}>
                  <Text style={styles.detalhesTitle}>📊 Dados Detalhados</Text>
                  <View style={styles.detalhesRow}>
                    <Text style={styles.detalhesLabel}>Batimentos:</Text>
                    <Text style={styles.detalhesValue}>
                      Média {analiseSelecionada.conteudo.batimentos.media} BPM | 
                      Máx {analiseSelecionada.conteudo.batimentos.max} | 
                      Mín {analiseSelecionada.conteudo.batimentos.min}
                    </Text>
                  </View>
                  <View style={styles.detalhesRow}>
                    <Text style={styles.detalhesLabel}>Sono:</Text>
                    <Text style={styles.detalhesValue}>
                      Qualidade {analiseSelecionada.conteudo.sono.qualidade}% | 
                      Profundo {analiseSelecionada.conteudo.sono.profundo} | 
                      REM {analiseSelecionada.conteudo.sono.rem}
                    </Text>
                  </View>
                  <View style={styles.detalhesRow}>
                    <Text style={styles.detalhesLabel}>Atividade:</Text>
                    <Text style={styles.detalhesValue}>
                      {analiseSelecionada.conteudo.passos.total.toLocaleString()} passos (média {analiseSelecionada.conteudo.passos.media}/dia)
                    </Text>
                  </View>
                  <View style={styles.detalhesRow}>
                    <Text style={styles.detalhesLabel}>Stress:</Text>
                    <Text style={[styles.detalhesValue, { color: analiseSelecionada.conteudo.stress === 'Baixo' ? '#10B981' : '#F59E0B' }]}>
                      {analiseSelecionada.conteudo.stress}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={styles.analiseModalFooter}>
              <TouchableOpacity style={styles.analiseCloseButton} onPress={() => setModalAnaliseVisible(false)}>
                <Text style={styles.analiseCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.analiseExportButton} onPress={() => {
                if (analiseSelecionada) {
                  handleBaixarRelatorio(analiseSelecionada);
                  setModalAnaliseVisible(false);
                }
              }}>
                <Icon name="download" size={18} color="#FFFFFF" />
                <Text style={styles.analiseExportButtonText}>Exportar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Bottom Navigation - Componente reutilizável */}
      <BottomNav navigation={navigation} currentScreen="Relatorios" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
  },
  exportAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  exportAllText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#B367D4',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filtersTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
  },
  filterSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  filterSelectText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoFilterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tipoFilterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tipoFilterBtnActive: {
    backgroundColor: '#B367D4',
  },
  tipoFilterText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
  },
  tipoFilterTextActive: {
    color: '#FFFFFF',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#B367D4',
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#0F172A',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#B367D4',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Manrope',
    color: '#64748B',
    marginTop: 4,
  },
  relatoriosContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  relatoriosTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  relatoriosCount: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '400',
  },
  relatorioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relatorioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  tipoBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  relatorioData: {
    fontSize: 11,
    fontFamily: 'Manrope',
    color: '#94A3B8',
  },
  relatorioTitulo: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  relatorioPaciente: {
    fontSize: 13,
    fontFamily: 'Manrope',
    color: '#64748B',
    marginBottom: 8,
  },
  relatorioDescricao: {
    fontSize: 13,
    fontFamily: 'Manrope',
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  relatorioActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  analisarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  analisarBtnText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#B367D4',
  },
  baixarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
  },
  baixarBtnText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analiseModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    width: '90%',
    maxHeight: '80%',
  },
  analiseModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  analiseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analiseHeaderText: {
    flex: 1,
  },
  analiseModalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
  },
  analiseModalSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    color: '#64748B',
    marginTop: 2,
  },
  analiseModalContent: {
    padding: 20,
  },
  analiseTipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6,
    marginBottom: 12,
  },
  analiseTipoText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  analiseTitulo: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  analiseDescricao: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#64748B',
    marginBottom: 16,
  },
  analiseDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  analiseSectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  analiseText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#475569',
    lineHeight: 22,
  },
  detalhesContainer: {
    backgroundColor: 'rgba(179, 103, 212, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  detalhesTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  detalhesRow: {
    marginBottom: 10,
  },
  detalhesLabel: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  detalhesValue: {
    fontSize: 13,
    fontFamily: 'Manrope',
    color: '#0F172A',
  },
  analiseModalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  analiseCloseButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  analiseCloseButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
  },
  analiseExportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B367D4',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  analiseExportButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default Relatorios;