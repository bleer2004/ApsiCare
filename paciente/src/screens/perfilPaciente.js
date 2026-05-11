import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const PerfilPaciente = ({ navigation }) => {
  const [syncing, setSyncing] = useState(false);

  const documentos = [
    {
      id: '1',
      nome: 'Laudo_Psicologico_V1.pdf',
      tipo: 'PDF',
      tamanho: '1.2 MB',
      cor: '#FEF2F2',
      iconColor: '#EF4444',
      icon: 'file-text',
    },
    {
      id: '2',
      nome: 'Exercicios_Respiracao.docx',
      tipo: 'DOCX',
      tamanho: '450 KB',
      cor: '#EFF6FF',
      iconColor: '#3B82F6',
      icon: 'file',
    },
    {
      id: '3',
      nome: 'Foto_Anotacoes_Quadro.jpg',
      tipo: 'JPEG',
      tamanho: '3.4 MB',
      cor: '#FFFBEB',
      iconColor: '#F59E0B',
      icon: 'image',
    },
  ];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      Alert.alert('Sincronização completa', 'Seus dados foram sincronizados com sucesso!');
    }, 2000);
  };

  const handleDownloadDocumento = (documento) => {
    Alert.alert('Download', `Baixando ${documento.nome}...`);
  };

  const handleVerResumo = () => {
    Alert.alert('Resumo médico', 'Funcionalidade em desenvolvimento');
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
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Dados de Saúde */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados de Saúde</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>IDADE</Text>
              <Text style={styles.statValue}>28</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALTURA</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>165</Text>
                <Text style={styles.statUnit}>cm</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PESO</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>62</Text>
                <Text style={styles.statUnit}>kg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Documentos Compartilhados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="folder" size={20} color="#B367D4" />
            <Text style={styles.sectionTitle}>Documentos Compartilhados</Text>
          </View>
          
          {documentos.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={styles.documentCard}
              onPress={() => handleDownloadDocumento(doc)}
            >
              <View style={[styles.documentIcon, { backgroundColor: doc.cor }]}>
                <Icon name={doc.icon} size={20} color={doc.iconColor} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.nome}</Text>
                <Text style={styles.documentMeta}>{doc.tipo} • {doc.tamanho}</Text>
              </View>
              <Icon name="more-horizontal" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Smartwatch Connection */}
        <View style={styles.smartwatchSection}>
          <View style={styles.smartwatchCard}>
            <View style={styles.smartwatchGradient} />
            <View style={styles.smartwatchIcon}>
              <Icon name="watch" size={42} color="#B367D4" />
            </View>
            <View style={styles.smartwatchBadge}>
              <Text style={styles.smartwatchBadgeText}>Conectado com smartwatch Galaxy 5</Text>
            </View>
          </View>
        </View>

        {/* Última Sincronização */}
        <View style={styles.syncSection}>
          <View style={styles.syncCard}>
            <View>
              <Text style={styles.syncLabel}>Última sincronização</Text>
              <Text style={styles.syncValue}>Hoje, 10:30</Text>
            </View>
            <View style={styles.syncStatusIcon}>
              <Icon name="check-circle" size={24} color="#16A34A" />
            </View>
          </View>
        </View>

        {/* Resumo Médico */}
        <View style={styles.section}>
          <Text style={styles.resumoTitle}>Resumo médico</Text>
          
          {/* Saúde cardíaca */}
          <TouchableOpacity style={styles.healthCard} onPress={handleVerResumo}>
            <View style={styles.healthHeader}>
              <View style={[styles.healthIcon, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="heart" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.healthTitle}>Saúde cardíaca</Text>
                <Text style={styles.healthSubtitle}>Seus batimentos estão estáveis</Text>
              </View>
            </View>
            <View style={styles.healthValueRow}>
              <Text style={styles.healthValue}>72</Text>
              <Text style={styles.healthUnit}>BPM</Text>
            </View>
            <View style={styles.healthProgressBar}>
              <View style={[styles.healthProgressFill, { width: '60%', backgroundColor: '#EF4444' }]} />
            </View>
          </TouchableOpacity>

          {/* Qualidade do sono */}
          <TouchableOpacity style={styles.healthCard} onPress={handleVerResumo}>
            <View style={styles.healthHeader}>
              <View style={[styles.healthIcon, { backgroundColor: '#EEF2FF' }]}>
                <Icon name="moon" size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.healthTitle}>Qualidade do sono</Text>
                <Text style={styles.healthSubtitle}>Você possui um sono pesado</Text>
              </View>
            </View>
            <View style={styles.sleepRow}>
              <View style={styles.sleepValueRow}>
                <Text style={styles.healthValue}>8.5</Text>
                <Text style={styles.healthUnit}>Hours</Text>
              </View>
              <View style={styles.excellentBadge}>
                <Text style={styles.excellentText}>Excellent</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botão Sync Now */}
        <TouchableOpacity style={styles.syncButton} onPress={handleSync} disabled={syncing}>
          <Icon name="refresh-cw" size={18} color="#FFFFFF" style={styles.syncIcon} />
          <Text style={styles.syncButtonText}>{syncing ? 'Sincronizando...' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DiarioPaciente')}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Journal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Goals</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="user" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  headerPlaceholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#191B23',
    lineHeight: 22.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#C3C6D7',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    textTransform: 'uppercase',
    color: '#737686',
    lineHeight: 16,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#191B23',
    lineHeight: 28,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statUnit: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#191B23',
    lineHeight: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  documentMeta: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  smartwatchSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  smartwatchCard: {
    backgroundColor: 'linear-gradient(163deg, rgba(43, 108, 238, 0.20) 0%, rgba(43, 108, 238, 0.05) 100%)',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.10)',
    position: 'relative',
    overflow: 'hidden',
  },
  smartwatchGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  smartwatchIcon: {
    marginBottom: 20,
  },
  smartwatchBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.20)',
  },
  smartwatchBadgeText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
    lineHeight: 16,
  },
  syncSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncLabel: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
  },
  syncValue: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
    marginTop: 4,
  },
  syncStatusIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#DCFCE7',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumoTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    lineHeight: 20,
    letterSpacing: 1.4,
    marginBottom: 16,
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  healthSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  healthValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  healthValue: {
    fontSize: 30,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 36,
  },
  healthUnit: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 24,
  },
  healthProgressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  healthProgressFill: {
    height: '100%',
    borderRadius: 10,
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  excellentBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  excellentText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#4338CA',
    lineHeight: 16,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B367D4',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  syncIcon: {
    marginRight: 8,
  },
  syncButtonText: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 15,
  },
  navTextActive: {
    color: '#B367D4',
  },
});

export default PerfilPaciente;