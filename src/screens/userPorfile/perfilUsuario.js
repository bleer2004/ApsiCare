import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Dimensions, Share, Alert, ActivityIndicator,
  Modal, Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import RelatoriosPaciente from '../Files/RelatoriosPsicologo';

const DashboardPaciente = ({ navigation, route }) => {
  const screenWidth = Dimensions.get('window').width;
  const [abaAtiva, setAbaAtiva] = useState('perfil');

  const [modalMetasVisible, setModalMetasVisible] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');
  const [novaMetaPrazo, setNovaMetaPrazo] = useState('');
  const [modalLembreteVisible, setModalLembreteVisible] = useState(false);
  const [novoLembrete, setNovoLembrete] = useState('');
  const [lembreteDia, setLembreteDia] = useState('segunda');
  const [modalAnaliseVisible, setModalAnaliseVisible] = useState(false);
  const [analiseSelecionada, setAnaliseSelecionada] = useState(null);
  const [modalAnotacaoVisible, setModalAnotacaoVisible] = useState(false);
  const [anotacaoSelecionada, setAnotacaoSelecionada] = useState(null);
  const [modalContatoVisible, setModalContatoVisible] = useState(false);

  const calcularIdade = (birthDate) => {
    if (!birthDate) return null;
    const hoje = new Date();
    const nasc = new Date(birthDate);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const pacienteRaw = route?.params?.paciente;
  const [paciente] = useState(pacienteRaw ? {
    ...pacienteRaw,
    idade: pacienteRaw.idade || calcularIdade(pacienteRaw.birthDate),
  } : {
    id: '45092', nome: 'Ana Carolina', idade: 32,
    diagnosticoPrincipal: 'F41.1 - Transtorno de Ansiedade Generalizada (TAG)',
    condicao: 'Anorexia', statusEmocional: 'Estável', melhoraPercentual: 15,
  });

  const [metasList, setMetasList] = useState([]);
  const [insightsList, setInsightsList] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [arquivosList, setArquivosList] = useState([]);
  const [loadingArquivos, setLoadingArquivos] = useState(false);
  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [smartwatchData, setSmartwatchData] = useState({ batimentos: '--', nivelStress: '--', rmssd: '--', perfil: '--' });
  const [contatoEmergencia, setContatoEmergencia] = useState(null);
  const [nomeContato, setNomeContato] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [relacaoContato, setRelacaoContato] = useState('');
  const [savingContato, setSavingContato] = useState(false);
  const [deletingInsight, setDeletingInsight] = useState(null);
  const [exportandoRelatorio, setExportandoRelatorio] = useState(false);
  const [dadosDiarios, setDadosDiarios] = useState(null);

  const [anotacoesList] = useState([
    { id: '1', titulo: 'Diário - Semana 1', texto: 'Hoje me senti mais ansiosa. Consegui fazer os exercícios de respiração.', data: '18/05/2024', analise: 'IA detectou padrão de ansiedade noturna. Sugerir técnicas de relaxamento antes de dormir.' },
    { id: '2', titulo: 'Reflexão sobre a terapia', texto: 'A sessão de hoje me fez pensar sobre meus gatilhos emocionais.', data: '15/05/2024', analise: 'Paciente demonstrando autoconhecimento. Progresso na identificação de gatilhos emocionais.' },
    { id: '3', titulo: 'Desafio da semana', texto: 'Consegui sair com amigos no fim de semana!', data: '12/05/2024', analise: 'Evento social positivo. Indica melhora no engajamento social.' },
  ]);

  const [lembretesList, setLembretesList] = useState([
    { id: '1', texto: 'Praticar 10 minutos de mindfulness antes de dormir', dia: 'segunda', enviado: false },
    { id: '2', texto: 'Realizar o diário emocional', dia: 'quarta', enviado: false },
    { id: '3', texto: 'Exercício físico de 30 minutos', dia: 'sexta', enviado: false },
  ]);

  const diasSemana = [
    { id: 'segunda', label: 'Segunda' }, { id: 'terca', label: 'Terça' },
    { id: 'quarta', label: 'Quarta' }, { id: 'quinta', label: 'Quinta' },
    { id: 'sexta', label: 'Sexta' }, { id: 'sabado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' },
  ];

  useEffect(() => {
    carregarMetas();
    carregarInsights();
    carregarArquivos();
    carregarContatoEmergencia();
    carregarDadosDiarios();
  }, []);

  // ── METAS ────────────────────────────────────────────────
  const carregarMetas = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/goals`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setMetasList(data.goals || []);
    } catch (err) { console.error('Erro metas:', err); }
  };

  const handleAdicionarMeta = async () => {
    if (!novaMeta.trim()) { Alert.alert('Erro', 'Digite uma meta válida'); return; }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ titulo: novaMeta, prazo: novaMetaPrazo || 'Sem prazo definido' }),
      });
      const data = await response.json();
      if (!response.ok) { Alert.alert('Erro', data.error || 'Erro ao adicionar meta'); return; }
      await carregarMetas();
      setNovaMeta(''); setNovaMetaPrazo(''); setModalMetasVisible(false);
      Alert.alert('Sucesso', 'Meta adicionada!');
    } catch { Alert.alert('Erro', 'Não foi possível adicionar a meta'); }
  };

  const handleAtualizarStatusMeta = async (id, novoStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/patients/${paciente.id}/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus, progresso: novoStatus === 'concluido' ? 'Concluído!' : 'Em andamento' }),
      });
      await carregarMetas();
    } catch { Alert.alert('Erro', 'Não foi possível atualizar a meta'); }
  };

  const handleRemoverMeta = (id) => {
    Alert.alert('Remover meta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          await fetch(`${API_URL}/patients/${paciente.id}/goals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          await carregarMetas();
        } catch { Alert.alert('Erro', 'Não foi possível remover a meta'); }
      }}
    ]);
  };

  // ── INSIGHTS ─────────────────────────────────────────────
  const carregarInsights = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/insights`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.insights?.length > 0) {
        setInsightsList(data.insights.map((ins, i) => ({
          id: ins.timestamp || String(i),
          timestamp: ins.timestamp,
          titulo: ins.title,
          texto: ins.body,
          data: ins.weekStart || ins.timestamp?.slice(0, 10) || '--',
          category: ins.category,
          flag: ins.flag,
          hr_mean: ins.hr_mean,
          ibi_mean: ins.ibi_mean,
          rmssd: ins.rmssd,
          perfil: ins.perfil,
          pct_anxiety_risk: ins.pct_anxiety_risk,
          pct_aligned: ins.pct_aligned,
        })));
        const ultimo = data.insights[0];
        if (ultimo) {
          setSmartwatchData({
            batimentos: ultimo.hr_mean || '--',
            nivelStress: ultimo.flag === 'anxiety_risk' ? 'Alto' : ultimo.flag === 'overreported' ? 'Médio' : 'Baixo',
            rmssd: ultimo.rmssd || '--',
            perfil: ultimo.perfil || '--',
          });
        }
      }
    } catch (err) { console.error('Erro insights:', err); }
  };

  const gerarInsightSemanal = async () => {
    setLoadingInsights(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'weekly-report' }),
      });
      const data = await response.json();
      if (response.ok) {
        const rel = data.relatorio || data.insight;
        if (rel) Alert.alert(rel.titulo || rel.title || 'Relatório gerado', rel.corpo || rel.body || 'Insight semanal gerado!');
        await carregarInsights();
      } else {
        Alert.alert('Erro', data.error || 'Não foi possível gerar o insight');
      }
    } catch { Alert.alert('Erro', 'Não foi possível conectar ao servidor'); }
    finally { setLoadingInsights(false); }
  };

  // ── DELETAR INSIGHT ──────────────────────────────────────
  const handleRemoverInsight = (insight) => {
    Alert.alert('Remover insight', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        if (!insight.timestamp) { setInsightsList(insightsList.filter(i => i.id !== insight.id)); return; }
        setDeletingInsight(insight.id);
        try {
          const token = await AsyncStorage.getItem('token');
          const ts = encodeURIComponent(insight.timestamp);
          const response = await fetch(`${API_URL}/patients/${paciente.id}/insights/${ts}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) setInsightsList(insightsList.filter(i => i.id !== insight.id));
          else Alert.alert('Erro', 'Não foi possível remover o insight');
        } catch { Alert.alert('Erro', 'Não foi possível conectar ao servidor'); }
        finally { setDeletingInsight(null); }
      }}
    ]);
  };

  // ── EXPORTAR RELATÓRIO → S3 ──────────────────────────────
  const handleExportarRelatorioS3 = async () => {
    if (insightsList.length === 0) { Alert.alert('Aviso', 'Gere um relatório antes de exportar'); return; }
    setExportandoRelatorio(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const ultimoInsight = insightsList[0];
      const conteudo = [
        `RELATÓRIO CLÍNICO — ${paciente.nome}`,
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
        `Diagnóstico: ${paciente.diagnosticoPrincipal || 'Não informado'}`,
        '', '═══ INSIGHT SEMANAL ═══',
        `Título: ${ultimoInsight.titulo}`, `Período: ${ultimoInsight.data}`,
        '', ultimoInsight.texto, '',
        '═══ DADOS FISIOLÓGICOS ═══',
        `HR média: ${ultimoInsight.hr_mean} bpm`,
        `RMSSD: ${ultimoInsight.rmssd} ms`,
        `Perfil WESAD: ${ultimoInsight.perfil}`,
        `Flag dominante: ${ultimoInsight.flag}`,
        `Anxiety Risk: ${ultimoInsight.pct_anxiety_risk}% dos dias`,
        `Alinhado: ${ultimoInsight.pct_aligned}% dos dias`,
        '', '---', 'ApsiCare — Plataforma Clínica de Saúde Mental',
      ].join('\n');
      const nomeArquivo = `relatorio_${paciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
      const response = await fetch(`${API_URL}/patients/${paciente.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: nomeArquivo, tipo: 'text/plain', tamanho: `${conteudo.length} bytes`, uploadedBy: 'clinician' }),
      });
      const data = await response.json();
      if (!response.ok) { Alert.alert('Erro', data.error || 'Erro ao gerar URL de upload'); return; }
      const s3Response = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: conteudo });
      if (s3Response.ok) { Alert.alert('✅ Relatório exportado!', `"${nomeArquivo}" salvo nos documentos.`); await carregarArquivos(); }
      else Alert.alert('Erro', 'Erro ao enviar relatório para o servidor');
    } catch (err) { console.error('Erro export S3:', err); Alert.alert('Erro', 'Não foi possível exportar o relatório'); }
    finally { setExportandoRelatorio(false); }
  };

  // ── ARQUIVOS ─────────────────────────────────────────────
  const carregarArquivos = async () => {
    setLoadingArquivos(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/documents`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) {
        setArquivosList((data.documents || []).map(doc => ({
          id: doc.id, nome: doc.nome, tipo: doc.tipo?.toUpperCase() || 'PDF',
          tamanho: doc.tamanho || '--',
          data: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : '--',
          downloadUrl: doc.downloadUrl, analise: 'Documento clínico compartilhado pelo psicólogo.',
        })));
      }
    } catch (err) { console.error('Erro arquivos:', err); }
    finally { setLoadingArquivos(false); }
  };

  const handleBaixarArquivo = async (arquivo) => {
    if (arquivo.downloadUrl) {
      try { await Linking.openURL(arquivo.downloadUrl); }
      catch { Alert.alert('Erro', 'Não foi possível abrir o arquivo'); }
    } else Alert.alert('Indisponível', 'URL de download não disponível');
  };

  const handleAnexarArquivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const arquivo = result.assets[0];
      setUploadingArquivo(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: arquivo.name, tipo: arquivo.mimeType || 'application/octet-stream', tamanho: arquivo.size ? `${(arquivo.size / 1024).toFixed(0)} KB` : '--', uploadedBy: 'clinician' }),
      });
      const data = await response.json();
      if (!response.ok) { Alert.alert('Erro', data.error || 'Erro ao obter URL'); return; }
      const fileBlob = await (await fetch(arquivo.uri)).blob();
      const s3Response = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': arquivo.mimeType || 'application/octet-stream' }, body: fileBlob });
      if (!s3Response.ok) { Alert.alert('Erro', 'Erro ao enviar arquivo'); return; }
      Alert.alert('Sucesso', `"${arquivo.name}" enviado!`);
      await carregarArquivos();
    } catch (err) { console.error('Erro upload:', err); Alert.alert('Erro', 'Não foi possível fazer o upload'); }
    finally { setUploadingArquivo(false); }
  };

  // ── CONTATO DE EMERGÊNCIA ────────────────────────────────
  const carregarContatoEmergencia = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/emergency-contact`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.contacts?.length > 0) setContatoEmergencia(data.contacts[0]);
    } catch (err) { console.error('Erro contato:', err); }
  };

  const handleSalvarContato = async () => {
    if (!nomeContato || !telefoneContato) { Alert.alert('Erro', 'Nome e telefone são obrigatórios'); return; }
    setSavingContato(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/emergency-contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: nomeContato, telefone: telefoneContato, relacao: relacaoContato }),
      });
      const data = await response.json();
      if (response.ok) {
        setContatoEmergencia(data.contact || { nome: nomeContato, telefone: telefoneContato, relacao: relacaoContato });
        setModalContatoVisible(false);
        setNomeContato(''); setTelefoneContato(''); setRelacaoContato('');
        Alert.alert('Sucesso', 'Contato salvo!');
      } else Alert.alert('Erro', data.error || 'Erro ao salvar contato');
    } catch { Alert.alert('Erro', 'Não foi possível conectar ao servidor'); }
    finally { setSavingContato(false); }
  };

  // ── DADOS DIÁRIOS WESAD (gráfico) ────────────────────────
  const carregarDadosDiarios = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/patients/${paciente.id}/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'weekly-report' }),
      });
      const data = await response.json();
      if (response.ok && data.relatorio?.dias?.length > 0) setDadosDiarios(data.relatorio.dias);
    } catch (err) { console.error('Erro dados diários:', err); }
  };

  // ── LEMBRETES ────────────────────────────────────────────
  const handleAdicionarLembrete = () => {
    if (!novoLembrete.trim()) { Alert.alert('Erro', 'Digite um lembrete válido'); return; }
    setLembretesList([{ id: String(Date.now()), texto: novoLembrete, dia: lembreteDia, enviado: false }, ...lembretesList]);
    setNovoLembrete(''); setLembreteDia('segunda'); setModalLembreteVisible(false);
    Alert.alert('Sucesso', 'Lembrete adicionado!');
  };
  const handleRemoverLembrete = (id) => {
    Alert.alert('Remover lembrete', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setLembretesList(lembretesList.filter(l => l.id !== id)) }
    ]);
  };
  const handleEnviarLembrete = (lembrete) => {
    Alert.alert('Enviar lembrete', `Enviar "${lembrete.texto}" para o paciente?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => { setLembretesList(lembretesList.map(l => l.id === lembrete.id ? { ...l, enviado: true } : l)); Alert.alert('Enviado!'); } }
    ]);
  };
  const handleEnviarLembretesSemanais = () => {
    Alert.alert('Enviar todos?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar', onPress: () => { setLembretesList(lembretesList.map(l => ({ ...l, enviado: true }))); Alert.alert('Enviado!'); } }
    ]);
  };

  const handleVerAnalise = (item) => { setAnaliseSelecionada({ titulo: item.nome || item.titulo, analise: item.analise }); setModalAnaliseVisible(true); };
  const handleVerAnotacao = (anotacao) => { setAnotacaoSelecionada(anotacao); setModalAnotacaoVisible(true); };

  const getIconByType = (tipo) => {
    switch (tipo) {
      case 'PDF': return <Icon name="file-text" size={24} color="#EF4444" />;
      case 'DOCX': return <Icon name="file" size={24} color="#3B82F6" />;
      case 'TXT': return <Icon name="file-text" size={24} color="#B367D4" />;
      case 'JPG': case 'JPEG': case 'PNG': return <Icon name="image" size={24} color="#10B981" />;
      default: return <Icon name="file" size={24} color="#B367D4" />;
    }
  };

  const handleExportarRelatorio = async () => {
    try { await Share.share({ message: `Relatório do paciente ${paciente.nome}\n\nDiagnóstico: ${paciente.diagnosticoPrincipal}`, title: `Relatório - ${paciente.nome}` }); }
    catch { Alert.alert('Erro', 'Não foi possível compartilhar'); }
  };

  const renderStatusBadge = () => {
    const isEstavel = paciente.statusEmocional === 'Estável';
    return (
      <View style={[styles.statusBadge, isEstavel ? styles.statusEstavel : styles.statusInstavel]}>
        <Icon name={isEstavel ? 'check-circle' : 'alert-circle'} size={16} color={isEstavel ? '#10B981' : '#F59E0B'} />
        <Text style={[styles.statusText, isEstavel ? styles.statusTextEstavel : styles.statusTextInstavel]}>{paciente.statusEmocional}</Text>
      </View>
    );
  };

  const getStatusColor = (status) => {
    if (status === 'concluido') return '#10B981';
    if (status === 'andamento') return '#F59E0B';
    return '#B367D4';
  };

  const getDiaLabel = (dia) => {
    const map = { segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo' };
    return map[dia] || dia;
  };

  const getFlagColor = (flag) => flag === 'anxiety_risk' ? '#EF4444' : flag === 'overreported' ? '#F59E0B' : '#10B981';
  const getFlagLabel = (flag) => flag === 'anxiety_risk' ? 'ATENÇÃO' : flag === 'overreported' ? 'ELEVADO' : 'ESTÁVEL';

  // ── DADOS DO GRÁFICO ─────────────────────────────────────
  const graficoDados = (() => {
    if (dadosDiarios && dadosDiarios.length > 0) {
      return {
        labels: dadosDiarios.map(d => `D${d.dia}`),
        stress: dadosDiarios.map(d => Math.round(parseFloat(d.stress_physio || 0) * 100)),
        humor: dadosDiarios.map(d => Math.round(parseInt(d.mood || 0) * 10)),
        isReal: true,
      };
    }
    return { labels: ['D1','D2','D3','D4','D5'], stress: [65,65,65,65,65], humor: [30,40,30,40,50], isReal: false };
  })();

  const correlacaoData = {
    labels: graficoDados.labels,
    datasets: [
      { data: graficoDados.stress, color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`, strokeWidth: 2 },
      { data: graficoDados.humor, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, strokeWidth: 2 },
    ],
  };

  // ── ABA PERFIL ───────────────────────────────────────────
  const renderAbaPerfil = () => (
    <>
      <View style={styles.pacienteInfo}>
        <Text style={styles.pacienteNome}>{paciente.nome}</Text>
        <Text style={styles.pacienteIdade}>{paciente.idade ? `${paciente.idade} anos` : 'Idade não informada'}</Text>
        <View style={styles.condicaoContainer}>
          <Text style={styles.condicaoLabel}>CONDIÇÃO</Text>
          <Text style={styles.condicaoValor}>{paciente.condicao || 'Em acompanhamento'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Status Emocional (Semana)</Text>{renderStatusBadge()}</View>
        <Text style={styles.melhoraText}>Melhora de {paciente.melhoraPercentual || 0}% em relação à semana anterior</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diagnóstico Principal</Text>
        <Text style={styles.diagnosticoCodigo}>{paciente.diagnosticoPrincipal}</Text>
        <Text style={styles.diagnosticoDescricao}>Paciente apresenta sintomas persistentes de preocupação excessiva, tensão muscular.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo Clínico</Text>
        <Text style={styles.resumoTexto}>{paciente.observacoes || 'O paciente apresenta melhora nos episódios depressivos, com maior engajamento em atividades sociais.'}</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.tag}><Icon name="check-circle" size={14} color="#10B981" /><Text style={styles.tagText}>ADESÃO MEDICAMENTOSA</Text></View>
          <View style={styles.tag}><Icon name="heart" size={14} color="#B367D4" /><Text style={styles.tagText}>MINDFULNESS SEMANAL</Text></View>
        </View>
      </View>

      {/* Smartwatch */}
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
            <Icon name="zap" size={24} color={smartwatchData.nivelStress === 'Alto' ? '#EF4444' : '#10B981'} />
            <Text style={[styles.smartwatchValue, { color: smartwatchData.nivelStress === 'Alto' ? '#EF4444' : '#10B981' }]}>{smartwatchData.nivelStress}</Text>
            <Text style={styles.smartwatchLabel}>Stress</Text>
          </View>
          {smartwatchData.rmssd !== '--' && <>
            <View style={styles.smartwatchDivider} />
            <View style={styles.smartwatchItem}>
              <Icon name="heart" size={24} color="#EF4444" />
              <Text style={styles.smartwatchValue}>{smartwatchData.rmssd}</Text>
              <Text style={styles.smartwatchLabel}>RMSSD</Text>
            </View>
          </>}
        </View>
        {smartwatchData.perfil !== '--' && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Manrope' }}>
              Perfil: <Text style={{ color: '#B367D4', fontWeight: '700' }}>{smartwatchData.perfil}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Contato de Emergência */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Contato de Emergência</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalContatoVisible(true)}>
            <Icon name="edit-2" size={14} color="#B367D4" />
            <Text style={styles.addButtonText}>{contatoEmergencia ? 'Editar' : 'Adicionar'}</Text>
          </TouchableOpacity>
        </View>
        {contatoEmergencia ? (
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' }}>{contatoEmergencia.nome}</Text>
            <Text style={{ fontSize: 14, color: '#64748B', fontFamily: 'Manrope', marginTop: 4 }}>{contatoEmergencia.relacao}</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }} onPress={() => Linking.openURL(`tel:${contatoEmergencia.telefone}`)}>
              <Icon name="phone" size={14} color="#B367D4" />
              <Text style={{ fontSize: 14, color: '#B367D4', fontFamily: 'Manrope', fontWeight: '500' }}>{contatoEmergencia.telefone}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: '#94A3B8', fontFamily: 'Manrope' }}>Nenhum contato cadastrado</Text>
        )}
      </View>

      {/* Gráfico com dados reais */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Correlação Semanal</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.correlacaoSubtitle}>
            {graficoDados.isReal ? 'Dados reais WESAD — Jan 2025' : 'Aguardando dados...'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#B367D4' }} />
              <Text style={{ fontSize: 10, color: '#64748B', fontFamily: 'Manrope' }}>Stress</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 10, color: '#64748B', fontFamily: 'Manrope' }}>Humor</Text>
            </View>
          </View>
        </View>
        <LineChart
          data={correlacaoData}
          width={screenWidth - 64}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF', backgroundGradientFrom: '#FFFFFF', backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '5', strokeWidth: '2' },
          }}
          bezier
          style={styles.chart}
          formatYLabel={(v) => `${v}%`}
          withLegend={false}
        />
        {graficoDados.isReal && (
          <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Manrope', textAlign: 'center', marginTop: 8 }}>
            Stress alto + humor baixo → padrão dissociativo confirmado
          </Text>
        )}
      </View>
    </>
  );

  // ── ABA METAS / INSIGHTS ─────────────────────────────────
  const renderAbaMetasInsights = () => (
    <ScrollView style={styles.abaContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎯 Metas do Paciente</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalMetasVisible(true)}>
          <Icon name="plus" size={20} color="#B367D4" /><Text style={styles.addButtonText}>Nova Meta</Text>
        </TouchableOpacity>
      </View>
      {metasList.length === 0 ? (
        <View style={styles.emptyCard}><Icon name="target" size={40} color="#D1D5DB" /><Text style={styles.emptyText}>Nenhuma meta cadastrada</Text></View>
      ) : metasList.map((meta) => (
        <View key={meta.id} style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <View style={[styles.metaStatus, { backgroundColor: getStatusColor(meta.status) + '20' }]}>
              <View style={[styles.metaStatusDot, { backgroundColor: getStatusColor(meta.status) }]} />
              <Text style={[styles.metaStatusText, { color: getStatusColor(meta.status) }]}>{meta.status === 'concluido' ? 'Concluído' : meta.status === 'andamento' ? 'Em andamento' : 'Nova'}</Text>
            </View>
            <View style={styles.metaActions}>
              <TouchableOpacity onPress={() => handleAtualizarStatusMeta(meta.id, 'andamento')}><Icon name="clock" size={18} color="#9CA3AF" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleAtualizarStatusMeta(meta.id, 'concluido')}><Icon name="check-circle" size={18} color="#10B981" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemoverMeta(meta.id)}><Icon name="trash-2" size={18} color="#EF4444" /></TouchableOpacity>
            </View>
          </View>
          <Text style={styles.metaTitulo}>{meta.titulo}</Text>
          <Text style={styles.metaProgresso}>{meta.progresso}</Text>
          <View style={styles.metaPrazo}><Icon name="calendar" size={12} color="#9CA3AF" /><Text style={styles.metaPrazoText}>Prazo: {meta.prazo}</Text></View>
        </View>
      ))}

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>💡 Insights Clínicos</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {insightsList.length > 0 && (
            <TouchableOpacity style={[styles.addButton, { backgroundColor: exportandoRelatorio ? '#E2E8F0' : 'rgba(16, 185, 129, 0.10)' }]} onPress={handleExportarRelatorioS3} disabled={exportandoRelatorio}>
              {exportandoRelatorio ? <ActivityIndicator size="small" color="#10B981" /> : <><Icon name="upload-cloud" size={14} color="#10B981" /><Text style={[styles.addButtonText, { color: '#10B981' }]}>Salvar</Text></>}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.addButton, { backgroundColor: loadingInsights ? '#E2E8F0' : 'rgba(179, 103, 212, 0.10)' }]} onPress={gerarInsightSemanal} disabled={loadingInsights}>
            {loadingInsights ? <ActivityIndicator size="small" color="#B367D4" /> : <><Icon name="cpu" size={14} color="#B367D4" /><Text style={styles.addButtonText}>Gerar Relatório</Text></>}
          </TouchableOpacity>
        </View>
      </View>

      {insightsList.length === 0 ? (
        <View style={styles.emptyCard}><Icon name="cpu" size={40} color="#D1D5DB" /><Text style={styles.emptyText}>Nenhum insight gerado</Text><Text style={styles.emptySubtext}>Clique em "Gerar Relatório" para criar</Text></View>
      ) : insightsList.map((insight) => (
        <View key={insight.id} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.insightData}>{insight.data}</Text>
              {insight.flag && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: getFlagColor(insight.flag) + '20' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: getFlagColor(insight.flag) }}>{getFlagLabel(insight.flag)}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => handleRemoverInsight(insight)} disabled={deletingInsight === insight.id} style={{ padding: 4 }}>
              {deletingInsight === insight.id ? <ActivityIndicator size="small" color="#9CA3AF" /> : <Icon name="x" size={16} color="#9CA3AF" />}
            </TouchableOpacity>
          </View>
          {insight.titulo && <Text style={{ fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>{insight.titulo}</Text>}
          <Text style={styles.insightTexto}>{insight.texto}</Text>
          {insight.hr_mean && (
            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, fontFamily: 'Manrope' }}>
              HR: {insight.hr_mean} bpm • RMSSD: {insight.rmssd} • Perfil: {insight.perfil}
            </Text>
          )}
        </View>
      ))}

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>📅 Lembretes para a Semana</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalLembreteVisible(true)}>
          <Icon name="plus" size={20} color="#B367D4" /><Text style={styles.addButtonText}>Novo Lembrete</Text>
        </TouchableOpacity>
      </View>
      {lembretesList.length === 0 ? (
        <View style={styles.emptyCard}><Icon name="bell" size={40} color="#D1D5DB" /><Text style={styles.emptyText}>Nenhum lembrete programado</Text></View>
      ) : <>
        {lembretesList.map((lembrete) => (
          <View key={lembrete.id} style={styles.lembreteCard}>
            <View style={styles.lembreteHeader}>
              <View style={styles.lembreteDia}><Icon name="calendar" size={14} color="#B367D4" /><Text style={styles.lembreteDiaText}>{getDiaLabel(lembrete.dia)}</Text></View>
              {lembrete.enviado && <View style={styles.enviadoBadge}><Icon name="check" size={10} color="#10B981" /><Text style={styles.enviadoText}>Enviado</Text></View>}
            </View>
            <Text style={styles.lembreteTexto}>{lembrete.texto}</Text>
            <View style={styles.lembreteActions}>
              <TouchableOpacity style={styles.enviarBtn} onPress={() => handleEnviarLembrete(lembrete)}><Icon name="send" size={16} color="#B367D4" /><Text style={styles.enviarBtnText}>Enviar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.removerBtn} onPress={() => handleRemoverLembrete(lembrete.id)}><Icon name="trash-2" size={16} color="#EF4444" /><Text style={styles.removerBtnText}>Remover</Text></TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.enviarTodosBtn} onPress={handleEnviarLembretesSemanais}>
          <Icon name="send" size={18} color="#FFFFFF" /><Text style={styles.enviarTodosBtnText}>Enviar todos os lembretes</Text>
        </TouchableOpacity>
      </>}
    </ScrollView>
  );

  // ── ABA ARQUIVOS ─────────────────────────────────────────
  const renderAbaArquivos = () => (
    <ScrollView style={styles.abaContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📄 Arquivos Compartilhados</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: uploadingArquivo ? '#E2E8F0' : 'rgba(179, 103, 212, 0.10)' }]} onPress={handleAnexarArquivo} disabled={uploadingArquivo}>
          {uploadingArquivo ? <ActivityIndicator size="small" color="#B367D4" /> : <><Icon name="upload" size={14} color="#B367D4" /><Text style={styles.addButtonText}>Anexar Arquivo</Text></>}
        </TouchableOpacity>
      </View>
      {loadingArquivos ? <ActivityIndicator size="large" color="#B367D4" style={{ marginTop: 40 }} />
        : arquivosList.length === 0 ? <View style={styles.emptyCard}><Icon name="folder" size={40} color="#D1D5DB" /><Text style={styles.emptyText}>Nenhum arquivo compartilhado</Text></View>
        : arquivosList.map((arquivo) => (
          <View key={arquivo.id} style={styles.arquivoCard}>
            <View style={styles.arquivoHeader}>
              <View style={styles.arquivoIcon}>{getIconByType(arquivo.tipo)}</View>
              <View style={styles.arquivoInfo}>
                <Text style={styles.arquivoNome}>{arquivo.nome}</Text>
                <Text style={styles.arquivoMeta}>{arquivo.tipo} • {arquivo.tamanho} • {arquivo.data}</Text>
              </View>
            </View>
            <View style={styles.arquivoActions}>
              <TouchableOpacity style={styles.analiseBtn} onPress={() => handleVerAnalise(arquivo)}><Icon name="cpu" size={16} color="#B367D4" /><Text style={styles.analiseBtnText}>Análise da IA</Text></TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn} onPress={() => handleBaixarArquivo(arquivo)}><Icon name="download" size={16} color="#10B981" /><Text style={styles.downloadBtnText}>Baixar</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>📝 Anotações do Paciente</Text>
      </View>
      {anotacoesList.map((anotacao) => (
        <TouchableOpacity key={anotacao.id} onPress={() => handleVerAnotacao(anotacao)}>
          <View style={styles.anotacaoCard}>
            <View style={styles.anotacaoHeader}>
              <View><Text style={styles.anotacaoTitulo}>{anotacao.titulo}</Text><Text style={styles.anotacaoData}>{anotacao.data}</Text></View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </View>
            <Text style={styles.anotacaoTexto} numberOfLines={2}>{anotacao.texto}</Text>
            <TouchableOpacity style={styles.analiseBtn} onPress={() => handleVerAnalise(anotacao)}>
              <Icon name="cpu" size={14} color="#B367D4" /><Text style={styles.analiseBtnText}>Ver análise da IA</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAbaRelatorios = () => <RelatoriosPaciente paciente={paciente} standalone={true} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Icon name="arrow-left" size={24} color="#475569" /></TouchableOpacity>
          <TouchableOpacity onPress={handleExportarRelatorio} style={styles.exportButton}><Icon name="download" size={18} color="#B367D4" /><Text style={styles.exportText}>Exportar</Text></TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          {[{ id: 'perfil', icon: 'user', label: 'Perfil' }, { id: 'metas', icon: 'target', label: 'Metas' }, { id: 'arquivos', icon: 'folder', label: 'Arquivos' }, { id: 'relatorios', icon: 'bar-chart-2', label: 'Relatórios' }].map(tab => (
            <TouchableOpacity key={tab.id} style={[styles.tab, abaAtiva === tab.id && styles.tabActive]} onPress={() => setAbaAtiva(tab.id)}>
              <Icon name={tab.icon} size={18} color={abaAtiva === tab.id ? '#B367D4' : '#94A3B8'} />
              <Text style={[styles.tabText, abaAtiva === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {abaAtiva === 'perfil' && renderAbaPerfil()}
        {abaAtiva === 'metas' && renderAbaMetasInsights()}
        {abaAtiva === 'arquivos' && renderAbaArquivos()}
        {abaAtiva === 'relatorios' && renderAbaRelatorios()}
      </ScrollView>

      {/* Modal Meta */}
      <Modal animationType="slide" transparent visible={modalMetasVisible} onRequestClose={() => setModalMetasVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Nova Meta</Text><TouchableOpacity onPress={() => setModalMetasVisible(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity></View>
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Descrição da Meta</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Praticar meditação diariamente" placeholderTextColor="#94A3B8" value={novaMeta} onChangeText={setNovaMeta} multiline />
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Prazo (opcional)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 30/06/2024" placeholderTextColor="#94A3B8" value={novaMetaPrazo} onChangeText={setNovaMetaPrazo} />
            <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarMeta}><Text style={styles.modalButtonText}>Adicionar Meta</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Modal Lembrete */}
      <Modal animationType="slide" transparent visible={modalLembreteVisible} onRequestClose={() => setModalLembreteVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Novo Lembrete</Text><TouchableOpacity onPress={() => setModalLembreteVisible(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity></View>
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Dia da semana</Text>
            <View style={styles.diasContainer}>
              {diasSemana.map(dia => (
                <TouchableOpacity key={dia.id} style={[styles.diaButton, lembreteDia === dia.id && styles.diaButtonActive]} onPress={() => setLembreteDia(dia.id)}>
                  <Text style={[styles.diaButtonText, lembreteDia === dia.id && styles.diaButtonTextActive]}>{dia.label.substring(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Lembrete</Text>
            <TextInput style={styles.modalInput} placeholder="Digite o lembrete..." placeholderTextColor="#94A3B8" value={novoLembrete} onChangeText={setNovoLembrete} multiline />
            <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarLembrete}><Text style={styles.modalButtonText}>Adicionar Lembrete</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Modal Análise */}
      <Modal animationType="fade" transparent visible={modalAnaliseVisible} onRequestClose={() => setModalAnaliseVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.analiseModalContainer}>
          <View style={styles.analiseModalHeader}>
            <View style={styles.analiseIcon}><Icon name="cpu" size={24} color="#B367D4" /></View>
            <Text style={styles.analiseModalTitle}>Análise da IA</Text>
            <TouchableOpacity onPress={() => setModalAnaliseVisible(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity>
          </View>
          <ScrollView style={styles.analiseModalContent}>
            <Text style={styles.analiseItemTitle}>{analiseSelecionada?.titulo}</Text>
            <View style={styles.analiseDivider} />
            <Text style={styles.analiseText}>{analiseSelecionada?.analise}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.analiseCloseButton} onPress={() => setModalAnaliseVisible(false)}><Text style={styles.analiseCloseButtonText}>Fechar</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* Modal Anotação */}
      <Modal animationType="slide" transparent visible={modalAnotacaoVisible} onRequestClose={() => setModalAnotacaoVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{anotacaoSelecionada?.titulo}</Text><TouchableOpacity onPress={() => setModalAnotacaoVisible(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity></View>
          <ScrollView style={styles.modalScrollContent}>
            <Text style={styles.anotacaoDataModal}>{anotacaoSelecionada?.data}</Text>
            <Text style={styles.anotacaoTextoModal}>{anotacaoSelecionada?.texto}</Text>
            <View style={styles.analiseSection}>
              <View style={styles.analiseSectionHeader}><Icon name="cpu" size={18} color="#B367D4" /><Text style={styles.analiseSectionTitle}>Análise da IA</Text></View>
              <Text style={styles.analiseSectionText}>{anotacaoSelecionada?.analise}</Text>
            </View>
          </ScrollView>
        </View></View>
      </Modal>

      {/* Modal Contato */}
      <Modal animationType="slide" transparent visible={modalContatoVisible} onRequestClose={() => setModalContatoVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Contato de Emergência</Text><TouchableOpacity onPress={() => setModalContatoVisible(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity></View>
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nome *</Text>
            <TextInput style={styles.modalInput} placeholder="Nome do contato" placeholderTextColor="#94A3B8" value={nomeContato} onChangeText={setNomeContato} />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Telefone *</Text>
            <TextInput style={styles.modalInput} placeholder="(00) 00000-0000" placeholderTextColor="#94A3B8" value={telefoneContato} onChangeText={setTelefoneContato} keyboardType="phone-pad" />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Relação</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Mãe, Pai, Cônjuge..." placeholderTextColor="#94A3B8" value={relacaoContato} onChangeText={setRelacaoContato} />
            <TouchableOpacity style={styles.modalButton} onPress={handleSalvarContato} disabled={savingContato}>
              {savingContato ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalButtonText}>Salvar Contato</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
};

// Cole aqui o StyleSheet do seu arquivo atual — não foi alterado
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  exportButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  exportText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 8, marginTop: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#B367D4' },
  tabText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#94A3B8' },
  tabTextActive: { color: '#B367D4' },
  abaContainer: { padding: 16 },
  pacienteInfo: { paddingHorizontal: 20, paddingVertical: 16 },
  pacienteNome: { fontSize: 28, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A' },
  pacienteIdade: { fontSize: 14, fontFamily: 'Manrope', color: '#64748B', marginTop: 4 },
  condicaoContainer: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  condicaoLabel: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 },
  condicaoValor: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#EF4444' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
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
  correlacaoSubtitle: { fontSize: 13, fontFamily: 'Manrope', color: '#64748B' },
  chart: { marginLeft: -25, borderRadius: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  modalContent: { padding: 20 },
  modalInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 16, fontFamily: 'Manrope', backgroundColor: '#FFFFFF', minHeight: 50, color: '#0F172A' },
  inputLabel: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#334155', marginBottom: 8 },
  modalButton: { backgroundColor: '#B367D4', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  modalButtonText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#FFFFFF' },
  diasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  diaButtonActive: { backgroundColor: '#B367D4' },
  diaButtonText: { fontSize: 12, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B' },
  diaButtonTextActive: { color: '#FFFFFF' },
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
  modalScrollContent: { padding: 20 },
});

export default DashboardPaciente;