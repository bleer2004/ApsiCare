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
  Image,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';

import RelatoriosPaciente from '../Files/RelatoriosPsicologo';

const DashboardPaciente = ({ navigation, route }) => {
  const screenWidth = Dimensions.get('window').width;
  
  // ========== ESTADOS ==========
  const [abaAtiva, setAbaAtiva] = useState('perfil');
  const [loading, setLoading] = useState(true);

  // Estado para o Modal de Metas
  const [modalMetasVisible, setModalMetasVisible] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');
  const [novaMetaPrazo, setNovaMetaPrazo] = useState('');

  // Estado para o Modal de Insights
  const [modalInsightVisible, setModalInsightVisible] = useState(false);
  const [novoInsight, setNovoInsight] = useState('');

  // Estado para o Modal de Lembretes
  const [modalLembreteVisible, setModalLembreteVisible] = useState(false);
  const [novoLembrete, setNovoLembrete] = useState('');
  const [lembreteDia, setLembreteDia] = useState('segunda');

  // Estado para o Modal de Arquivos
  const [modalArquivoVisible, setModalArquivoVisible] = useState(false);
  const [modalAnaliseVisible, setModalAnaliseVisible] = useState(false);
  const [analiseSelecionada, setAnaliseSelecionada] = useState(null);

  // Estado para o Modal de Anotações do Paciente
  const [modalAnotacaoVisible, setModalAnotacaoVisible] = useState(false);
  const [anotacaoSelecionada, setAnotacaoSelecionada] = useState(null);

  const [paciente, setPaciente] = useState(route?.params?.paciente || {
    id: '45092',
    nome: 'Ana Carolina',
    idade: 32,
    diagnosticoPrincipal: 'F41.1 - Transtorno de Ansiedade Generalizada (TAG)',
    condicao: 'Anorexia',
    statusEmocional: 'Estável',
    melhoraPercentual: 15,
  });

  // Lista de Metas
  const [metasList, setMetasList] = useState([]);

  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setMetasList(data.goals || []);
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
    }
  };

  // Lista de Insights
  const [insightsList, setInsightsList] = useState([
    {
      id: '1',
      texto: 'Paciente responde bem a exercícios de respiração pela manhã',
      data: '20/05/2024',
    },
    {
      id: '2',
      texto: 'Identificado padrão de piora do humor aos finais de semana',
      data: '15/05/2024',
    },
    {
      id: '3',
      texto: 'Melhora significativa quando mantém rotina de sono regular',
      data: '10/05/2024',
    },
  ]);

  // Lista de Lembretes Semanais
  const [lembretesList, setLembretesList] = useState([
    {
      id: '1',
      texto: 'Praticar 10 minutos de mindfulness antes de dormir',
      dia: 'segunda',
      enviado: false,
    },
    {
      id: '2',
      texto: 'Realizar o diário emocional',
      dia: 'quarta',
      enviado: false,
    },
    {
      id: '3',
      texto: 'Exercício físico de 30 minutos',
      dia: 'sexta',
      enviado: false,
    },
  ]);

  // Lista de Arquivos (sem dependência externa)
  const [arquivosList, setArquivosList] = useState([
    {
      id: '1',
      nome: 'Laudo_Psicologico_V1.pdf',
      tipo: 'PDF',
      tamanho: '1.2 MB',
      data: '15/05/2024',
      analise: 'O documento apresenta informações sobre o diagnóstico do paciente. Recomenda-se acompanhamento psicológico contínuo. Padrões de ansiedade identificados com base nas escalas aplicadas.',
    },
    {
      id: '2',
      nome: 'Exame_Neurologico.pdf',
      tipo: 'PDF',
      tamanho: '2.1 MB',
      data: '10/05/2024',
      analise: 'Exame neurológico dentro dos parâmetros normais. Não foram identificadas alterações significativas. Sugere-se repetir em 6 meses para acompanhamento.',
    },
  ]);

  // Lista de Anotações do Paciente
  const [anotacoesList, setAnotacoesList] = useState([
    {
      id: '1',
      titulo: 'Diário - Semana 1',
      texto: 'Hoje me senti mais ansiosa do que o normal. Tive dificuldade para dormir. Mas consegui fazer os exercícios de respiração e me ajudou um pouco.',
      data: '18/05/2024',
      analise: 'IA detectou padrão de ansiedade noturna. O nível de ansiedade relatado está 15% acima da média do paciente. Sugerir técnicas de relaxamento antes de dormir.',
    },
    {
      id: '2',
      titulo: 'Reflexão sobre a terapia',
      texto: 'A sessão de hoje me fez pensar muito sobre meus gatilhos emocionais. Acho que estou começando a entender melhor meus limites.',
      data: '15/05/2024',
      analise: 'Paciente demonstrando autoconhecimento. Progresso significativo na identificação de gatilhos emocionais. Manter o foco nas estratégias de enfrentamento.',
    },
    {
      id: '3',
      titulo: 'Desafio da semana',
      texto: 'Consegui sair com amigos no fim de semana! Foi difícil no começo, mas foi bom. Me senti mais leve depois.',
      data: '12/05/2024',
      analise: 'Evento social positivo relatado. Isso indica melhora no engajamento social. Reforçar comportamentos de exposição gradual a situações sociais.',
    },
  ]);

  const [smartwatchData, setSmartwatchData] = useState({
    batimentos: 72,
    qualidadeSono: 84,
    nivelStress: 'Baixo',
  });

  const USE_REAL_API = false;

  const diasSemana = [
    { id: 'segunda', label: 'Segunda' },
    { id: 'terca', label: 'Terça' },
    { id: 'quarta', label: 'Quarta' },
    { id: 'quinta', label: 'Quinta' },
    { id: 'sexta', label: 'Sexta' },
    { id: 'sabado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' },
  ];

  // ========== FUNÇÕES DAS METAS ==========
  const handleAdicionarMeta = async () => {
    if (!novaMeta.trim()) {
      Alert.alert('Erro', 'Digite uma meta válida');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: novaMeta,
          prazo: novaMetaPrazo || 'Sem prazo definido',
        })
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro ao adicionar meta');
        return;
      }

      await carregarMetas();
      setNovaMeta('');
      setNovaMetaPrazo('');
      setModalMetasVisible(false);
      Alert.alert('Sucesso', 'Meta adicionada com sucesso!');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível adicionar a meta');
    }
  };

  const handleAtualizarStatusMeta = async (id, novoStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/patients/${paciente.id}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: novoStatus, progresso: novoStatus === 'concluido' ? 'Concluído!' : 'Em andamento' })
      });
      await carregarMetas();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar a meta');
    }
  };

  const handleRemoverMeta = (id) => {
    Alert.alert(
      'Remover meta',
      'Tem certeza que deseja remover esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await fetch(`${API_URL}/patients/${paciente.id}/goals/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            await carregarMetas();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível remover a meta');
          }
        }}
      ]
    );
  };

  // ========== FUNÇÕES DOS INSIGHTS ==========
  const handleAdicionarInsight = () => {
    if (!novoInsight.trim()) {
      Alert.alert('Erro', 'Digite um insight válido');
      return;
    }
    
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const novoInsightObj = {
      id: String(Date.now()),
      texto: novoInsight,
      data: dataAtual,
    };
    
    setInsightsList([novoInsightObj, ...insightsList]);
    setNovoInsight('');
    setModalInsightVisible(false);
    Alert.alert('Sucesso', 'Insight adicionado com sucesso!');
  };

  const handleRemoverInsight = (id) => {
    Alert.alert(
      'Remover insight',
      'Tem certeza que deseja remover este insight?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => {
          setInsightsList(insightsList.filter(insight => insight.id !== id));
        }}
      ]
    );
  };

  // ========== FUNÇÕES DOS LEMBRETES ==========
  const handleAdicionarLembrete = () => {
    if (!novoLembrete.trim()) {
      Alert.alert('Erro', 'Digite um lembrete válido');
      return;
    }
    
    const novoLembreteObj = {
      id: String(Date.now()),
      texto: novoLembrete,
      dia: lembreteDia,
      enviado: false,
    };
    
    setLembretesList([novoLembreteObj, ...lembretesList]);
    setNovoLembrete('');
    setLembreteDia('segunda');
    setModalLembreteVisible(false);
    Alert.alert('Sucesso', 'Lembrete adicionado com sucesso!');
  };

  const handleRemoverLembrete = (id) => {
    Alert.alert(
      'Remover lembrete',
      'Tem certeza que deseja remover este lembrete?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => {
          setLembretesList(lembretesList.filter(lembrete => lembrete.id !== id));
        }}
      ]
    );
  };

  const handleEnviarLembrete = (lembrete) => {
    Alert.alert(
      'Enviar lembrete',
      `Enviar "${lembrete.texto}" para o paciente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => {
          setLembretesList(lembretesList.map(l => 
            l.id === lembrete.id ? { ...l, enviado: true } : l
          ));
          Alert.alert('Enviado!', 'Lembrete enviado para o paciente');
        }}
      ]
    );
  };

  const handleEnviarLembretesSemanais = () => {
    Alert.alert(
      'Enviar lembretes semanais',
      'Deseja enviar todos os lembretes da semana para o paciente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar todos', onPress: () => {
          setLembretesList(lembretesList.map(l => ({ ...l, enviado: true })));
          Alert.alert('Enviado!', 'Lembretes semanais enviados com sucesso');
        }}
      ]
    );
  };

  // ========== FUNÇÕES DOS ARQUIVOS ==========
  const handleAdicionarArquivo = () => {
    Alert.alert(
      'Adicionar Arquivo',
      'Escolha o tipo de arquivo:',
      [
        { text: '📄 PDF', onPress: () => adicionarArquivoSimulado('PDF') },
        { text: '🖼️ Imagem', onPress: () => adicionarArquivoSimulado('Imagem') },
        { text: '📝 Documento Word', onPress: () => adicionarArquivoSimulado('DOCX') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const adicionarArquivoSimulado = (tipo) => {
    const extensao = tipo === 'PDF' ? 'pdf' : tipo === 'Imagem' ? 'jpg' : 'docx';
    const nomeArquivo = `Documento_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')}_${Math.floor(Math.random() * 1000)}.${extensao}`;
    
    const analises = {
      PDF: 'Documento analisado com sucesso. IA identificou que o conteúdo está relacionado ao histórico médico do paciente. Recomenda-se revisão do plano terapêutico.',
      Imagem: 'Imagem analisada. IA identificou padrões visuais relevantes para o acompanhamento. Nenhuma anormalidade detectada.',
      DOCX: 'Documento de texto analisado. IA extraiu informações relevantes sobre o progresso do paciente. Sugere-se continuidade do tratamento atual.',
    };
    
    const novoArquivo = {
      id: String(Date.now()),
      nome: nomeArquivo,
      tipo: extensao.toUpperCase(),
      tamanho: `${Math.floor(Math.random() * 2000 + 100)} KB`,
      data: new Date().toLocaleDateString('pt-BR'),
      analise: analises[tipo] || `Documento ${tipo} processado. IA irá analisar o conteúdo detalhadamente em breve.`,
    };
    
    setArquivosList([novoArquivo, ...arquivosList]);
    setModalArquivoVisible(false);
    Alert.alert('Sucesso', `${tipo} adicionado com sucesso!`);
  };

  const handleRemoverArquivo = (id) => {
    Alert.alert(
      'Remover arquivo',
      'Tem certeza que deseja remover este arquivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => {
          setArquivosList(arquivosList.filter(arquivo => arquivo.id !== id));
          Alert.alert('Removido', 'Arquivo removido com sucesso');
        }}
      ]
    );
  };

  const handleBaixarArquivo = (arquivo) => {
    Alert.alert('Download', `Iniciando download de ${arquivo.nome}\n\nEm breve o arquivo estará disponível em seus downloads.`);
  };

  const handleVerAnalise = (item, tipo) => {
    setAnaliseSelecionada({
      titulo: item.nome || item.titulo,
      analise: item.analise,
      tipo: tipo,
    });
    setModalAnaliseVisible(true);
  };

  const handleVerAnotacao = (anotacao) => {
    setAnotacaoSelecionada(anotacao);
    setModalAnotacaoVisible(true);
  };

  const getIconByType = (tipo) => {
    switch(tipo) {
      case 'PDF': return <Icon name="file-text" size={24} color="#EF4444" />;
      case 'DOCX': return <Icon name="file" size={24} color="#3B82F6" />;
      case 'JPG':
      case 'JPEG':
      case 'PNG': return <Icon name="image" size={24} color="#10B981" />;
      default: return <Icon name="file" size={24} color="#B367D4" />;
    }
  };

  // ========== DADOS DO GRÁFICO ==========
  const correlacaoData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [65, 70, 68, 72, 75, 78, 80],
        color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
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

  // ========== FUNÇÕES EXISTENTES ==========
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'concluido': return '#10B981';
      case 'andamento': return '#F59E0B';
      default: return '#B367D4';
    }
  };

  const getDiaLabel = (dia) => {
    const diaMap = {
      'segunda': 'Segunda',
      'terca': 'Terça',
      'quarta': 'Quarta',
      'quinta': 'Quinta',
      'sexta': 'Sexta',
      'sabado': 'Sábado',
      'domingo': 'Domingo',
    };
    return diaMap[dia] || dia;
  };

  // ========== RENDERIZAÇÃO DA ABA PERFIL ==========
  const renderAbaPerfil = () => (
    <>
      <View style={styles.pacienteInfo}>
        <View style={styles.pacienteHeader}>
          <Text style={styles.pacienteNome}>{paciente.nome}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>ID: {paciente.id}</Text>
          </View>
        </View>
        <Text style={styles.pacienteIdade}>{paciente.idade} anos</Text>
        
        <View style={styles.condicaoContainer}>
          <Text style={styles.condicaoLabel}>CONDIÇÃO</Text>
          <Text style={styles.condicaoValor}>{paciente.condicao}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Status Emocional (Semana)</Text>
          {renderStatusBadge()}
        </View>
        <Text style={styles.melhoraText}>
          Melhora de {paciente.melhoraPercentual}% em relação à semana anterior
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diagnóstico Principal</Text>
        <Text style={styles.diagnosticoCodigo}>{paciente.diagnosticoPrincipal}</Text>
        <Text style={styles.diagnosticoDescricao}>
          Paciente apresenta sintomas persistentes de preocupação excessiva, 
          tensão muscular e distúrbios de sono há mais de 6 meses.
        </Text>
      </View>

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
            <Icon name="heart" size={14} color="#B367D4" />
            <Text style={styles.tagText}>MINDFULNESS SEMANAL</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Smartwatch</Text>
        <View style={styles.smartwatchRow}>
          <View style={styles.smartwatchItem}>
            <Icon name="activity" size={24} color="#B367D4" />
            <Text style={styles.smartwatchValue}>{smartwatchData.batimentos}</Text>
            <Text style={styles.smartwatchLabel}>BPM</Text>
          </View>
          <View style={styles.smartwatchDivider} />
          <View style={styles.smartwatchItem}>
            <Icon name="moon" size={24} color="#B367D4" />
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
              if (index === 0) return `rgba(179, 103, 212, ${opacity})`;
              return `rgba(16, 185, 129, ${opacity})`;
            },
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '5', strokeWidth: '2' },
          }}
          bezier
          style={styles.chart}
          legend={['Humor', 'Sono']}
          formatYLabel={(value) => `${value}%`}
        />
      </View>
    </>
  );

  // ========== RENDERIZAÇÃO DA ABA METAS E INSIGHTS ==========
  const renderAbaMetasInsights = () => (
    <ScrollView style={styles.abaContainer} showsVerticalScrollIndicator={false}>
      {/* Seção de Metas */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎯 Metas do Paciente</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalMetasVisible(true)}>
          <Icon name="plus" size={20} color="#B367D4" />
          <Text style={styles.addButtonText}>Nova Meta</Text>
        </TouchableOpacity>
      </View>

      {metasList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="target" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhuma meta cadastrada</Text>
          <Text style={styles.emptySubtext}>Clique em "Nova Meta" para adicionar</Text>
        </View>
      ) : (
        metasList.map((meta) => (
          <View key={meta.id} style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <View style={[styles.metaStatus, { backgroundColor: getStatusColor(meta.status) + '20' }]}>
                <View style={[styles.metaStatusDot, { backgroundColor: getStatusColor(meta.status) }]} />
                <Text style={[styles.metaStatusText, { color: getStatusColor(meta.status) }]}>
                  {meta.status === 'concluido' ? 'Concluído' : meta.status === 'andamento' ? 'Em andamento' : 'Nova'}
                </Text>
              </View>
              <View style={styles.metaActions}>
                <TouchableOpacity onPress={() => handleAtualizarStatusMeta(meta.id, 'andamento')}>
                  <Icon name="clock" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAtualizarStatusMeta(meta.id, 'concluido')}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoverMeta(meta.id)}>
                  <Icon name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.metaTitulo}>{meta.titulo}</Text>
            <Text style={styles.metaProgresso}>{meta.progresso}</Text>
            <View style={styles.metaPrazo}>
              <Icon name="calendar" size={12} color="#9CA3AF" />
              <Text style={styles.metaPrazoText}>Prazo: {meta.prazo}</Text>
            </View>
          </View>
        ))
      )}

      {/* Seção de Insights */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>💡 Insights Clínicos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalInsightVisible(true)}>
          <Icon name="plus" size={20} color="#B367D4" />
          <Text style={styles.addButtonText}>Novo Insight</Text>
        </TouchableOpacity>
      </View>

      {insightsList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="lightbulb" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhum insight registrado</Text>
        </View>
      ) : (
        insightsList.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightData}>{insight.data}</Text>
              <TouchableOpacity onPress={() => handleRemoverInsight(insight.id)}>
                <Icon name="x" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.insightTexto}>{insight.texto}</Text>
          </View>
        ))
      )}

      {/* Seção de Lembretes Semanais */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>📅 Lembretes para a Semana</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalLembreteVisible(true)}>
          <Icon name="plus" size={20} color="#B367D4" />
          <Text style={styles.addButtonText}>Novo Lembrete</Text>
        </TouchableOpacity>
      </View>

      {lembretesList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="bell" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhum lembrete programado</Text>
        </View>
      ) : (
        <>
          {lembretesList.map((lembrete) => (
            <View key={lembrete.id} style={styles.lembreteCard}>
              <View style={styles.lembreteHeader}>
                <View style={styles.lembreteDia}>
                  <Icon name="calendar" size={14} color="#B367D4" />
                  <Text style={styles.lembreteDiaText}>{getDiaLabel(lembrete.dia)}</Text>
                </View>
                {lembrete.enviado && (
                  <View style={styles.enviadoBadge}>
                    <Icon name="check" size={10} color="#10B981" />
                    <Text style={styles.enviadoText}>Enviado</Text>
                  </View>
                )}
              </View>
              <Text style={styles.lembreteTexto}>{lembrete.texto}</Text>
              <View style={styles.lembreteActions}>
                <TouchableOpacity style={styles.enviarBtn} onPress={() => handleEnviarLembrete(lembrete)}>
                  <Icon name="send" size={16} color="#B367D4" />
                  <Text style={styles.enviarBtnText}>Enviar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removerBtn} onPress={() => handleRemoverLembrete(lembrete.id)}>
                  <Icon name="trash-2" size={16} color="#EF4444" />
                  <Text style={styles.removerBtnText}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.enviarTodosBtn} onPress={handleEnviarLembretesSemanais}>
            <Icon name="send" size={18} color="#FFFFFF" />
            <Text style={styles.enviarTodosBtnText}>Enviar todos os lembretes</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  // ========== RENDERIZAÇÃO DA ABA ARQUIVOS ==========
  const renderAbaArquivos = () => (
    <ScrollView style={styles.abaContainer} showsVerticalScrollIndicator={false}>
      {/* Seção de Arquivos do Psicólogo */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📄 Arquivos Compartilhados</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalArquivoVisible(true)}>
          <Icon name="plus" size={20} color="#B367D4" />
          <Text style={styles.addButtonText}>Anexar Arquivo</Text>
        </TouchableOpacity>
      </View>

      {arquivosList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="folder" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhum arquivo anexado</Text>
          <Text style={styles.emptySubtext}>Clique em "Anexar Arquivo" para adicionar</Text>
        </View>
      ) : (
        arquivosList.map((arquivo) => (
          <View key={arquivo.id} style={styles.arquivoCard}>
            <View style={styles.arquivoHeader}>
              <View style={styles.arquivoIcon}>
                {getIconByType(arquivo.tipo)}
              </View>
              <View style={styles.arquivoInfo}>
                <Text style={styles.arquivoNome}>{arquivo.nome}</Text>
                <Text style={styles.arquivoMeta}>{arquivo.tipo} • {arquivo.tamanho} • {arquivo.data}</Text>
              </View>
            </View>
            <View style={styles.arquivoActions}>
              <TouchableOpacity style={styles.analiseBtn} onPress={() => handleVerAnalise(arquivo, 'arquivo')}>
                <Icon name="cpu" size={16} color="#B367D4" />
                <Text style={styles.analiseBtnText}>Análise da IA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn} onPress={() => handleBaixarArquivo(arquivo)}>
                <Icon name="download" size={16} color="#10B981" />
                <Text style={styles.downloadBtnText}>Baixar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemoverArquivo(arquivo.id)}>
                <Icon name="trash-2" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Seção de Anotações do Paciente */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>📝 Anotações do Paciente</Text>
        <Text style={styles.sectionSubtitle}>Compartilhadas com o psicólogo</Text>
      </View>

      {anotacoesList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="edit-2" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhuma anotação compartilhada</Text>
        </View>
      ) : (
        anotacoesList.map((anotacao) => (
          <TouchableOpacity key={anotacao.id} onPress={() => handleVerAnotacao(anotacao)}>
            <View style={styles.anotacaoCard}>
              <View style={styles.anotacaoHeader}>
                <View>
                  <Text style={styles.anotacaoTitulo}>{anotacao.titulo}</Text>
                  <Text style={styles.anotacaoData}>{anotacao.data}</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>
              <Text style={styles.anotacaoTexto} numberOfLines={2}>{anotacao.texto}</Text>
              <TouchableOpacity style={styles.analiseBtn} onPress={() => handleVerAnalise(anotacao, 'anotacao')}>
                <Icon name="cpu" size={14} color="#B367D4" />
                <Text style={styles.analiseBtnText}>Ver análise da IA</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  // ========== RENDERIZAÇÃO DAS OUTRAS ABAS ==========
  const renderAbaRelatorios = () => (
    <RelatoriosPaciente paciente={paciente} standalone={true} />
  );

  

  // ========== RENDER PRINCIPAL ==========
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header com Voltar e Exportar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportarRelatorio} style={styles.exportButton}>
            <Icon name="download" size={18} color="#B367D4" />
            <Text style={styles.exportText}>Exportar</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, abaAtiva === 'perfil' && styles.tabActive]}
            onPress={() => setAbaAtiva('perfil')}
          >
            <Icon name="user" size={18} color={abaAtiva === 'perfil' ? '#B367D4' : '#94A3B8'} />
            <Text style={[styles.tabText, abaAtiva === 'perfil' && styles.tabTextActive]}>Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, abaAtiva === 'metas' && styles.tabActive]}
            onPress={() => setAbaAtiva('metas')}
          >
            <Icon name="target" size={18} color={abaAtiva === 'metas' ? '#B367D4' : '#94A3B8'} />
            <Text style={[styles.tabText, abaAtiva === 'metas' && styles.tabTextActive]}>Metas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, abaAtiva === 'arquivos' && styles.tabActive]}
            onPress={() => setAbaAtiva('arquivos')}
          >
            <Icon name="folder" size={18} color={abaAtiva === 'arquivos' ? '#B367D4' : '#94A3B8'} />
            <Text style={[styles.tabText, abaAtiva === 'arquivos' && styles.tabTextActive]}>Arquivos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, abaAtiva === 'relatorios' && styles.tabActive]}
            onPress={() => setAbaAtiva('relatorios')}
          >
            <Icon name="bar-chart-2" size={18} color={abaAtiva === 'relatorios' ? '#B367D4' : '#94A3B8'} />
            <Text style={[styles.tabText, abaAtiva === 'relatorios' && styles.tabTextActive]}>Relatórios</Text>
          </TouchableOpacity>
          
          
        </View>

        {/* Conteúdo da ABA ativa */}
        {abaAtiva === 'perfil' && renderAbaPerfil()}
        {abaAtiva === 'metas' && renderAbaMetasInsights()}
        {abaAtiva === 'arquivos' && renderAbaArquivos()}
        {abaAtiva === 'relatorios' && renderAbaRelatorios()}
        {abaAtiva === 'smartwatch' && renderAbaSmartwatch()}
      </ScrollView>

      {/* ========== MODAIS ========== */}
      {/* Modal de Adicionar Meta */}
      <Modal animationType="slide" transparent={true} visible={modalMetasVisible} onRequestClose={() => setModalMetasVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Meta</Text>
              <TouchableOpacity onPress={() => setModalMetasVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Descrição da Meta</Text>
              <TextInput style={styles.modalInput} placeholder="Ex: Praticar meditação diariamente" placeholderTextColor="#94A3B8" value={novaMeta} onChangeText={setNovaMeta} multiline />
              
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Prazo (opcional)</Text>
              <TextInput style={styles.modalInput} placeholder="Ex: 30/06/2024" placeholderTextColor="#94A3B8" value={novaMetaPrazo} onChangeText={setNovaMetaPrazo} />
              
              <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarMeta}>
                <Text style={styles.modalButtonText}>Adicionar Meta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Adicionar Insight */}
      <Modal animationType="slide" transparent={true} visible={modalInsightVisible} onRequestClose={() => setModalInsightVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Insight</Text>
              <TouchableOpacity onPress={() => setModalInsightVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Insight Clínico</Text>
              <TextInput style={[styles.modalInput, styles.textArea]} placeholder="Digite seu insight sobre o paciente..." placeholderTextColor="#94A3B8" value={novoInsight} onChangeText={setNovoInsight} multiline numberOfLines={4} textAlignVertical="top" />
              
              <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarInsight}>
                <Text style={styles.modalButtonText}>Adicionar Insight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Adicionar Lembrete */}
      <Modal animationType="slide" transparent={true} visible={modalLembreteVisible} onRequestClose={() => setModalLembreteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Lembrete</Text>
              <TouchableOpacity onPress={() => setModalLembreteVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Dia da semana</Text>
              <View style={styles.diasContainer}>
                {diasSemana.map((dia) => (
                  <TouchableOpacity key={dia.id} style={[styles.diaButton, lembreteDia === dia.id && styles.diaButtonActive]} onPress={() => setLembreteDia(dia.id)}>
                    <Text style={[styles.diaButtonText, lembreteDia === dia.id && styles.diaButtonTextActive]}>{dia.label.substring(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Lembrete</Text>
              <TextInput style={styles.modalInput} placeholder="Digite o lembrete..." placeholderTextColor="#94A3B8" value={novoLembrete} onChangeText={setNovoLembrete} multiline />
              
              <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarLembrete}>
                <Text style={styles.modalButtonText}>Adicionar Lembrete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Escolher Tipo de Arquivo */}
      <Modal animationType="slide" transparent={true} visible={modalArquivoVisible} onRequestClose={() => setModalArquivoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Anexar Arquivo</Text>
              <TouchableOpacity onPress={() => setModalArquivoVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Escolha o tipo de arquivo:</Text>
              
              <TouchableOpacity style={styles.tipoArquivoBtn} onPress={() => adicionarArquivoSimulado('PDF')}>
                <Icon name="file-text" size={24} color="#EF4444" />
                <Text style={styles.tipoArquivoBtnText}>📄 Documento PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.tipoArquivoBtn} onPress={() => adicionarArquivoSimulado('Imagem')}>
                <Icon name="image" size={24} color="#10B981" />
                <Text style={styles.tipoArquivoBtnText}>🖼️ Imagem (JPG, PNG)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.tipoArquivoBtn} onPress={() => adicionarArquivoSimulado('DOCX')}>
                <Icon name="file" size={24} color="#3B82F6" />
                <Text style={styles.tipoArquivoBtnText}>📝 Documento Word</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Análise da IA */}
      <Modal animationType="fade" transparent={true} visible={modalAnaliseVisible} onRequestClose={() => setModalAnaliseVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.analiseModalContainer}>
            <View style={styles.analiseModalHeader}>
              <View style={styles.analiseIcon}>
                <Icon name="cpu" size={24} color="#B367D4" />
              </View>
              <Text style={styles.analiseModalTitle}>Análise da IA</Text>
              <TouchableOpacity onPress={() => setModalAnaliseVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.analiseModalContent}>
              <Text style={styles.analiseItemTitle}>{analiseSelecionada?.titulo}</Text>
              <View style={styles.analiseDivider} />
              <Text style={styles.analiseText}>{analiseSelecionada?.analise}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.analiseCloseButton} onPress={() => setModalAnaliseVisible(false)}>
              <Text style={styles.analiseCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={modalAnotacaoVisible} onRequestClose={() => setModalAnotacaoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{anotacaoSelecionada?.titulo}</Text>
              <TouchableOpacity onPress={() => setModalAnotacaoVisible(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollContent}>
              <Text style={styles.anotacaoDataModal}>{anotacaoSelecionada?.data}</Text>
              <Text style={styles.anotacaoTextoModal}>{anotacaoSelecionada?.texto}</Text>
              
              <View style={styles.analiseSection}>
                <View style={styles.analiseSectionHeader}>
                  <Icon name="cpu" size={18} color="#B367D4" />
                  <Text style={styles.analiseSectionTitle}>Análise da IA</Text>
                </View>
                <Text style={styles.analiseSectionText}>{anotacaoSelecionada?.analise}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ========== ESTILOS ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  exportButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  exportText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  
  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 8, marginTop: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#B367D4' },
  tabText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#94A3B8' },
  tabTextActive: { color: '#B367D4' },
  
  // Conteúdo
  abaContainer: { padding: 16 },
  
  // Cards do Perfil
  pacienteInfo: { paddingHorizontal: 20, paddingVertical: 16 },
  pacienteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  pacienteNome: { fontSize: 28, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A' },
  idBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  idText: { fontSize: 12, fontFamily: 'Manrope', color: '#64748B' },
  pacienteIdade: { fontSize: 14, fontFamily: 'Manrope', color: '#64748B', marginTop: 4 },
  condicaoContainer: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  condicaoLabel: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 },
  condicaoValor: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#EF4444' },
  
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 },
  cardTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusEstavel: { backgroundColor: '#D1FAE5' },
  statusInstavel: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600' },
  statusTextEstavel: { color: '#10B981' },
  statusTextInstavel: { color: '#F59E0B' },
  melhoraText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#10B981' },
  
  diagnosticoCodigo: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 8 },
  diagnosticoDescricao: { fontSize: 14, fontFamily: 'Manrope', color: '#64748B', lineHeight: 20 },
  resumoTexto: { fontSize: 14, fontFamily: 'Manrope', color: '#475569', lineHeight: 20, marginBottom: 16 },
  
  tagsContainer: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  tagText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#475569' },
  
  smartwatchRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  smartwatchItem: { alignItems: 'center', flex: 1 },
  smartwatchDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  smartwatchValue: { fontSize: 24, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', marginTop: 8 },
  smartwatchLabel: { fontSize: 12, fontFamily: 'Manrope', color: '#64748B', marginTop: 4 },
  
  correlacaoSubtitle: { fontSize: 14, fontFamily: 'Manrope', color: '#64748B', marginBottom: 16 },
  chart: { marginLeft: -25, borderRadius: 16 },
  
  // Seção de Metas e Insights
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  sectionSubtitle: { fontSize: 12, fontFamily: 'Manrope', color: '#94A3B8' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  addButtonText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B', marginTop: 12 },
  emptySubtext: { fontSize: 12, fontFamily: 'Manrope', color: '#94A3B8', marginTop: 4 },
  
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  metaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metaStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  metaStatusDot: { width: 8, height: 8, borderRadius: 4 },
  metaStatusText: { fontSize: 11, fontFamily: 'Manrope', fontWeight: '600' },
  metaActions: { flexDirection: 'row', gap: 12 },
  metaTitulo: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  metaProgresso: { fontSize: 13, fontFamily: 'Manrope', color: '#64748B', marginBottom: 8 },
  metaPrazo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaPrazoText: { fontSize: 11, fontFamily: 'Manrope', color: '#94A3B8' },
  
  insightCard: { backgroundColor: '#F8FAFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E7FF' },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  insightData: { fontSize: 11, fontFamily: 'Manrope', color: '#94A3B8' },
  insightTexto: { fontSize: 14, fontFamily: 'Manrope', color: '#334155', lineHeight: 20 },
  
  lembreteCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  lembreteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  lembreteDia: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  lembreteDiaText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  enviadoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  enviadoText: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '500', color: '#10B981' },
  lembreteTexto: { fontSize: 14, fontFamily: 'Manrope', color: '#0F172A', marginBottom: 12, lineHeight: 20 },
  lembreteActions: { flexDirection: 'row', gap: 12 },
  enviarBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  enviarBtnText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  removerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  removerBtnText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#EF4444' },
  enviarTodosBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#B367D4', padding: 12, borderRadius: 12, gap: 8, marginTop: 8 },
  enviarTodosBtnText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#FFFFFF' },
  
  // Seção de Arquivos
  arquivoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  arquivoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  arquivoIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  arquivoInfo: { flex: 1 },
  arquivoNome: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#0F172A', marginBottom: 4 },
  arquivoMeta: { fontSize: 11, fontFamily: 'Manrope', color: '#94A3B8' },
  arquivoActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  analiseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analiseBtnText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  downloadBtnText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#10B981' },
  
  anotacaoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  anotacaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  anotacaoTitulo: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  anotacaoData: { fontSize: 11, fontFamily: 'Manrope', color: '#94A3B8', marginTop: 2 },
  anotacaoTexto: { fontSize: 13, fontFamily: 'Manrope', color: '#64748B', lineHeight: 18, marginBottom: 12 },
  
  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  modalContent: { padding: 20 },
  modalInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, fontFamily: 'Manrope', backgroundColor: '#FFFFFF', minHeight: 50, textAlignVertical: 'top', color: '#0F172A' },
  textArea: { height: 120 },
  inputLabel: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#334155', marginBottom: 8 },
  modalButton: { backgroundColor: '#B367D4', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  modalButtonText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#FFFFFF' },
  
  diasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  diaButtonActive: { backgroundColor: '#B367D4' },
  diaButtonText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B' },
  diaButtonTextActive: { color: '#FFFFFF' },
  
  // Modal de tipos de arquivo
  tipoArquivoBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  tipoArquivoBtnText: { fontSize: 16, fontFamily: 'Manrope', color: '#0F172A' },
  
  // Modal de Análise
  analiseModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '85%', maxHeight: '70%' },
  analiseModalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  analiseIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(179, 103, 212, 0.10)', alignItems: 'center', justifyContent: 'center' },
  analiseModalTitle: { flex: 1, fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  analiseModalContent: { padding: 20 },
  analiseItemTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  analiseDivider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 },
  analiseText: { fontSize: 14, fontFamily: 'Manrope', color: '#475569', lineHeight: 22 },
  analiseCloseButton: { backgroundColor: '#F1F5F9', margin: 20, padding: 12, borderRadius: 12, alignItems: 'center' },
  analiseCloseButtonText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B' },
  
  analiseSection: { backgroundColor: 'rgba(179, 103, 212, 0.05)', borderRadius: 16, padding: 16, marginTop: 20 },
  analiseSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  analiseSectionTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#B367D4' },
  analiseSectionText: { fontSize: 13, fontFamily: 'Manrope', color: '#475569', lineHeight: 20 },
  anotacaoDataModal: { fontSize: 12, fontFamily: 'Manrope', color: '#94A3B8', marginBottom: 16 },
  anotacaoTextoModal: { fontSize: 15, fontFamily: 'Manrope', color: '#0F172A', lineHeight: 22 },
  modalScrollContent: {
  padding: 20,
},
});

export default DashboardPaciente;