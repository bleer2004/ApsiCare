import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import SmartwatchPaciente from '../../../src/screens/smartwatch/SmartWatchPaciente';

const PerfilPaciente = ({ navigation }) => {
  const [paciente, setPaciente] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados para configurações de acessibilidade
  const [baixaVisao, setBaixaVisao] = useState(false);
  const [daltonismo, setDaltonismo] = useState(false);

  // Novos estados para dados do paciente
  const [stats, setStats] = useState({
    humorPrevalece: 'Neutro',
    scoreHumor: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      setPaciente(user);

      // Carregar configurações de acessibilidade do paciente
      if (user.configuracoesApp?.acessibilidade) {
        setBaixaVisao(user.configuracoesApp.acessibilidade.baixaVisao || false);
        setDaltonismo(user.configuracoesApp.acessibilidade.daltonismo || false);
      }

      // Carregar documentos
      const response = await fetch(`${API_URL}/patients/${user.id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setDocumentos(data.documents || []);
      
      // Carregar estatísticas do paciente
      await carregarEstatisticas(user.id, token);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const carregarEstatisticas = async (patientId, token) => {
    try {
      const response = await fetch(`${API_URL}/patients/${patientId}/moods?limit=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.moods && data.moods.length > 0) {
        const scores = data.moods.map(m => m.emotionalScore || 50);
        const mediaScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        const contextTags = data.moods.flatMap(m => m.contextTags || []);
        const humorCount = {};
        contextTags.forEach(tag => {
          humorCount[tag] = (humorCount[tag] || 0) + 1;
        });
        
        let humorPrevalece = 'Neutro';
        let maxCount = 0;
        const humorMap = {
          feliz: 'Feliz',
          calmo: 'Calmo',
          ansioso: 'Ansioso',
          triste: 'Triste',
          neutral: 'Neutro'
        };
        
        Object.entries(humorCount).forEach(([tag, count]) => {
          if (count > maxCount) {
            maxCount = count;
            humorPrevalece = humorMap[tag] || 'Neutro';
          }
        });
        
        setStats({
          humorPrevalece: humorPrevalece,
          scoreHumor: mediaScore,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Função para salvar configurações de acessibilidade
  const salvarConfiguracoesAcessibilidade = async () => {
    setSalvando(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);

      const response = await fetch(`${API_URL}/patients/${user.id}/configuracoes`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          configuracoesApp: {
            ...user.configuracoesApp,
            acessibilidade: {
              baixaVisao,
              daltonismo
            }
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro ao salvar configurações');
        return;
      }

      // Atualizar o user no AsyncStorage
      const updatedUser = { ...user, configuracoesApp: data.configuracoesApp || user.configuracoesApp };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setPaciente(updatedUser);

      Alert.alert('Sucesso', 'Configurações de acessibilidade atualizadas!');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setSalvando(false);
    }
  };

  // Função para alternar baixa visão
  const toggleBaixaVisao = (value) => {
    setBaixaVisao(value);
    // Salvar automaticamente
    setTimeout(() => salvarConfiguracoesAcessibilidade(), 100);
  };

  // Função para alternar daltonismo
  const toggleDaltonismo = (value) => {
    setDaltonismo(value);
    // Salvar automaticamente
    setTimeout(() => salvarConfiguracoesAcessibilidade(), 100);
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        navigation.replace('LoginPaciente');
      }}
    ]);
  };

  const getDocIcon = (tipo) => {
    if (!tipo) return { icon: 'file', color: '#6366F1', bg: '#EEF2FF' };
    const t = tipo.toUpperCase();
    if (t === 'PDF') return { icon: 'file-text', color: '#EF4444', bg: '#FEF2F2' };
    if (t === 'DOCX') return { icon: 'file', color: '#3B82F6', bg: '#EFF6FF' };
    return { icon: 'image', color: '#F59E0B', bg: '#FFFBEB' };
  };
  
  const getScoreColor = (score) => {
    if (score >= 70) return '#22C55E';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };
  
  const getScoreLabel = (score) => {
    if (score >= 70) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Atenção';
  };

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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus dados</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Icon name="log-out" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#B367D4" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="smile" size={22} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.humorPrevalece}</Text>
                <Text style={styles.statLabel}>Humor que prevalece</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="trending-up" size={22} color="#22C55E" />
                </View>
                <Text style={[styles.statValue, { color: getScoreColor(stats.scoreHumor) }]}>
                  {stats.scoreHumor}%
                </Text>
                <Text style={styles.statLabel}>Score de humor</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(stats.scoreHumor) + '20' }]}>
                  <Text style={[styles.scoreBadgeText, { color: getScoreColor(stats.scoreHumor) }]}>
                    {getScoreLabel(stats.scoreHumor)}
                  </Text>
                </View>
              </View>
            </View>

            {/* NOVA SEÇÃO: Configurações de Acessibilidade */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="eye" size={20} color="#B367D4" />
                <Text style={styles.sectionTitle}>Acessibilidade</Text>
              </View>
              
              <View style={styles.acessibilidadeCard}>
                {/* Baixa Visão */}
                <View style={styles.acessibilidadeRow}>
                  <View style={styles.acessibilidadeInfo}>
                    <View style={[styles.acessibilidadeIconWrapper, { backgroundColor: baixaVisao ? '#FEF3C7' : '#F1F5F9' }]}>
                      <Icon name="eye" size={20} color={baixaVisao ? '#F59E0B' : '#94A3B8'} />
                    </View>
                    <View style={styles.acessibilidadeText}>
                      <Text style={styles.acessibilidadeTitle}>Modo Baixa Visão</Text>
                      <Text style={styles.acessibilidadeDescription}>
                        Aumenta o tamanho das fontes, ícones e melhora o contraste
                      </Text>
                    </View>
                  </View>
                  <Switch 
                    value={baixaVisao} 
                    onValueChange={toggleBaixaVisao} 
                    trackColor={{ false: '#CBD5E1', true: '#F59E0B' }} 
                    thumbColor="#FFFFFF"
                    disabled={salvando}
                  />
                </View>

                <View style={styles.divider} />

                {/* Daltonismo */}
                <View style={styles.acessibilidadeRow}>
                  <View style={styles.acessibilidadeInfo}>
                    <View style={[styles.acessibilidadeIconWrapper, { backgroundColor: daltonismo ? '#DCFCE7' : '#F1F5F9' }]}>
                      <Icon name="eye-off" size={20} color={daltonismo ? '#22C55E' : '#94A3B8'} />
                    </View>
                    <View style={styles.acessibilidadeText}>
                      <Text style={styles.acessibilidadeTitle}>Modo Daltonismo</Text>
                      <Text style={styles.acessibilidadeDescription}>
                        Substitui cores por padrões amigáveis para daltônicos
                      </Text>
                    </View>
                  </View>
                  <Switch 
                    value={daltonismo} 
                    onValueChange={toggleDaltonismo} 
                    trackColor={{ false: '#CBD5E1', true: '#22C55E' }} 
                    thumbColor="#FFFFFF"
                    disabled={salvando}
                  />
                </View>

                {salvando && (
                  <View style={styles.salvandoIndicator}>
                    <ActivityIndicator size="small" color="#B367D4" />
                    <Text style={styles.salvandoText}>Salvando alterações...</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Documentos Compartilhados */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="folder" size={20} color="#B367D4" />
                <Text style={styles.sectionTitle}>Documentos Compartilhados</Text>
              </View>

              {documentos.length === 0 ? (
                <View style={styles.emptyDocs}>
                  <Icon name="folder" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyDocsText}>Nenhum documento compartilhado</Text>
                </View>
              ) : (
                documentos.map((doc) => {
                  const docStyle = getDocIcon(doc.tipo);
                  return (
                    <View key={doc.id} style={styles.documentCard}>
                      <View style={[styles.documentIcon, { backgroundColor: docStyle.bg }]}>
                        <Icon name={docStyle.icon} size={20} color={docStyle.color} />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{doc.nome}</Text>
                        <Text style={styles.documentMeta}>{doc.tipo} • {doc.tamanho}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Smartwatch / Health Connect */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="watch" size={20} color="#B367D4" />
                <Text style={styles.sectionTitle}>Smartwatch</Text>
              </View>
              <View style={styles.smartwatchEmbed}>
                <SmartwatchPaciente paciente={paciente} standalone={false} />
              </View>
            </View>

            {/* Sobre minha conta */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre minha conta</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="user" size={16} color="#B367D4" />
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{paciente?.name || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="mail" size={16} color="#B367D4" />
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{paciente?.email || '-'}</Text>
                </View>
                {/* Exibir status das configurações */}
                <View style={styles.infoRow}>
                  <Icon name="settings" size={16} color="#B367D4" />
                  <Text style={styles.infoLabel}>Acessibilidade</Text>
                  <Text style={styles.infoValue}>
                    {baixaVisao && daltonismo ? 'Ambos ativos' : 
                     baixaVisao ? 'Baixa Visão' : 
                     daltonismo ? 'Daltonismo' : 
                     'Padrão'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botão Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="log-out" size={18} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Sair da conta</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="user" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 28 },
  
  // Cards de Estatísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
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
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  scoreBadgeText: {
    fontSize: 9,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 14,
  },

  // Seção de Acessibilidade
  acessibilidadeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  acessibilidadeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  acessibilidadeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  acessibilidadeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  acessibilidadeText: {
    flex: 1,
  },
  acessibilidadeTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  acessibilidadeDescription: {
    fontSize: 11,
    fontFamily: 'Manrope',
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  salvandoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  salvandoText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    color: '#64748B',
  },
  
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '700', color: '#191B23', lineHeight: 22.5 },
  emptyDocs: { alignItems: 'center', paddingVertical: 32 },
  emptyDocsText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  documentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  documentIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  documentMeta: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', lineHeight: 15, letterSpacing: 0.5 },
  smartwatchEmbed: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  infoLabel: { fontSize: 14, color: '#64748B', flex: 1 },
  infoValue: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', borderRadius: 12, marginHorizontal: 16, marginTop: 16, marginBottom: 32, paddingVertical: 14, gap: 8 },
  logoutButtonText: { fontSize: 16, fontFamily: 'Manrope', fontWeight: '700', color: '#FFFFFF' },
  bottomNavigation: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.90)', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 24, justifyContent: 'space-between', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 4 },
  navItemActive: {},
  navText: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', color: '#94A3B8', lineHeight: 15 },
  navTextActive: { color: '#B367D4' },
});

export default PerfilPaciente;