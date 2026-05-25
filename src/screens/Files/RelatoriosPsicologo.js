import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  StatusBar, Alert, Modal, ActivityIndicator, Share, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomNav from '../../components/BottomNav';

const Relatorios = ({ navigation, paciente, standalone }) => {
  const [modalAnaliseVisible, setModalAnaliseVisible] = useState(false);
  const [analiseSelecionada, setAnaliseSelecionada] = useState(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState('todos');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [pacientesList, setPacientesList] = useState([]);

  // Relatórios dinâmicos — um card de smartwatch por paciente real
  const [relatorios, setRelatorios] = useState([]);

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
        const ps = (data.patients || []).map(p => ({
          id: p.id || p.patientId,
          nome: p.name,
        }));
        setPacientesList(ps);

        // Gera um card de smartwatch por paciente + card de anotações fixo
        const cards = ps.map((p, i) => ({
          id: `sw_${p.id}`,
          pacienteNome: p.nome,
          pacienteId: p.id,
          tipo: 'smartwatch',
          titulo: `Relatório Semanal — Dados Fisiológicos WESAD`,
          data: new Date().toLocaleDateString('pt-BR'),
          descricao: 'Análise de dados fisiológicos (HR, IBI, RMSSD) derivados do dataset WESAD vinculado ao paciente.',
          analiseIA: null,
        }));

        // Se veio como componente filho de DashboardPaciente, filtra só o paciente atual
        if (paciente?.id) {
          setRelatorios(cards.filter(c => c.pacienteId === paciente.id));
        } else {
          setRelatorios([
            ...cards,
            {
              id: 'anotacoes_1',
              pacienteNome: ps[0]?.nome || 'Paciente',
              pacienteId: ps[0]?.id || '',
              tipo: 'anotacoes',
              titulo: 'Anotações do Diário - Semana Atual',
              data: new Date().toLocaleDateString('pt-BR'),
              descricao: 'Registros diários de humor e reflexões do paciente.',
              analiseIA: 'IA identificou padrão de ansiedade no início da semana, com melhora progressiva após a sessão de terapia. Evento social positivo indica progresso no engajamento social.',
            },
          ]);
        }
      }
    } catch (err) { console.error('Erro ao carregar pacientes:', err); }
  };

  // ── ANALISAR COM IA ──────────────────────────────────────
  const handleAnalisarIA = async (relatorio) => {
    if (relatorio.tipo === 'anotacoes') {
      setAnaliseSelecionada({
        titulo: relatorio.titulo,
        pacienteNome: relatorio.pacienteNome,
        data: relatorio.data,
        tipo: 'anotacoes',
        analise: relatorio.analiseIA,
        dias: null,
      });
      setModalAnaliseVisible(true);
      return;
    }

    // Smartwatch → chama lambda weekly-report com patientId do card
    setLoadingAnalise(true);
    setAnaliseSelecionada(null);
    setModalAnaliseVisible(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/patients/${relatorio.pacienteId}/insights/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'weekly-report' }),
        }
      );
      const data = await response.json();

      if (response.ok && data.relatorio) {
        const rel = data.relatorio;
        setAnaliseSelecionada({
          titulo: relatorio.titulo,
          pacienteNome: relatorio.pacienteNome,
          data: relatorio.data,
          tipo: 'smartwatch',
          tituloIA: rel.titulo,
          analise: rel.corpo,
          perfil: rel.perfil,
          flag: rel.flag_dominante,
          hr_media: rel.hr_media,
          ibi_media: rel.ibi_media,
          rmssd_media: rel.rmssd_media,
          pct_anxiety_risk: rel.pct_anxiety_risk,
          pct_aligned: rel.pct_aligned,
          dias: rel.dias,
        });
      } else {
        setModalAnaliseVisible(false);
        Alert.alert('Erro', data.error || 'Não foi possível gerar a análise');
      }
    } catch {
      setModalAnaliseVisible(false);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor');
    } finally {
      setLoadingAnalise(false);
    }
  };

  const getFilteredRelatorios = () => {
    let filtered = [...relatorios];
    if (selectedPaciente !== 'todos') filtered = filtered.filter(r => r.pacienteId === selectedPaciente);
    if (tipoRelatorio !== 'todos') filtered = filtered.filter(r => r.tipo === tipoRelatorio);
    return filtered;
  };

  const handleBaixarRelatorio = async (relatorio) => {
    try {
      const texto = relatorio.tipo === 'smartwatch'
        ? `📊 RELATÓRIO SMARTWATCH - ${relatorio.pacienteNome}\n📅 ${relatorio.data}\n📝 ${relatorio.titulo}\n\n${relatorio.descricao}\n\n---\nApsiCare`
        : `📝 RELATÓRIO ANOTAÇÕES - ${relatorio.pacienteNome}\n📅 ${relatorio.data}\n\n🤖 ${relatorio.analiseIA}\n\n---\nApsiCare`;
      await Share.share({ message: texto, title: `Relatorio_${relatorio.pacienteNome}.txt` });
    } catch { Alert.alert('Erro', 'Não foi possível compartilhar'); }
  };

  const handleExportarTodos = async () => {
    const filtrados = getFilteredRelatorios();
    if (filtrados.length === 0) { Alert.alert('Aviso', 'Nenhum relatório para exportar'); return; }
    let texto = `📊 RELATÓRIOS APSICARE\n${new Date().toLocaleDateString('pt-BR')}\nTotal: ${filtrados.length}\n\n`;
    filtrados.forEach((r, i) => { texto += `${i + 1}. ${r.titulo}\nPaciente: ${r.pacienteNome}\nData: ${r.data}\n\n`; });
    try { await Share.share({ message: texto, title: 'Relatorios_ApsiCare.txt' }); }
    catch { Alert.alert('Erro', 'Não foi possível exportar'); }
  };

  const formatDate = (event, selectedDate, type) => {
    if (type === 'start') {
      setShowStartPicker(false);
      if (selectedDate) setDataInicio(`${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`);
    } else {
      setShowEndPicker(false);
      if (selectedDate) setDataFim(`${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`);
    }
  };

  const getTipoIcon = (tipo) => tipo === 'smartwatch' ? 'watch' : 'file-text';
  const getTipoColor = (tipo) => tipo === 'smartwatch' ? '#B367D4' : '#10B981';
  const getTipoLabel = (tipo) => tipo === 'smartwatch' ? 'Smartwatch' : 'Anotações';
  const getFlagColor = (flag) => flag === 'anxiety_risk' ? '#EF4444' : flag === 'overreported' ? '#F59E0B' : '#10B981';
  const getFlagLabel = (flag) => flag === 'anxiety_risk' ? '⚠️ Atenção' : flag === 'overreported' ? '📊 Elevado' : '✅ Estável';

  const filteredRelatorios = getFilteredRelatorios();

  const renderRelatorioCard = (relatorio) => (
    <View key={relatorio.id} style={styles.relatorioCard}>
      <View style={styles.relatorioHeader}>
        <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(relatorio.tipo) + '20' }]}>
          <Icon name={getTipoIcon(relatorio.tipo)} size={14} color={getTipoColor(relatorio.tipo)} />
          <Text style={[styles.tipoBadgeText, { color: getTipoColor(relatorio.tipo) }]}>{getTipoLabel(relatorio.tipo)}</Text>
        </View>
        <Text style={styles.relatorioData}>{relatorio.data}</Text>
      </View>
      <Text style={styles.relatorioTitulo}>{relatorio.titulo}</Text>
      <Text style={styles.relatorioPaciente}>{relatorio.pacienteNome}</Text>
      <Text style={styles.relatorioDescricao} numberOfLines={2}>{relatorio.descricao}</Text>
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

  const content = (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: standalone ? 80 : 20 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <TouchableOpacity style={styles.exportAllButton} onPress={handleExportarTodos}>
          <Icon name="download" size={18} color="#B367D4" />
          <Text style={styles.exportAllText}>Exportar Tudo</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros — só exibe fora do DashboardPaciente */}
      {!standalone && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtros</Text>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Paciente</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={() => setShowPacienteDropdown(!showPacienteDropdown)}>
              <Text style={styles.filterSelectText}>{selectedPaciente === 'todos' ? 'Todos os pacientes' : pacientesList.find(p => p.id === selectedPaciente)?.nome}</Text>
              <Icon name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
            {showPacienteDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedPaciente('todos'); setShowPacienteDropdown(false); }}>
                  <Text style={styles.dropdownItemText}>Todos os pacientes</Text>
                </TouchableOpacity>
                {pacientesList.map(p => (
                  <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => { setSelectedPaciente(p.id); setShowPacienteDropdown(false); }}>
                    <Text style={styles.dropdownItemText}>{p.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Tipo de Relatório</Text>
            <View style={styles.tipoFilterRow}>
              {[{ id: 'todos', label: 'Todos' }, { id: 'smartwatch', label: 'Smartwatch', icon: 'watch' }, { id: 'anotacoes', label: 'Anotações', icon: 'file-text' }].map(t => (
                <TouchableOpacity key={t.id} style={[styles.tipoFilterBtn, tipoRelatorio === t.id && styles.tipoFilterBtnActive]} onPress={() => setTipoRelatorio(t.id)}>
                  {t.icon && <Icon name={t.icon} size={14} color={tipoRelatorio === t.id ? '#FFFFFF' : '#64748B'} />}
                  <Text style={[styles.tipoFilterText, tipoRelatorio === t.id && styles.tipoFilterTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        {[{ num: filteredRelatorios.length, label: 'Encontrados' }, { num: filteredRelatorios.filter(r => r.tipo === 'smartwatch').length, label: 'Smartwatch' }, { num: filteredRelatorios.filter(r => r.tipo === 'anotacoes').length, label: 'Anotações' }].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statNumber}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.relatoriosContainer}>
        <Text style={styles.relatoriosTitle}>Histórico de Relatórios</Text>
        {filteredRelatorios.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="file-text" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>Nenhum relatório encontrado</Text>
            <Text style={styles.emptyStateText}>Os relatórios aparecem conforme os pacientes são carregados</Text>
          </View>
        ) : (
          filteredRelatorios.map(renderRelatorioCard)
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      {content}

      {showStartPicker && !standalone && <DateTimePicker value={new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => formatDate(e, d, 'start')} />}
      {showEndPicker && !standalone && <DateTimePicker value={new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => formatDate(e, d, 'end')} />}

      <Modal animationType="fade" transparent visible={modalAnaliseVisible} onRequestClose={() => setModalAnaliseVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.analiseModalContainer}>
            <View style={styles.analiseModalHeader}>
              <View style={styles.analiseIcon}><Icon name="cpu" size={24} color="#B367D4" /></View>
              <View style={styles.analiseHeaderText}>
                <Text style={styles.analiseModalTitle}>Análise da IA</Text>
                {analiseSelecionada && <Text style={styles.analiseModalSubtitle}>{analiseSelecionada.pacienteNome} — {analiseSelecionada.data}</Text>}
              </View>
              <TouchableOpacity onPress={() => setModalAnaliseVisible(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.analiseModalContent}>
              {loadingAnalise ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#B367D4" />
                  <Text style={{ marginTop: 16, color: '#64748B', fontFamily: 'Manrope', fontSize: 14 }}>Gerando análise com dados do WESAD...</Text>
                </View>
              ) : analiseSelecionada ? (
                <>
                  <View style={[styles.analiseTipoBadge, { backgroundColor: getTipoColor(analiseSelecionada.tipo) + '20' }]}>
                    <Icon name={getTipoIcon(analiseSelecionada.tipo)} size={14} color={getTipoColor(analiseSelecionada.tipo)} />
                    <Text style={[styles.analiseTipoText, { color: getTipoColor(analiseSelecionada.tipo) }]}>{getTipoLabel(analiseSelecionada.tipo)}</Text>
                  </View>
                  {analiseSelecionada.tituloIA && (
                    <Text style={[styles.analiseTitulo, { color: getFlagColor(analiseSelecionada.flag) }]}>{analiseSelecionada.tituloIA}</Text>
                  )}
                  <Text style={styles.analiseTitulo}>{analiseSelecionada.titulo}</Text>
                  <View style={styles.analiseDivider} />
                  <Text style={styles.analiseSectionTitle}>🤖 Análise Inteligente</Text>
                  <Text style={styles.analiseText}>{analiseSelecionada.analise}</Text>

                  {analiseSelecionada.tipo === 'smartwatch' && analiseSelecionada.hr_media && (
                    <View style={styles.detalhesContainer}>
                      <Text style={styles.detalhesTitle}>📊 Dados Fisiológicos (Semana)</Text>
                      {[
                        { label: 'Perfil WESAD', value: analiseSelecionada.perfil, color: '#B367D4' },
                        { label: 'HR média', value: `${analiseSelecionada.hr_media} bpm` },
                        { label: 'IBI média', value: `${analiseSelecionada.ibi_media} ms` },
                        { label: 'RMSSD média', value: `${analiseSelecionada.rmssd_media} ms` },
                        { label: 'Anxiety Risk', value: `${analiseSelecionada.pct_anxiety_risk}% dos dias`, color: '#EF4444' },
                        { label: 'Alinhado', value: `${analiseSelecionada.pct_aligned}% dos dias`, color: '#10B981' },
                      ].map((row, i) => (
                        <View key={i} style={styles.detalhesRow}>
                          <Text style={styles.detalhesLabel}>{row.label}:</Text>
                          <Text style={[styles.detalhesValue, row.color && { color: row.color, fontWeight: '700' }]}>{row.value}</Text>
                        </View>
                      ))}

                      {analiseSelecionada.dias?.length > 0 && (
                        <>
                          <Text style={[styles.detalhesTitle, { marginTop: 16 }]}>📅 Detalhamento por Dia</Text>
                          {analiseSelecionada.dias.map(dia => (
                            <View key={dia.dia} style={{ marginBottom: 10, padding: 10, backgroundColor: '#FAFAFA', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: getFlagColor(dia.flag) }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A' }}>Dia {dia.dia} {dia.emoji}</Text>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: getFlagColor(dia.flag) }}>{getFlagLabel(dia.flag)}</Text>
                              </View>
                              <Text style={{ fontSize: 11, color: '#64748B', fontFamily: 'Manrope', marginTop: 2 }}>HR: {dia.HR} bpm • IBI: {dia.IBI} ms • RMSSD: {dia.RMSSD} ms</Text>
                              <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Manrope', marginTop: 2 }}>Humor: {dia.mood}/10 • {dia.contexto}</Text>
                              <Text style={{ fontSize: 11, color: '#475569', fontFamily: 'Manrope', marginTop: 4, fontStyle: 'italic' }}>{dia.insight}</Text>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </>
              ) : null}
            </ScrollView>
            <View style={styles.analiseModalFooter}>
              <TouchableOpacity style={styles.analiseCloseButton} onPress={() => setModalAnaliseVisible(false)}>
                <Text style={styles.analiseCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
              {analiseSelecionada && (
                <TouchableOpacity style={styles.analiseExportButton} onPress={async () => {
                  try { await Share.share({ message: `${analiseSelecionada.tituloIA || analiseSelecionada.titulo}\n\n${analiseSelecionada.analise}\n\n---\nApsiCare` }); setModalAnaliseVisible(false); } catch {}
                }}>
                  <Icon name="download" size={18} color="#FFFFFF" />
                  <Text style={styles.analiseExportButtonText}>Exportar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {!standalone && <BottomNav navigation={navigation} currentScreen="Relatorios" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A' },
  exportAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  exportAllText: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  filtersContainer: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 8, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  filtersTitle: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  filterGroup: { marginBottom: 16 },
  filterLabel: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B', marginBottom: 6 },
  filterSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  filterSelectText: { fontSize: 14, fontFamily: 'Manrope', color: '#0F172A' },
  tipoFilterRow: { flexDirection: 'row', gap: 10 },
  tipoFilterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9' },
  tipoFilterBtnActive: { backgroundColor: '#B367D4' },
  tipoFilterText: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B' },
  tipoFilterTextActive: { color: '#FFFFFF' },
  dropdown: { position: 'absolute', top: 70, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 5, zIndex: 10 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 14, fontFamily: 'Manrope', color: '#0F172A' },
  statsContainer: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 16, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  statNumber: { fontSize: 24, fontFamily: 'Manrope', fontWeight: '700', color: '#B367D4' },
  statLabel: { fontSize: 11, fontFamily: 'Manrope', color: '#64748B', marginTop: 4 },
  relatoriosContainer: { marginHorizontal: 16, marginBottom: 16 },
  relatoriosTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  relatorioCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  relatorioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  tipoBadgeText: { fontSize: 11, fontFamily: 'Manrope', fontWeight: '600' },
  relatorioData: { fontSize: 11, fontFamily: 'Manrope', color: '#94A3B8' },
  relatorioTitulo: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  relatorioPaciente: { fontSize: 13, fontFamily: 'Manrope', color: '#64748B', marginBottom: 8 },
  relatorioDescricao: { fontSize: 13, fontFamily: 'Manrope', color: '#475569', lineHeight: 18, marginBottom: 14 },
  relatorioActions: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  analisarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(179, 103, 212, 0.10)', paddingVertical: 10, borderRadius: 12 },
  analisarBtnText: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '500', color: '#B367D4' },
  baixarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 12 },
  baixarBtnText: { fontSize: 13, fontFamily: 'Manrope', fontWeight: '500', color: '#10B981' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, fontFamily: 'Manrope', color: '#64748B', textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  analiseModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 28, width: '92%', maxHeight: '88%' },
  analiseModalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  analiseIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(179, 103, 212, 0.10)', alignItems: 'center', justifyContent: 'center' },
  analiseHeaderText: { flex: 1 },
  analiseModalTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  analiseModalSubtitle: { fontSize: 12, fontFamily: 'Manrope', color: '#64748B', marginTop: 2 },
  analiseModalContent: { padding: 20 },
  analiseTipoBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6, marginBottom: 12 },
  analiseTipoText: { fontSize: 11, fontFamily: 'Manrope', fontWeight: '600' },
  analiseTitulo: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 8 },
  analiseDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  analiseSectionTitle: { fontSize: 15, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  analiseText: { fontSize: 14, fontFamily: 'Manrope', color: '#475569', lineHeight: 22 },
  detalhesContainer: { backgroundColor: 'rgba(179, 103, 212, 0.05)', borderRadius: 16, padding: 16, marginTop: 16 },
  detalhesTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  detalhesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detalhesLabel: { fontSize: 13, fontFamily: 'Manrope', color: '#64748B' },
  detalhesValue: { fontSize: 13, fontFamily: 'Manrope', color: '#0F172A' },
  analiseModalFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 12 },
  analiseCloseButton: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  analiseCloseButtonText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#64748B' },
  analiseExportButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#B367D4', paddingVertical: 12, borderRadius: 12, gap: 8 },
  analiseExportButtonText: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', color: '#FFFFFF' },
});

export default Relatorios;