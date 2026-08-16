import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAccessibilityStyles } from '../hooks/useAccessibilityStyles';

const MetasPaciente = ({ navigation }) => {
  const [metasList, setMetasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Hooks de acessibilidade
  const {
    baixaVisao,
    daltonismo,
    getColors,
    getTextStyle,
    getButtonStyle,
    getCardStyle,
    getIconProps,
    getSpacing,
    adaptarCor,
  } = useAccessibilityStyles();

  const colors = getColors();

  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const response = await fetch(`${API_URL}/patients/${user.id}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const metasComAtraso = (data.goals || []).map(meta => ({
          ...meta,
          isOverdue: verificarAtraso(meta.prazo, meta.status)
        }));
        setMetasList(metasComAtraso);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verificarAtraso = (prazo, status) => {
    if (!prazo || prazo === 'Sem prazo definido') return false;
    if (status === 'concluido') return false;
    
    const partes = prazo.split('/');
    if (partes.length !== 3) return false;
    
    const dataPrazo = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return dataPrazo < hoje;
  };

  const atualizarStatusMeta = async (metaId, novoStatus) => {
    setUpdatingId(metaId);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      
      let progressoTexto = '';
      if (novoStatus === 'concluido') progressoTexto = 'Concluído!';
      else if (novoStatus === 'andamento') progressoTexto = 'Em andamento';
      else progressoTexto = 'Não iniciada';
      
      const response = await fetch(`${API_URL}/patients/${user.id}/goals/${metaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus, progresso: progressoTexto })
      });
      
      if (response.ok) {
        await carregarMetas();
        Alert.alert('Sucesso', `Meta ${novoStatus === 'concluido' ? 'concluída' : 'iniciada'} com sucesso!`);
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a meta');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar a meta');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status, isOverdue) => {
    if (status === 'concluido') return '#22C55E';
    if (status === 'andamento') return '#F59E0B';
    if (isOverdue && status !== 'concluido') return '#EF4444';
    return '#B367D4';
  };

  const getStatusLabel = (status, isOverdue) => {
    if (status === 'concluido') return 'Concluída';
    if (status === 'andamento') return 'Em progresso';
    if (isOverdue) return 'Em atraso';
    return 'Ativa';
  };

  const metasAtivas = metasList.filter(m => m.status !== 'concluido' && m.status !== 'andamento' && !m.isOverdue);
  const metasEmProgresso = metasList.filter(m => m.status === 'andamento' && !m.isOverdue);
  const metasEmAtraso = metasList.filter(m => m.isOverdue && m.status !== 'concluido');
  const metasConcluidas = metasList.filter(m => m.status === 'concluido');

  const renderMetaCard = (meta, showActions = true) => {
    const isOverdue = meta.isOverdue;
    const statusColor = getStatusColor(meta.status, isOverdue);
    const statusLabel = getStatusLabel(meta.status, isOverdue);
    const isUpdating = updatingId === meta.id;
    const adaptStatusColor = adaptarCor(statusColor);
    
    return (
      <View key={meta.id} style={[
        styles.metaCard,
        { 
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          padding: baixaVisao ? 20 : 16,
        },
        isOverdue && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
        meta.status === 'concluido' && { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
      ]}>
        <View style={styles.metaHeader}>
          <View style={styles.metaInfo}>
            <View style={[styles.metaCategoryBadge, { backgroundColor: adaptStatusColor + '20' }]}>
              <Text style={[
                styles.metaCategoryText,
                getTextStyle('small', adaptStatusColor, '700'),
                { textTransform: 'uppercase' }
              ]}>
                {statusLabel}
              </Text>
            </View>
            <Text style={[
              styles.metaTitle,
              getTextStyle('medium', colors.text, '700'),
              meta.status === 'concluido' && styles.metaTitleCompleted
            ]}>{meta.titulo}</Text>
            <Text style={[
              styles.metaDescription,
              getTextStyle('small', colors.textSecondary)
            ]}>{meta.progresso || 'Meta cadastrada'}</Text>
            {meta.prazo && meta.prazo !== 'Sem prazo definido' && (
              <View style={[
                styles.prazoRow,
                isOverdue && styles.prazoRowOverdue
              ]}>
                <Icon name="calendar" {...getIconProps('calendar', 'small', isOverdue ? '#EF4444' : colors.textMuted)} />
                <Text style={[
                  styles.prazoText,
                  getTextStyle('small', isOverdue ? '#DC2626' : colors.textMuted, '500'),
                  isOverdue && styles.prazoTextOverdue
                ]}>
                  Prazo: {meta.prazo} {isOverdue && '(Atrasada)'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {showActions && meta.status !== 'concluido' && (
          <View style={[styles.metaActions, { borderTopColor: colors.border }]}>
            {meta.status !== 'andamento' && (
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  isOverdue ? { backgroundColor: adaptarCor('#EF4444') } : { backgroundColor: colors.primary },
                  { paddingVertical: baixaVisao ? 14 : 10 }
                ]} 
                onPress={() => atualizarStatusMeta(meta.id, 'andamento')}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={[styles.actionButtonText, getTextStyle('small', '#FFFFFF', '600')]}>
                    {isOverdue ? 'Iniciar mesmo assim' : 'Iniciar'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {meta.status === 'andamento' && (
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  { backgroundColor: adaptarCor('#22C55E') },
                  { paddingVertical: baixaVisao ? 14 : 10 }
                ]} 
                onPress={() => atualizarStatusMeta(meta.id, 'concluido')}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={[styles.actionButtonText, getTextStyle('small', '#FFFFFF', '600')]}>Concluir</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {meta.status === 'concluido' && (
          <View style={styles.completedIconContainer}>
            <Icon name="check-circle" {...getIconProps('check-circle', 'large', '#22C55E')} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={baixaVisao ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[
          styles.header,
          { 
            backgroundColor: baixaVisao ? colors.background : 'rgba(246, 246, 248, 0.80)',
            borderBottomColor: colors.border,
          }
        ]}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" {...getIconProps('arrow-left', 'medium', colors.text)} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, getTextStyle('large', colors.text, '700')]}>Minhas metas</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.statsContainer, { paddingHorizontal: getSpacing('large'), gap: getSpacing('small') }]}>
          <View style={[
            styles.statCard,
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              padding: baixaVisao ? 18 : 14,
            }
          ]}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: adaptarCor('#22C55E') }]} />
              <Text style={[styles.statTitle, getTextStyle('small', colors.textSecondary, '600')]}>Concluídas</Text>
            </View>
            <Text style={[styles.statNumber, getTextStyle('xlarge', colors.text, '800')]}>{metasConcluidas.length}</Text>
          </View>
          <View style={[
            styles.statCard,
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              padding: baixaVisao ? 18 : 14,
            }
          ]}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: adaptarCor('#F59E0B') }]} />
              <Text style={[styles.statTitle, getTextStyle('small', colors.textSecondary, '600')]}>Em progresso</Text>
            </View>
            <Text style={[styles.statNumber, getTextStyle('xlarge', colors.text, '800')]}>{metasEmProgresso.length}</Text>
          </View>
          <View style={[
            styles.statCard,
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              padding: baixaVisao ? 18 : 14,
            }
          ]}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: adaptarCor('#EF4444') }]} />
              <Text style={[styles.statTitle, getTextStyle('small', colors.textSecondary, '600')]}>Em atraso</Text>
            </View>
            <Text style={[styles.statNumber, getTextStyle('xlarge', colors.text, '800')]}>{metasEmAtraso.length}</Text>
          </View>
        </View>

        <View style={[styles.metasContainer, { paddingHorizontal: getSpacing('medium'), gap: getSpacing('medium') }]}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : metasList.length === 0 ? (
            <View style={[styles.emptyState, { paddingVertical: baixaVisao ? 80 : 60 }]}>
              <Icon name="target" {...getIconProps('target', 'xlarge', colors.textMuted)} />
              <Text style={[styles.emptyTitle, getTextStyle('large', colors.text, '600')]}>Nenhuma meta ainda</Text>
              <Text style={[styles.emptyText, getTextStyle('medium', colors.textSecondary)]}>Seu psicólogo ainda não cadastrou metas para você.</Text>
            </View>
          ) : (
            <>
              {metasEmAtraso.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, getTextStyle('medium', colors.textSecondary, '700')]}>⚠️ Em atraso</Text>
                  {metasEmAtraso.map(meta => renderMetaCard(meta, true))}
                </>
              )}
              
              {metasAtivas.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, getTextStyle('medium', colors.textSecondary, '700')]}>📌 Ativas</Text>
                  {metasAtivas.map(meta => renderMetaCard(meta, true))}
                </>
              )}
              
              {metasEmProgresso.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, getTextStyle('medium', colors.textSecondary, '700')]}>⚡ Em progresso</Text>
                  {metasEmProgresso.map(meta => renderMetaCard(meta, true))}
                </>
              )}
              
              {metasConcluidas.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, getTextStyle('medium', colors.textSecondary, '700')]}>✅ Concluídas</Text>
                  {metasConcluidas.map(meta => renderMetaCard(meta, false))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View style={[
        styles.bottomNavigation,
        {
          backgroundColor: baixaVisao ? colors.cardBackground : 'rgba(255, 255, 255, 0.80)',
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" {...getIconProps('home', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" {...getIconProps('book-open', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="target" {...getIconProps('target', 'medium', colors.primary)} />
          <Text style={[styles.navText, getTextStyle('small', colors.primary, '700')]}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" {...getIconProps('user', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 22.5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 15,
  },
  statNumber: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    lineHeight: 36,
  },
  metasContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  metaCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaInfo: {
    flex: 1,
    gap: 6,
  },
  metaCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  metaCategoryText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 14,
  },
  metaTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 22,
  },
  metaTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  metaDescription: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
  },
  prazoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  prazoRowOverdue: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  prazoText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  prazoTextOverdue: {
    color: '#DC2626',
  },
  metaActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  completedIconContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
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
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {},
  navText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 15,
    textTransform: 'uppercase',
  },
});

export default MetasPaciente;