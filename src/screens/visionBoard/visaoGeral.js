import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, FlatList, Modal, Linking, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import BottomNav from '../../components/BottomNav';

const VisaoGeral = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [modalContatoVisible, setModalContatoVisible] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [telaUrgencias, setTelaUrgencias] = useState(false);

  // Dados reais do paciente com wesadId (Laura)
  const [dadosWesad, setDadosWesad] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/clinicians/${user.id}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const ps = (data.patients || []).map(p => ({
          id: p.id || p.patientId,
          nome: p.name,
          email: p.email,
          birthDate: p.birthDate,
          diagnosticoPrincipal: p.diagnostico || 'Aguardando diagnóstico',
          condicao: 'Em acompanhamento',
          statusEmocional: 'Estável',
          melhoraPercentual: 0,
          isActive: p.isActive,
        }));
        setPacientes(ps);

        // Busca o último insight do primeiro paciente com wesadId para mostrar BPM real
        if (ps.length > 0) {
          carregarUltimoInsight(ps[0].id, token);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarUltimoInsight = async (patientId, token) => {
    try {
      const response = await fetch(`${API_URL}/patients/${patientId}/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.insights?.length > 0) {
        const ultimo = data.insights[0];
        setDadosWesad({
          patientId,
          hr_mean: ultimo.hr_mean,
          rmssd: ultimo.rmssd,
          perfil: ultimo.perfil,
          flag: ultimo.flag,
          nivelStress: ultimo.flag === 'anxiety_risk' ? 'Alto' : ultimo.flag === 'overreported' ? 'Médio' : 'Baixo',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar insight:', err);
    }
  };

  // Cards mock de atenção — mantidos visualmente + Laura aparece como real
  const pacientesAtencao = useMemo(() => {
    const mockCards = [
      { id: 'mock1', nome: 'Ana Clara Souza', tipo: 'CRÍTICO', descricao: 'Queda brusca no humor (Score -40%)', tempo: '12 minutos', origem: 'Relatado via App Diário', cor: '#DC2626', corBg: '#FEE2E2', icon: 'alert-triangle', telefone: '+5511999990001', pacienteCompleto: null },
      { id: 'mock2', nome: 'Marcos Oliveira', tipo: 'TENDÊNCIA', descricao: 'Isolamento social detectado (3 dias)', tempo: '2 horas', origem: 'Inatividade em grupos', cor: '#D97706', corBg: '#FEF3C7', icon: 'trending-up', telefone: '+5511999990002', pacienteCompleto: null },
    ];

    // Adiciona pacientes reais com dados WESAD como alerta real
    const reaisComWesad = pacientes.slice(0, 1).map((p, i) => ({
      id: p.id,
      nome: p.nome,
      tipo: dadosWesad?.flag === 'anxiety_risk' ? 'CRÍTICO' : 'TENDÊNCIA',
      descricao: dadosWesad
        ? `HR ${dadosWesad.hr_mean} bpm • Stress ${dadosWesad.nivelStress} • Perfil ${dadosWesad.perfil}`
        : 'Dados fisiológicos disponíveis',
      tempo: 'Atualizado hoje',
      origem: 'Dataset WESAD — Samsung Health',
      cor: dadosWesad?.flag === 'anxiety_risk' ? '#DC2626' : '#D97706',
      corBg: dadosWesad?.flag === 'anxiety_risk' ? '#FEE2E2' : '#FEF3C7',
      icon: dadosWesad?.flag === 'anxiety_risk' ? 'alert-triangle' : 'activity',
      telefone: p.email,
      pacienteCompleto: p,
      isReal: true,
      dadosWesad,
    }));

    return [...reaisComWesad, ...mockCards];
  }, [pacientes, dadosWesad]);

  const pacientesUrgencias = [
    { id: 'u1', nome: 'Mariana Lopes', motivo: 'Queda de humor superior a 50% em 48h', detalhe: 'Score caiu de 80 para 32 entre segunda e quarta-feira.', tipo: 'piora', tempo: 'Detectado há 1 dia' },
    { id: 'u2', nome: 'Pedro Henrique', motivo: 'Ligou para emergência (CVV)', detalhe: 'Registro de contato com linha de crise em 20/05/2025.', tipo: 'emergencia', tempo: 'Há 4 dias' },
    { id: 'u3', nome: 'Julia Santos', motivo: 'Piora progressiva nas últimas 2 semanas', detalhe: 'Relatórios diários indicam deterioração contínua.', tipo: 'piora', tempo: 'Detectado há 2 dias' },
    { id: 'u4', nome: 'Carlos Ferreira', motivo: 'Ligou para SAMU — episódio de pânico', detalhe: 'Ocorrência registrada em 22/05/2025.', tipo: 'emergencia', tempo: 'Há 2 dias' },
  ];

  const tendenciaPiora = useMemo(() => {
    return pacientes.length > 0
      ? pacientes.slice(0, 3).map(p => p.nome.split(' ')[0])
      : ['Mariana L.', 'Pedro H.', 'Julia S.'];
  }, [pacientes]);

  const pacientesFiltrados = useMemo(() => {
    if (filtroAtivo === 'todos') return pacientesAtencao;
    if (filtroAtivo === 'critico') return pacientesAtencao.filter(p => p.tipo === 'CRÍTICO');
    if (filtroAtivo === 'tendencia') return pacientesAtencao.filter(p => p.tipo === 'TENDÊNCIA');
    return pacientesAtencao;
  }, [filtroAtivo, pacientesAtencao]);

  const handleVerProntuario = (item) => {
    if (item.pacienteCompleto) {
      navigation.navigate('DashboardPaciente', { paciente: item.pacienteCompleto });
    } else {
      Alert.alert('Prontuário', `Ver prontuário de ${item.nome} (dados demonstrativos)`);
    }
  };

  const handleContatar = (item) => { setPacienteSelecionado(item); setModalContatoVisible(true); };

  const confirmarLigacao = () => {
    setModalContatoVisible(false);
    if (pacienteSelecionado?.telefone) {
      Linking.openURL(`tel:${pacienteSelecionado.telefone}`).catch(() =>
        Alert.alert('Erro', 'Não foi possível iniciar a chamada.')
      );
    }
  };

  const renderUrgenciaCard = ({ item }) => {
    const isEmergencia = item.tipo === 'emergencia';
    return (
      <View style={[styles.urgCardWrapper, isEmergencia ? styles.urgCardEmergencia : styles.urgCardPiora]}>
        <View style={styles.urgCardLeft}>
          <View style={[styles.urgCardIconBg, isEmergencia ? styles.urgIconBgRed : styles.urgIconBgAmber]}>
            <Icon name={isEmergencia ? 'phone-call' : 'trending-down'} size={18} color="#fff" />
          </View>
        </View>
        <View style={styles.urgCardBody}>
          <View style={styles.urgCardTitleRow}>
            <Text style={styles.urgCardNome}>{item.nome}</Text>
            <View style={[styles.urgTipoBadge, isEmergencia ? styles.urgBadgeRed : styles.urgBadgeAmber]}>
              <Text style={[styles.urgTipoBadgeText, isEmergencia ? styles.urgBadgeTextRed : styles.urgBadgeTextAmber]}>
                {isEmergencia ? 'Emergência' : 'Piora'}
              </Text>
            </View>
          </View>
          <Text style={styles.urgCardMotivo}>{item.motivo}</Text>
          <Text style={styles.urgCardDetalhe}>{item.detalhe}</Text>
          <Text style={styles.urgCardTempo}>{item.tempo}</Text>
        </View>
      </View>
    );
  };

  if (telaUrgencias) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
        <View style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => setTelaUrgencias(false)}>
              <Icon name="arrow-left" size={20} color="#B367D4" />
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <Icon name="alert-triangle" size={20} color="#DC2626" />
              <Text style={styles.headerTitle}>Urgências</Text>
            </View>
          </View>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <View style={styles.urgLegendaRow}>
            <View style={styles.urgLegendaItem}><View style={[styles.urgLegendaDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.urgLegendaText}>Ligou para emergência (7 dias)</Text></View>
            <View style={styles.urgLegendaItem}><View style={[styles.urgLegendaDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.urgLegendaText}>Piora significativa</Text></View>
          </View>
          <FlatList data={pacientesUrgencias} keyExtractor={item => item.id} renderItem={renderUrgenciaCard} scrollEnabled={false} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} />
        </ScrollView>
        <BottomNav navigation={navigation} currentScreen="VisaoGeral" />
      </SafeAreaView>
    );
  }

  const renderPacienteCard = ({ item }) => (
    <View style={[styles.alertCard, item.tipo === 'CRÍTICO' ? styles.criticalCard : styles.trendCard]}>
      <View style={styles.alertCardHeader}>
        <View style={[styles.avatar, item.tipo === 'CRÍTICO' ? styles.criticalAvatar : styles.trendAvatar]}>
          <Icon name="user" size={28} color="#94A3B8" />
        </View>
        <View style={styles.alertCardInfo}>
          <View style={styles.alertCardNameRow}>
            <Text style={styles.alertCardName}>{item.nome}</Text>
            <View style={styles.alertCardBadgeRow}>
              <View style={[styles.criticalBadge, { backgroundColor: item.corBg }]}>
                <Text style={[styles.criticalBadgeText, { color: item.cor }]}>{item.tipo}</Text>
              </View>
            </View>
          </View>

          {/* Dados WESAD em destaque para paciente real */}
          {item.isReal && item.dadosWesad && (
            <View style={styles.wesadRow}>
              <View style={styles.wesadChip}>
                <Icon name="activity" size={12} color="#B367D4" />
                <Text style={styles.wesadChipText}>{item.dadosWesad.hr_mean} bpm</Text>
              </View>
              <View style={styles.wesadChip}>
                <Icon name="zap" size={12} color={item.dadosWesad.nivelStress === 'Alto' ? '#EF4444' : '#10B981'} />
                <Text style={[styles.wesadChipText, { color: item.dadosWesad.nivelStress === 'Alto' ? '#EF4444' : '#10B981' }]}>{item.dadosWesad.nivelStress}</Text>
              </View>
              <View style={styles.wesadChip}>
                <Icon name="heart" size={12} color="#64748B" />
                <Text style={styles.wesadChipText}>{item.dadosWesad.rmssd} ms</Text>
              </View>
            </View>
          )}

          <View style={styles.alertMessageRow}>
            <Icon name={item.icon === 'alert-triangle' ? 'alert-triangle' : item.icon === 'activity' ? 'activity' : 'trending-up'} size={14} color={item.cor} />
            <Text style={[styles.criticalMessageText, { color: item.cor }]}>{item.descricao}</Text>
          </View>
          <Text style={styles.alertMeta}>Emitido há {item.tempo} • {item.origem}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleVerProntuario(item)}>
              <Text style={styles.primaryButtonText}>Ver Prontuário</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleContatar(item)}>
              <Icon name={item.tipo === 'CRÍTICO' ? 'message-circle' : 'phone'} size={14} color="#B367D4" />
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
      <View style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="activity" size={20} color="#B367D4" />
            <Text style={styles.headerTitle}>Visão geral</Text>
          </View>
        </View>
      </View>

      <Modal transparent visible={modalContatoVisible} animationType="fade" onRequestClose={() => setModalContatoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}><Icon name="phone" size={28} color="#B367D4" /></View>
            <Text style={styles.modalTitle}>Ligar para o paciente?</Text>
            <Text style={styles.modalSubtitle}>Deseja iniciar uma ligação para <Text style={{ fontWeight: '700' }}>{pacienteSelecionado?.nome}</Text>?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalContatoVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCallBtn} onPress={confirmarLigacao}>
                <Icon name="phone" size={16} color="#fff" /><Text style={styles.modalCallText}>Ligar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={[styles.filterChip, filtroAtivo === 'todos' ? styles.filterChipActive : styles.filterChipOutline]} onPress={() => setFiltroAtivo('todos')}>
            <Text style={filtroAtivo === 'todos' ? styles.filterChipTextActive : styles.filterChipOutlineText}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={filtroAtivo === 'critico' ? styles.filterChipCritico : styles.filterChipOutline} onPress={() => setFiltroAtivo(filtroAtivo === 'critico' ? 'todos' : 'critico')}>
            <Icon name="alert-circle" size={16} color={filtroAtivo === 'critico' ? '#fff' : '#EF4444'} />
            <Text style={filtroAtivo === 'critico' ? styles.filterChipTextActive : styles.filterChipOutlineText}>Críticos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={filtroAtivo === 'tendencia' ? styles.filterChipTendencia : styles.filterChipOutline} onPress={() => setFiltroAtivo(filtroAtivo === 'tendencia' ? 'todos' : 'tendencia')}>
            <Icon name="trending-up" size={16} color={filtroAtivo === 'tendencia' ? '#fff' : '#F59E0B'} />
            <Text style={filtroAtivo === 'tendencia' ? styles.filterChipTextActive : styles.filterChipOutlineText}>Tendência</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Humor Geral dos Pacientes</Text>
          <View style={styles.chartPeriodContainer}>
            {['dia', 'semana', 'mes', 'ano'].map(p => (
              <TouchableOpacity key={p} style={[styles.periodButton, selectedPeriod === p && styles.periodButtonActive]} onPress={() => setSelectedPeriod(p)}>
                <Text style={[styles.periodButtonText, selectedPeriod === p && styles.periodButtonTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chartBarsContainer}>
            {[115, 144, 77, 106, 173, 125, 134].map((h, i) => (
              i === 4
                ? <View key={i} style={[styles.chartBarGreen, { height: h }]}><View style={styles.chartTooltip}><Text style={styles.chartTooltipText}>78%</Text></View></View>
                : <View key={i} style={[styles.chartBar, { height: h }]} />
            ))}
          </View>
          <View style={styles.chartLabels}>
            {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Hoje', 'Sem 6', 'Sem 7'].map(label => (
              <Text key={label} style={[styles.chartLabel, label === 'Hoje' && styles.chartLabelActive]}>{label}</Text>
            ))}
          </View>
        </View>

        {/* BPM real da Laura */}
        {dadosWesad && (
          <View style={styles.wesadSummaryCard}>
            <View style={styles.wesadSummaryHeader}>
              <Icon name="watch" size={16} color="#B367D4" />
              <Text style={styles.wesadSummaryTitle}>Dados Fisiológicos — {pacientes[0]?.nome}</Text>
            </View>
            <View style={styles.wesadSummaryRow}>
              <View style={styles.wesadSummaryItem}>
                <Icon name="activity" size={20} color="#B367D4" />
                <Text style={styles.wesadSummaryValue}>{dadosWesad.hr_mean}</Text>
                <Text style={styles.wesadSummaryLabel}>BPM</Text>
              </View>
              <View style={styles.wesadSummaryDivider} />
              <View style={styles.wesadSummaryItem}>
                <Icon name="zap" size={20} color={dadosWesad.nivelStress === 'Alto' ? '#EF4444' : '#10B981'} />
                <Text style={[styles.wesadSummaryValue, { color: dadosWesad.nivelStress === 'Alto' ? '#EF4444' : '#10B981' }]}>{dadosWesad.nivelStress}</Text>
                <Text style={styles.wesadSummaryLabel}>Stress</Text>
              </View>
              <View style={styles.wesadSummaryDivider} />
              <View style={styles.wesadSummaryItem}>
                <Icon name="heart" size={20} color="#EF4444" />
                <Text style={styles.wesadSummaryValue}>{dadosWesad.rmssd}</Text>
                <Text style={styles.wesadSummaryLabel}>RMSSD</Text>
              </View>
              <View style={styles.wesadSummaryDivider} />
              <View style={styles.wesadSummaryItem}>
                <Icon name="user" size={20} color="#64748B" />
                <Text style={[styles.wesadSummaryValue, { fontSize: 13 }]}>{dadosWesad.perfil}</Text>
                <Text style={styles.wesadSummaryLabel}>Perfil</Text>
              </View>
            </View>
          </View>
        )}

        {/* Atenção Imediata */}
        <Text style={styles.sectionTitle}>Atenção Imediata</Text>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}><ActivityIndicator color="#B367D4" /><Text style={{ color: '#64748B', marginTop: 8, fontFamily: 'Manrope' }}>Carregando pacientes...</Text></View>
        ) : pacientesFiltrados.length === 0 ? (
          <View style={styles.emptyFilter}><Icon name="check-circle" size={32} color="#10B981" /><Text style={styles.emptyFilterText}>Nenhum paciente nessa categoria.</Text></View>
        ) : (
          <View style={styles.cardsContainer}>
            <FlatList data={pacientesFiltrados} keyExtractor={item => item.id} renderItem={renderPacienteCard} scrollEnabled={false} />
          </View>
        )}

        {/* Urgências */}
        <View style={styles.urgencySection}>
          <View style={styles.urgencyHeader}>
            <Text style={styles.sectionTitle}>Urgências</Text>
            <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>{pacientesUrgencias.length} Alertas</Text></View>
          </View>
          <View style={styles.urgencyCard}>
            <View style={styles.urgencyIconContainer}><Icon name="alert-triangle" size={22} color="#FFFFFF" /></View>
            <View style={styles.urgencyInfo}>
              <Text style={styles.urgencyTitle}>Tendência de Piora Detectada</Text>
              <Text style={styles.urgencyDescription}>Pacientes: {tendenciaPiora.join(', ')} apresentaram quedas no humor semanal.</Text>
              <TouchableOpacity style={styles.urgencyLink} onPress={() => setTelaUrgencias(true)}>
                <Text style={styles.urgencyLinkText}>Ver Urgências</Text>
                <Icon name="arrow-right" size={10} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsCard} onPress={() => navigation.navigate('Configuracoes')}>
          <View style={styles.settingsIconContainer}><Icon name="settings" size={25} color="#475569" /></View>
          <Text style={styles.settingsTitle}>Configurações</Text>
          <Text style={styles.settingsSubtitle}>Ajustes da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav navigation={navigation} currentScreen="VisaoGeral" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  headerBlur: { backgroundColor: 'rgba(246, 246, 248, 0.80)', borderBottomWidth: 1, borderBottomColor: 'rgba(43, 108, 238, 0.10)' },
  headerContent: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { color: '#0F172A', fontSize: 20, fontFamily: 'Manrope', fontWeight: '700' },
  backButton: { marginRight: 12, padding: 4 },
  scrollView: { flex: 1 },
  filtersContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  filterChip: { height: 40, paddingHorizontal: 20, backgroundColor: '#B367D4', borderRadius: 9999, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  filterChipActive: { backgroundColor: '#B367D4' },
  filterChipCritico: { height: 40, paddingHorizontal: 20, backgroundColor: '#EF4444', borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 2 },
  filterChipTendencia: { height: 40, paddingHorizontal: 20, backgroundColor: '#F59E0B', borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 2 },
  filterChipTextActive: { color: 'white', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  filterChipOutline: { height: 40, paddingHorizontal: 20, backgroundColor: 'white', borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(43, 108, 238, 0.10)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChipOutlineText: { color: '#475569', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  chartCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  chartTitle: { color: '#0F172A', fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', marginBottom: 16 },
  chartPeriodContainer: { flexDirection: 'row', padding: 4, backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 16 },
  periodButton: { flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  periodButtonActive: { backgroundColor: 'white', elevation: 1 },
  periodButtonText: { color: '#64748B', fontSize: 12, fontFamily: 'Manrope' },
  periodButtonTextActive: { color: 'rgba(179, 103, 212, 0.84)' },
  chartBarsContainer: { flexDirection: 'row', height: 192, paddingHorizontal: 8, justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  chartBar: { flex: 1, backgroundColor: 'rgba(179, 103, 212, 0.20)', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartBarGreen: { flex: 1, backgroundColor: '#10B981', borderTopLeftRadius: 4, borderTopRightRadius: 4, position: 'relative' },
  chartTooltip: { position: 'absolute', top: -32, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0F172A', borderRadius: 4, alignItems: 'center' },
  chartTooltipText: { color: 'white', fontSize: 10, fontFamily: 'Manrope' },
  chartLabels: { flexDirection: 'row', paddingHorizontal: 4, justifyContent: 'space-between' },
  chartLabel: { color: '#94A3B8', fontSize: 10, fontFamily: 'Manrope', fontWeight: '500' },
  chartLabelActive: { color: 'rgba(179, 103, 212, 0.84)', fontWeight: '700' },
  // BPM card
  wesadSummaryCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(179, 103, 212, 0.15)', elevation: 1 },
  wesadSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  wesadSummaryTitle: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  wesadSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  wesadSummaryItem: { alignItems: 'center', flex: 1 },
  wesadSummaryDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
  wesadSummaryValue: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', marginTop: 4 },
  wesadSummaryLabel: { fontSize: 10, fontFamily: 'Manrope', color: '#94A3B8', marginTop: 2 },
  sectionTitle: { color: '#64748B', fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 16, marginBottom: 12 },
  cardsContainer: { paddingHorizontal: 16, gap: 16, marginBottom: 24 },
  emptyFilter: { alignItems: 'center', paddingVertical: 32, gap: 12, marginBottom: 24 },
  emptyFilterText: { color: '#64748B', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  alertCard: { padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, position: 'relative', overflow: 'hidden', marginBottom: 16, elevation: 1 },
  criticalCard: { borderColor: '#FECACA' },
  trendCard: { borderColor: '#FDE68A' },
  alertCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  criticalAvatar: { borderColor: '#FEE2E2' },
  trendAvatar: { borderColor: '#FEF3C7' },
  alertCardInfo: { flex: 1 },
  alertCardNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertCardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertCardName: { color: '#0F172A', fontSize: 16, fontFamily: 'Manrope', fontWeight: '700' },
  realBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(179, 103, 212, 0.15)' },
  realBadgeText: { fontSize: 9, fontFamily: 'Manrope', fontWeight: '700', color: '#B367D4' },
  criticalBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  criticalBadgeText: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase' },
  wesadRow: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  wesadChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8F5FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  wesadChipText: { fontSize: 11, fontFamily: 'Manrope', fontWeight: '600', color: '#475569' },
  alertMessageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  criticalMessageText: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '500', flex: 1 },
  alertMeta: { color: '#64748B', fontSize: 11, fontFamily: 'Manrope', marginBottom: 12 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  primaryButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#B367D4', borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 12, fontFamily: 'Manrope', fontWeight: '700' },
  secondaryButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(43, 108, 238, 0.05)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(43, 108, 238, 0.20)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryButtonText: { color: '#B367D4', fontSize: 12, fontFamily: 'Manrope', fontWeight: '700' },
  statusBar: { position: 'absolute', left: 1, top: 1, width: 4, height: '100%' },
  criticalStatusBar: { backgroundColor: '#EF4444' },
  trendStatusBar: { backgroundColor: '#F59E0B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.50)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 28, alignItems: 'center', elevation: 8 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(179, 103, 212, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#0F172A', fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { color: '#64748B', fontSize: 14, fontFamily: 'Manrope', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontSize: 14, fontFamily: 'Manrope', fontWeight: '600' },
  modalCallBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#B367D4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalCallText: { color: 'white', fontSize: 14, fontFamily: 'Manrope', fontWeight: '700' },
  urgencySection: { marginHorizontal: 16, marginBottom: 24 },
  urgencyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FEE2E2', borderRadius: 9999 },
  alertBadgeText: { color: '#DC2626', fontSize: 12, fontFamily: 'Manrope', fontWeight: '700' },
  urgencyCard: { padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', gap: 16 },
  urgencyIconContainer: { padding: 8, backgroundColor: '#EF4444', borderRadius: 8 },
  urgencyInfo: { flex: 1 },
  urgencyTitle: { color: '#7F1D1D', fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', marginBottom: 4 },
  urgencyDescription: { color: '#B91C1C', fontSize: 12, fontFamily: 'Manrope', marginBottom: 8 },
  urgencyLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urgencyLinkText: { color: '#DC2626', fontSize: 12, fontFamily: 'Manrope', fontWeight: '700' },
  urgLegendaRow: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  urgLegendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  urgLegendaDot: { width: 10, height: 10, borderRadius: 5 },
  urgLegendaText: { color: '#64748B', fontSize: 12, fontFamily: 'Manrope', fontWeight: '500' },
  urgCardWrapper: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', backgroundColor: 'white', elevation: 1 },
  urgCardEmergencia: { borderColor: '#FECACA' },
  urgCardPiora: { borderColor: '#FDE68A' },
  urgCardLeft: { width: 52, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  urgCardIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  urgIconBgRed: { backgroundColor: '#EF4444' },
  urgIconBgAmber: { backgroundColor: '#F59E0B' },
  urgCardBody: { flex: 1, paddingVertical: 14, paddingRight: 14 },
  urgCardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  urgCardNome: { color: '#0F172A', fontSize: 15, fontFamily: 'Manrope', fontWeight: '700' },
  urgTipoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  urgBadgeRed: { backgroundColor: '#FEE2E2' },
  urgBadgeAmber: { backgroundColor: '#FEF3C7' },
  urgTipoBadgeText: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase' },
  urgBadgeTextRed: { color: '#DC2626' },
  urgBadgeTextAmber: { color: '#D97706' },
  urgCardMotivo: { color: '#374151', fontSize: 13, fontFamily: 'Manrope', fontWeight: '600', marginBottom: 4 },
  urgCardDetalhe: { color: '#64748B', fontSize: 12, fontFamily: 'Manrope', marginBottom: 6 },
  urgCardTempo: { color: '#94A3B8', fontSize: 11, fontFamily: 'Manrope', fontWeight: '500' },
  settingsCard: { marginHorizontal: 16, marginBottom: 24, padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  settingsIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  settingsTitle: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', marginBottom: 4 },
  settingsSubtitle: { color: '#64748B', fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase' },
});

export default VisaoGeral;