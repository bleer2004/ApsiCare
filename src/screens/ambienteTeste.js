import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const AmbienteTeste = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconWrapper}>
            <Icon name="heart" size={40} color="#B367D4" />
          </View>
          <Text style={styles.logoText}>ApsiCare</Text>
          <Text style={styles.logoSubtext}>Plataforma clínica de saúde mental</Text>
        </View>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ambiente de Teste</Text>
          <Text style={styles.subtitle}>Selecione o perfil para acessar o sistema</Text>
        </View>

        {/* Botões de seleção */}
        <View style={styles.buttonsContainer}>
          {/* Botão Psicólogo */}
          <TouchableOpacity 
            style={[styles.card, styles.psychologistCard]}
            onPress={() => navigation.replace('LoginSignedUp')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconWrapper}>
              <Icon name="briefcase" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>Psicólogo</Text>
            <Text style={[styles.cardDescription, { color: 'rgba(255,255,255,0.85)' }]}>
              Acesse o painel profissional, gerencie pacientes, visualize relatórios e análises clínicas.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardButtonText}>Acessar →</Text>
            </View>
          </TouchableOpacity>

          {/* Botão Paciente */}
          <TouchableOpacity 
            style={[styles.card, styles.patientCard]}
            onPress={() => navigation.replace('LoginPaciente')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconWrapper, styles.patientIconWrapper]}>
              <Icon name="user" size={32} color="#B367D4" />
            </View>
            <Text style={[styles.cardTitle, { color: '#0F172A' }]}>Paciente</Text>
            <Text style={[styles.cardDescription, { color: '#64748B' }]}>
              Acesse seu diário emocional, acompanhe metas, visualize documentos e compartilhe com seu psicólogo.
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardButtonText, styles.patientButtonText]}>Acessar →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <Icon name="shield" size={12} color="#10B981" />
            <Text style={styles.securityText}>Ambiente Seguro & Criptografado</Text>
          </View>
          <Text style={styles.versionText}>Versão 1.0.0 - Ambiente de Testes</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconWrapper: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 36,
  },
  logoSubtext: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    marginTop: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  psychologistCard: {
    backgroundColor: '#B367D4',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientIconWrapper: {
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  psychologistCard: {
    backgroundColor: '#B367D4',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 16,
    opacity: 0.85,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  patientButtonText: {
    color: '#B367D4',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  securityText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#10B981',
    textTransform: 'uppercase',
    lineHeight: 16.5,
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#94A3B8',
    lineHeight: 14,
  },
});

export default AmbienteTeste;