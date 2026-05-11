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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const MetasPaciente = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('emocional');

  const metasAtivas = [
    {
      id: '1',
      titulo: 'Reflexão matinal',
      descricao: 'Reflita sobre seus sentimentos por 5 minutos',
      categoria: 'Mental',
      progresso: 5,
      total: 7,
      cor: '#B367D4',
    },
  ];

  const metasConcluidas = [
    {
      id: '2',
      titulo: 'Identifique gatilhos',
      descricao: 'Marcado como concluído',
      categoria: 'Completa',
      cor: '#22C55E',
    },
  ];

  const stats = {
    completas: 12,
    ativas: 4,
    aumento: '+3 this week',
  };

  const progressoGeral = 75;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header com Blur */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Minhas metas</Text>
          </View>
          <TouchableOpacity style={styles.headerAddButton}>
            <View style={styles.addButtonInner}>
              <Icon name="plus" size={18} color="#B367D4" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Perfil e Progresso */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInnerRing} />
            </View>
            <View style={styles.avatarImageContainer}>
              <Image 
                source={{ uri: 'https://placehold.co/96x96' }} 
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL 5</Text>
            </View>
          </View>
          
          <View style={styles.congratsContainer}>
            <Text style={styles.congratsTitle}>Muito bem, Sarah</Text>
            <Text style={styles.congratsSubtitle}>
              {progressoGeral}% das suas metas semanais foram atingidas
            </Text>
          </View>
        </View>

        {/* Cards de Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.statTitle}>Completas</Text>
            </View>
            <View style={styles.statValueContainer}>
              <Text style={styles.statNumber}>{stats.completas}</Text>
              <Text style={[styles.statTrend, { color: '#22C55E' }]}>{stats.aumento}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: '#B367D4' }]} />
              <Text style={styles.statTitle}>Ativas</Text>
            </View>
            <View style={styles.statValueContainer}>
              <Text style={styles.statNumber}>{stats.ativas}</Text>
              <Text style={[styles.statTrend, { color: '#94A3B8' }]}>Em progresso</Text>
            </View>
          </View>
        </View>

        {/* Tabs de Categoria */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsInner}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'emocional' && styles.tabActive]}
              onPress={() => setActiveTab('emocional')}
            >
              <Text style={[styles.tabText, activeTab === 'emocional' && styles.tabTextActive]}>
                Emocional
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'comportamental' && styles.tabActive]}
              onPress={() => setActiveTab('comportamental')}
            >
              <Text style={[styles.tabText, activeTab === 'comportamental' && styles.tabTextActive]}>
                Comportamental
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Metas */}
        <View style={styles.metasContainer}>
          <Text style={styles.sectionTitle}>Metas ativas</Text>
          
          {/* Meta Ativa */}
          {metasAtivas.map((meta) => (
            <View key={meta.id} style={styles.metaCard}>
              <View style={styles.metaHeader}>
                <View style={styles.metaInfo}>
                  <View style={styles.metaCategoryBadge}>
                    <Text style={[styles.metaCategoryText, { color: meta.cor }]}>
                      {meta.categoria}
                    </Text>
                  </View>
                  <Text style={styles.metaTitle}>{meta.titulo}</Text>
                  <Text style={styles.metaDescription}>{meta.descricao}</Text>
                </View>
                <TouchableOpacity style={styles.metaMenuButton}>
                  <Icon name="more-horizontal" size={18} color="#B367D4" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Meta: {meta.total} dias</Text>
                  <Text style={styles.progressValue}>{meta.progresso}/{meta.total} dias</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${(meta.progresso / meta.total) * 100}%`, backgroundColor: meta.cor }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Meta Concluída */}
          {metasConcluidas.map((meta) => (
            <View key={meta.id} style={[styles.metaCard, styles.metaCompleted]}>
              <View style={styles.metaHeader}>
                <View style={styles.metaInfo}>
                  <View style={styles.completedBadge}>
                    <Icon name="check-circle" size={12} color="#22C55E" />
                    <Text style={styles.completedText}>{meta.categoria}</Text>
                  </View>
                  <Text style={[styles.metaTitle, styles.metaTitleCompleted]}>
                    {meta.titulo}
                  </Text>
                  <Text style={styles.metaDescription}>{meta.descricao}</Text>
                </View>
                <View style={styles.completedIconContainer}>
                  <Icon name="check" size={20} color="#FFFFFF" />
                </View>
              </View>
            </View>
          ))}

          {/* Ver histórico */}
          <TouchableOpacity style={styles.historyButton}>
            <Text style={styles.historyButtonText}>Ver histórico completo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="target" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Metas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Perfil</Text>
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
    paddingVertical: 16,
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    backdropFilter: 'blur(6px)',
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
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22.5,
  },
  headerAddButton: {
    width: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addButtonInner: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(43, 108, 238, 0.10)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 128,
    height: 128,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarInnerRing: {
    width: 116,
    height: 116,
    position: 'absolute',
    top: 6,
    left: 6,
    borderWidth: 8,
    borderColor: '#E2E8F0',
    borderRadius: 58,
  },
  avatarImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 128,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#F6F6F8',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FACC15',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#F6F6F8',
  },
  levelText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 15,
  },
  congratsContainer: {
    alignItems: 'center',
  },
  congratsTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 32,
    textAlign: 'center',
  },
  congratsSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F2EEF6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.10)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 32,
  },
  statTrend: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 16,
  },
  tabsContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabsInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(226, 232, 240, 0.50)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 20,
  },
  tabTextActive: {
    color: '#B367D4',
  },
  metasContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94A3B8',
    lineHeight: 20,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaInfo: {
    flex: 1,
    gap: 4,
  },
  metaCategoryBadge: {
    backgroundColor: 'rgba(43, 108, 238, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  metaCategoryText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  metaTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  metaTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  metaDescription: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  metaMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 8,
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 15,
  },
  progressValue: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#94A3B8',
    lineHeight: 15,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#16A34A',
    lineHeight: 15,
  },
  completedIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#22C55E',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  historyButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
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
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  navTextActive: {
    color: '#B367D4',
    fontWeight: '700',
  },
});

export default MetasPaciente;