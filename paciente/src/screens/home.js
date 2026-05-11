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
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const HomePaciente = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const [selectedMood, setSelectedMood] = useState(null);

  const moods = [
    { id: 'feliz', label: 'Feliz', color: '#E3F2FD', iconColor: '#2563EB', icon: 'smile' },
    { id: 'calmo', label: 'Calmo', color: '#E0F2F1', iconColor: '#0D9488', icon: 'wind' },
    { id: 'ansioso', label: 'Ansioso', color: '#F3E5F5', iconColor: '#9333EA', icon: 'zap' },
    { id: 'triste', label: 'Triste', color: '#FCE4EC', iconColor: '#DB2777', icon: 'frown' },
    { id: 'neutral', label: 'Neutral', color: '#F1F5F9', iconColor: '#64748B', icon: 'meh' },
  ];

  const metas = [
    { id: '1', titulo: '10 min de meditação', concluido: true },
    { id: '2', titulo: '2L de água', concluido: true },
    { id: '3', titulo: 'Caminhada de 30 minutos', concluido: false },
  ];

  const dadosGrafico = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{
      data: [42, 74, 53, 95, 68, 47, 21],
      color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
    }],
  };

  const handleMoodPress = (mood) => {
    setSelectedMood(mood.id);
    Alert.alert('Humor registrado', `Você está se sentindo ${mood.label}!`);
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Ligar para emergência',
      'Tem certeza que deseja ligar para o serviço de emergência?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar', onPress: () => Alert.alert('Chamada', 'Ligando para emergência...') }
      ]
    );
  };

  const calcularProgresso = () => {
    const concluidas = metas.filter(m => m.concluido).length;
    return Math.round((concluidas / metas.length) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header com Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <View style={styles.avatar}>
                <Image 
                  source={{ uri: 'https://placehold.co/36x36' }} 
                  style={styles.avatarImage}
                />
              </View>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Olá, espero que esteja tendo um bom dia,</Text>
            <Text style={styles.userName}>Sarah Mitchell</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="bell" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Como está se sentindo hoje? */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>Como está se sentindo hoje?</Text>
          <View style={styles.moodContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  selectedMood === mood.id && styles.moodItemSelected
                ]}
                onPress={() => handleMoodPress(mood)}
              >
                <View style={[styles.moodIconWrapper, { backgroundColor: mood.color }]}>
                  <Icon name={mood.icon} size={24} color={mood.iconColor} />
                </View>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Emergência */}
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
          <Text style={styles.emergencyButtonText}>Ligar para emergência</Text>
        </TouchableOpacity>

        {/* Ideia diária */}
        <View style={styles.ideaSection}>
          <Text style={styles.sectionTitle}>Ideia diária</Text>
          <View style={styles.ideaCard}>
            <View style={styles.ideaBlur} />
            <View style={styles.ideaContent}>
              <View style={styles.ideaHeader}>
                <View style={styles.ideaAvatarContainer}>
                  <View style={styles.ideaAvatarBorder}>
                    <Image 
                      source={{ uri: 'https://placehold.co/44x44' }} 
                      style={styles.ideaAvatar}
                    />
                  </View>
                </View>
                <View style={styles.ideaTextContainer}>
                  <Text style={styles.ideaDoctorName}>Dr. Robinson Abraham</Text>
                  <Text style={styles.ideaQuote}>
                    “Pense de forma calma com a mente limpa, tome água ”
                  </Text>
                </View>
              </View>
              <View style={styles.ideaTimeContainer}>
                <View style={styles.ideaTimeBadge}>
                  <Text style={styles.ideaTimeText}>Hoje, 10:00</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Anotações diárias */}
        <TouchableOpacity style={styles.notesCard}>
          <View style={styles.notesIconWrapper}>
            <Icon name="edit-2" size={18} color="#B367D4" />
          </View>
          <View style={styles.notesTextContainer}>
            <Text style={styles.notesTitle}>Anotações diárias</Text>
            <Text style={styles.notesSubtitle}>Escreva suas anotações diárias</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Progresso de metas */}
        <View style={styles.goalsCard}>
          <View style={styles.goalsHeader}>
            <Text style={styles.goalsTitle}>Progresso de metas</Text>
            <Text style={styles.goalsPercentage}>{calcularProgresso()}%</Text>
          </View>
          
          <View style={styles.goalsList}>
            {metas.map((meta) => (
              <View key={meta.id} style={styles.goalItem}>
                <View style={[styles.goalCheckbox, meta.concluido && styles.goalCheckboxActive]}>
                  {meta.concluido && <Icon name="check" size={10} color="#FFFFFF" />}
                </View>
                <Text style={[styles.goalText, meta.concluido && styles.goalTextCompleted]}>
                  {meta.titulo}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${calcularProgresso()}%` }]} />
          </View>
        </View>

        {/* Gráfico semanal */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Gráfico semanal</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={dadosGrafico}
              width={screenWidth - 48}
              height={140}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(179, 103, 212, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#B367D4' },
              }}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `${value}`}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="home" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Icon name="book-open" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Diário</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
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
    padding: 16,
    backgroundColor: '#F6F6F8',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(43, 108, 238, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 12,
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  moodSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  moodItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: 2,
  },
  moodItemSelected: {
    opacity: 0.7,
  },
  moodIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  emergencyButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#E2E8F0',
    lineHeight: 24,
    textAlign: 'center',
  },
  ideaSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  ideaCard: {
    backgroundColor: '#B367D4',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  ideaBlur: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 64,
  },
  ideaContent: {
    padding: 24,
  },
  ideaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ideaAvatarContainer: {
    marginRight: 16,
  },
  ideaAvatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    overflow: 'hidden',
  },
  ideaAvatar: {
    width: '100%',
    height: '100%',
  },
  ideaTextContainer: {
    flex: 1,
  },
  ideaDoctorName: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 4,
  },
  ideaQuote: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.80)',
    lineHeight: 20,
  },
  ideaTimeContainer: {
    alignItems: 'flex-start',
  },
  ideaTimeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ideaTimeText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  notesIconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(43, 108, 238, 0.10)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notesTextContainer: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  notesSubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  goalsPercentage: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#B367D4',
    lineHeight: 16,
  },
  goalsList: {
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(43, 108, 238, 0.30)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckboxActive: {
    backgroundColor: '#B367D4',
    borderColor: '#B367D4',
  },
  goalText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#1E293B',
    lineHeight: 20,
  },
  goalTextCompleted: {
    color: '#475569',
    textDecorationLine: 'line-through',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#B367D4',
    borderRadius: 20,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
    alignItems: 'center',
  },
  chart: {
    marginLeft: -25,
    borderRadius: 16,
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

export default HomePaciente;