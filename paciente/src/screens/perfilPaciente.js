import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import SmartwatchPaciente from '../../../src/screens/smartwatch/SmartWatchPaciente';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAccessibilityStyles } from '../hooks/useAccessibilityStyles';

const PerfilPaciente = ({ navigation }) => {
  const [paciente, setPaciente] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Contexto de acessibilidade
  const { configuracoes, atualizarConfiguracoes, recarregar } = useAccessibility();
  const [baixaVisaoLocal, setBaixaVisaoLocal] = useState(configuracoes.baixaVisao);
  const [daltonismoLocal, setDaltonismoLocal] = useState(configuracoes.daltonismo);

  // Hooks de estilos
  const {
    baixaVisao,
    daltonismo,
    getColors,
    getTextStyle,
    getIconProps,
    getSpacing,
    getCardStyle,
    adaptarCor,
  } = useAccessibilityStyles();

  const colors = getColors();

  // Novos estados para dados do paciente
  const [stats, setStats] = useState({
    humorPrevalece: 'Neutro',
    scoreHumor: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  // Sincronizar com o contexto quando as configs mudarem
  useEffect(() => {
    setBaixaVisaoLocal(configuracoes.baixaVisao);
    setDaltonismoLocal(configuracoes.daltonismo);
  }, [configuracoes]);

  const carregarDados = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      setPaciente(user);

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
  const salvarConfiguracoesAcessibilidade = async (novaBaixaVisao, novoDaltonismo) => {
    setSalvando(true);
    try {
      // Atualizar no contexto global
      await atualizarConfiguracoes({
        baixaVisao: novaBaixaVisao,
        daltonismo: novoDaltonismo,
      });

      // Atualizar no backend
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
              baixaVisao: novaBaixaVisao,
              daltonismo: novoDaltonismo,
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
    setBaixaVisaoLocal(value);
    salvarConfiguracoesAcessibilidade(value, daltonismoLocal);
  };

  // Função para alternar daltonismo
  const toggleDaltonismo = (value) => {
    setDaltonismoLocal(value);
    salvarConfiguracoesAcessibilidade(baixaVisaoLocal, value);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={baixaVisao ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" {...getIconProps('arrow-left', 'medium', colors.text)} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, getTextStyle('large', colors.text, '700')]}>Meus dados</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Icon name="log-out" {...getIconProps('log-out', 'medium', adaptarCor('#EF4444'))} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <View style={[styles.statsGrid, { paddingHorizontal: getSpacing('small'), gap: getSpacing('small') }]}>
              <View style={[
                styles.statCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  padding: baixaVisao ? 18 : 14,
                }
              ]}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="smile" size={baixaVisao ? 28 : 22} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, getTextStyle('large', colors.text, '800')]}>{stats.humorPrevalece}</Text>
                <Text style={[styles.statLabel, getTextStyle('small', colors.textSecondary)]}>Humor que prevalece</Text>
              </View>
              
              <View style={[
                styles.statCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  padding: baixaVisao ? 18 : 14,
                }
              ]}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="trending-up" size={baixaVisao ? 28 : 22} color="#22C55E" />
                </View>
                <Text style={[
                  styles.statValue,
                  getTextStyle('large', getScoreColor(stats.scoreHumor), '800')
                ]}>
                  {stats.scoreHumor}%
                </Text>
                <Text style={[styles.statLabel, getTextStyle('small', colors.textSecondary)]}>Score de humor</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(stats.scoreHumor) + '20' }]}>
                  <Text style={[
                    styles.scoreBadgeText,
                    getTextStyle('small', getScoreColor(stats.scoreHumor), '700')
                  ]}>
                    {getScoreLabel(stats.scoreHumor)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Seção de Acessibilidade */}
            <View style={[styles.section, { paddingHorizontal: getSpacing('medium') }]}>
              <View style={styles.sectionHeader}>
                <Icon name="eye" {...getIconProps('eye', 'medium', colors.primary)} />
                <Text style={[styles.sectionTitle, getTextStyle('large', colors.text, '700')]}>Acessibilidade</Text>
              </View>
              
              <View style={[
                styles.acessibilidadeCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  padding: baixaVisao ? 20 : 16,
                }
              ]}>
                {/* Baixa Visão */}
                <View style={styles.acessibilidadeRow}>
                  <View style={styles.acessibilidadeInfo}>
                    <View style={[
                      styles.acessibilidadeIconWrapper,
                      {
                        backgroundColor: baixaVisaoLocal ? '#FEF3C7' : '#F1F5F9',
                        width: baixaVisao ? 48 : 40,
                        height: baixaVisao ? 48 : 40,
                        borderRadius: baixaVisao ? 24 : 20,
                      }
                    ]}>
                      <Icon name="eye" size={baixaVisao ? 24 : 20} color={baixaVisaoLocal ? '#F59E0B' : '#94A3B8'} />
                    </View>
                    <View style={styles.acessibilidadeText}>
                      <Text style={[styles.acessibilidadeTitle, getTextStyle('medium', colors.text, '600')]}>
                        Modo Baixa Visão
                      </Text>
                      <Text style={[styles.acessibilidadeDescription, getTextStyle('small', colors.textSecondary)]}>
                        Aumenta o tamanho das fontes, ícones e melhora o contraste
                      </Text>
                    </View>
                  </View>
                  <Switch 
                    value={baixaVisaoLocal} 
                    onValueChange={toggleBaixaVisao} 
                    trackColor={{ false: '#CBD5E1', true: '#F59E0B' }} 
                    thumbColor="#FFFFFF"
                    disabled={salvando}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Daltonismo */}
                <View style={styles.acessibilidadeRow}>
                  <View style={styles.acessibilidadeInfo}>
                    <View style={[
                      styles.acessibilidadeIconWrapper,
                      {
                        backgroundColor: daltonismoLocal ? '#DCFCE7' : '#F1F5F9',
                        width: baixaVisao ? 48 : 40,
                        height: baixaVisao ? 48 : 40,
                        borderRadius: baixaVisao ? 24 : 20,
                      }
                    ]}>
                      <Icon name="eye-off" size={baixaVisao ? 24 : 20} color={daltonismoLocal ? '#22C55E' : '#94A3B8'} />
                    </View>
                    <View style={styles.acessibilidadeText}>
                      <Text style={[styles.acessibilidadeTitle, getTextStyle('medium', colors.text, '600')]}>
                        Modo Daltonismo
                      </Text>
                      <Text style={[styles.acessibilidadeDescription, getTextStyle('small', colors.textSecondary)]}>
                        Substitui cores por padrões amigáveis para daltônicos
                      </Text>
                    </View>
                  </View>
                  <Switch 
                    value={daltonismoLocal} 
                    onValueChange={toggleDaltonismo} 
                    trackColor={{ false: '#CBD5E1', true: '#22C55E' }} 
                    thumbColor="#FFFFFF"
                    disabled={salvando}
                  />
                </View>

                {salvando && (
                  <View style={styles.salvandoIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.salvandoText, getTextStyle('small', colors.textSecondary)]}>
                      Salvando alterações...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Documentos Compartilhados */}
            <View style={[styles.section, { paddingHorizontal: getSpacing('medium') }]}>
              <View style={styles.sectionHeader}>
                <Icon name="folder" {...getIconProps('folder', 'medium', colors.primary)} />
                <Text style={[styles.sectionTitle, getTextStyle('large', colors.text, '700')]}>Documentos Compartilhados</Text>
              </View>

              {documentos.length === 0 ? (
                <View style={[
                  styles.emptyDocs,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    borderRadius: 12,
                    borderWidth: 1,
                    padding: baixaVisao ? 40 : 32,
                  }
                ]}>
                  <Icon name="folder" {...getIconProps('folder', 'xlarge', colors.textMuted)} />
                  <Text style={[styles.emptyDocsText, getTextStyle('medium', colors.textSecondary)]}>
                    Nenhum documento compartilhado
                  </Text>
                </View>
              ) : (
                documentos.map((doc) => {
                  const docStyle = getDocIcon(doc.tipo);
                  return (
                    <View key={doc.id} style={[
                      styles.documentCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        padding: baixaVisao ? 16 : 12,
                      }
                    ]}>
                      <View style={[styles.documentIcon, { backgroundColor: docStyle.bg }]}>
                        <Icon name={docStyle.icon} size={baixaVisao ? 24 : 20} color={docStyle.color} />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={[styles.documentName, getTextStyle('medium', colors.text, '700')]}>
                          {doc.nome}
                        </Text>
                        <Text style={[styles.documentMeta, getTextStyle('small', colors.textSecondary)]}>
                          {doc.tipo} • {doc.tamanho}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Smartwatch / Health Connect */}
            <View style={[styles.section, { paddingHorizontal: getSpacing('medium') }]}>
              <View style={styles.sectionHeader}>
                <Icon name="watch" {...getIconProps('watch', 'medium', colors.primary)} />
                <Text style={[styles.sectionTitle, getTextStyle('large', colors.text, '700')]}>Smartwatch</Text>
              </View>
              <View style={[
                styles.smartwatchEmbed,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                }
              ]}>
                <SmartwatchPaciente paciente={paciente} standalone={false} />
              </View>
            </View>

            {/* Sobre minha conta */}
            <View style={[styles.section, { paddingHorizontal: getSpacing('medium') }]}>
              <Text style={[styles.sectionTitle, getTextStyle('large', colors.text, '700')]}>Sobre minha conta</Text>
              <View style={[
                styles.infoCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  padding: baixaVisao ? 20 : 16,
                }
              ]}>
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <Icon name="user" {...getIconProps('user', 'small', colors.primary)} />
                  <Text style={[styles.infoLabel, getTextStyle('medium', colors.textSecondary)]}>Nome</Text>
                  <Text style={[styles.infoValue, getTextStyle('medium', colors.text, '600')]}>{paciente?.name || '-'}</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                  <Icon name="mail" {...getIconProps('mail', 'small', colors.primary)} />
                  <Text style={[styles.infoLabel, getTextStyle('medium', colors.textSecondary)]}>Email</Text>
                  <Text style={[styles.infoValue, getTextStyle('medium', colors.text, '600')]}>{paciente?.email || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="settings" {...getIconProps('settings', 'small', colors.primary)} />
                  <Text style={[styles.infoLabel, getTextStyle('medium', colors.textSecondary)]}>Acessibilidade</Text>
                  <Text style={[styles.infoValue, getTextStyle('medium', colors.text, '600')]}>
                    {baixaVisaoLocal && daltonismoLocal ? 'Ambos ativos' : 
                     baixaVisaoLocal ? 'Baixa Visão' : 
                     daltonismoLocal ? 'Daltonismo' : 
                     'Padrão'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botão Logout */}
            <TouchableOpacity style={[
              styles.logoutButton,
              {
                backgroundColor: adaptarCor('#EF4444'),
                marginHorizontal: getSpacing('medium'),
                paddingVertical: baixaVisao ? 18 : 14,
              }
            ]} onPress={handleLogout}>
              <Icon name="log-out" {...getIconProps('log-out', 'medium', '#FFFFFF')} />
              <Text style={[styles.logoutButtonText, getTextStyle('large', '#FFFFFF', '700')]}>Sair da conta</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[
        styles.bottomNavigation,
        {
          backgroundColor: baixaVisao ? colors.cardBackground : 'rgba(255, 255, 255, 0.90)',
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" {...getIconProps('home', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '700')]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" {...getIconProps('book-open', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '700')]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" {...getIconProps('target', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '700')]}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="user" {...getIconProps('user', 'medium', colors.primary)} />
          <Text style={[styles.navText, getTextStyle('small', colors.primary, '700')]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
  },
  
  // Cards de Estatísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
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
    fontFamily: 'Manrope',
    fontWeight: '800',
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: 'Manrope',
    fontWeight: '500',
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
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 14,
  },

  // Seção de Acessibilidade
  acessibilidadeCard: {
    borderRadius: 12,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  acessibilidadeText: {
    flex: 1,
  },
  acessibilidadeTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 20,
  },
  acessibilidadeDescription: {
    fontFamily: 'Manrope',
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    height: 1,
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
    fontFamily: 'Manrope',
  },
  
  section: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Manrope', fontWeight: '700', lineHeight: 22.5 },
  emptyDocs: { alignItems: 'center', justifyContent: 'center' },
  emptyDocsText: { fontFamily: 'Manrope', marginTop: 12 },
  documentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  documentIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  documentInfo: { flex: 1 },
  documentName: { fontFamily: 'Manrope', fontWeight: '700', lineHeight: 20 },
  documentMeta: { fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', lineHeight: 15, letterSpacing: 0.5 },
  smartwatchEmbed: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  infoCard: { borderRadius: 12, borderWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  infoLabel: { fontFamily: 'Manrope', flex: 1 },
  infoValue: { fontFamily: 'Manrope', fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 16, marginBottom: 32, gap: 8 },
  logoutButtonText: { fontFamily: 'Manrope', fontWeight: '700' },
  bottomNavigation: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { alignItems: 'center', gap: 4 },
  navItemActive: {},
  navText: { fontFamily: 'Manrope', fontWeight: '700', lineHeight: 15, textTransform: 'uppercase' },
});

export default PerfilPaciente;