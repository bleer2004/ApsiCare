import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import Icon from 'react-native-vector-icons/Feather';
import BottomNav from '../../components/BottomNav';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

const USAR_MOCK = false;

const calcularIdade = (birthDate) => {
  if (!birthDate) return 0;
  const hoje = new Date();
  const nascimento = new Date(birthDate);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

const Pacientes = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pacientesData, setPacientesData] = useState([]);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [resumoClinico, setResumoClinico] = useState('');

  const mockData = [
    { id: '1', nome: 'Ana Clara Silva', ultimaSessao: 'Ontem, 14:00', status: 'ativo', idade: 32, diagnosticoPrincipal: 'F41.1 - Transtorno de Ansiedade Generalizada (TAG)', condicao: 'Anorexia', statusEmocional: 'Estável', melhoraPercentual: 15 },
    { id: '2', nome: 'Marcos Oliveira', ultimaSessao: '12 Out, 10:30', status: 'ativo', idade: 45, diagnosticoPrincipal: 'F32.2 - Transtorno Depressivo Maior', condicao: 'Depressão', statusEmocional: 'Instável', melhoraPercentual: 8 },
    { id: '3', nome: 'Beatriz Santos', ultimaSessao: '10 Out, 16:15', status: 'inativo', idade: 28, diagnosticoPrincipal: 'F40.1 - Fobia Social', condicao: 'Fobia Social', statusEmocional: 'Estável', melhoraPercentual: 22 },
    { id: '4', nome: 'Ricardo Pereira', ultimaSessao: '08 Out, 09:00', status: 'ativo', idade: 35, diagnosticoPrincipal: 'F31.3 - Transtorno Bipolar', condicao: 'Bipolar', statusEmocional: 'Instável', melhoraPercentual: 5 },
    { id: '5', nome: 'Juliana Farias', ultimaSessao: '05 Out, 11:30', status: 'recente', idade: 29, diagnosticoPrincipal: 'F33.2 - Depressão Recorrente', condicao: 'Depressão', statusEmocional: 'Estável', melhoraPercentual: 18 },
  ];

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    if (USAR_MOCK) {
      setPacientesData(mockData);
      return;
    }

    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/clinicians/${user.id}/patients`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const formatados = (data.patients || []).map(p => ({
          id: p.patientId || p.id,
          nome: p.name,
          ultimaSessao: p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'Sem sessão',
          status: p.isActive ? 'ativo' : 'inativo',
          idade: calcularIdade(p.birthDate),
          diagnosticoPrincipal: p.diagnostico || 'Aguardando diagnóstico',
          condicao: 'Em acompanhamento',
          statusEmocional: 'Estável',
          melhoraPercentual: 0,
        }));
        setPacientesData(formatados);
      }
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    }
  };

  const totalPacientes = pacientesData.length;
  const novosPacientes = pacientesData.filter(p => p.status === 'recente').length;

  const formatTelefone = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 2) return `(${cleaned}`;
      else if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      else if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
      else return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
    return text;
  };

  const getFilteredPacientes = () => {
    let filtered = pacientesData;
    if (searchText) {
      filtered = filtered.filter(p => p.nome.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (activeFilter === 'ativos') filtered = filtered.filter(p => p.status === 'ativo');
    else if (activeFilter === 'recentes') filtered = filtered.filter(p => p.status === 'recente');
    return filtered;
  };

  const handlePacientePress = (paciente) => {
    navigation.navigate('DashboardPaciente', { paciente });
  };

  const handleEnviarConvite = async (patientId) => {
    Alert.alert(
      'Enviar convite',
      'Deseja enviar um convite por e-mail para este paciente acessar o app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar', onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/patients/${patientId}/invite`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });

              const data = await response.json();

              if (!response.ok) {
                Alert.alert('Erro', data.error || 'Erro ao enviar convite');
                return;
              }

              Alert.alert('Convite enviado!', 'O paciente receberá um e-mail com as credenciais de acesso.');
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível enviar o convite');
            }
          }
        }
      ]
    );
  };

  const handleSalvarPaciente = async () => {
    if (!nomeCompleto) {
      Alert.alert('Erro', 'Por favor, preencha o nome completo');
      return;
    }
    if (!email) {
      Alert.alert('Erro', 'Por favor, preencha o e-mail');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Digite um e-mail válido');
      return;
    }

    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const token = await AsyncStorage.getItem('token');

      const formatDate = (date) => {
        if (!date) return null;
        const [day, month, year] = date.split('/');
        return `${year}-${month}-${day}`;
      };

      const response = await fetch(`${API_URL}/clinicians/${user.id}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: nomeCompleto,
          email,
          phone: telefone.replace(/\D/g, ''),
          birthDate: formatDate(dataNascimento),
          diagnostico,
          resumoClinico,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro ao cadastrar paciente');
        return;
      }

      const novoPaciente = {
        id: data.patient?.id || String(pacientesData.length + 1),
        nome: nomeCompleto,
        ultimaSessao: 'Primeira sessão',
        status: 'recente',
        idade: calcularIdade(formatDate(dataNascimento)),
        diagnosticoPrincipal: diagnostico || 'Aguardando diagnóstico',
        condicao: 'Em avaliação',
        statusEmocional: 'Estável',
        melhoraPercentual: 0,
      };

      setPacientesData(prev => [novoPaciente, ...prev]);

      const patientId = data.patient?.id;

      setNomeCompleto('');
      setEmail('');
      setTelefone('');
      setDataNascimento('');
      setDiagnostico('');
      setResumoClinico('');
      setModalVisible(false);

      Alert.alert(
        'Paciente cadastrado!',
        'Deseja enviar um convite por e-mail para o paciente acessar o app?',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Enviar convite', onPress: () => handleEnviarConvite(patientId) }
        ]
      );

    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nome) => {
    return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const renderPacienteCard = ({ item }) => {
    const initials = getInitials(item.nome);
    
    return (
      <TouchableOpacity
        style={styles.pacienteCard}
        onPress={() => handlePacientePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.pacienteAvatarInitial}>
          <Text style={styles.avatarInitialText}>{initials}</Text>
        </View>
        <View style={styles.pacienteInfo}>
          <Text style={styles.pacienteNome}>{item.nome}</Text>
          <View style={styles.sessaoContainer}>
            <Icon name="calendar" size={12} color="#64748B" />
            <Text style={styles.pacienteUltimaSessao}>Última sessão: {item.ultimaSessao}</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={18} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  const filteredPacientes = getFilteredPacientes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Icon name="users" size={22} color="#B367D4" />
            </View>
            <Text style={styles.headerTitle}>Pacientes</Text>
          </View>
        </View>

        {/* Card Total de Pacientes */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total de Pacientes</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalNumber}>{totalPacientes}</Text>
            <View style={styles.totalBadge}>
              <Icon name="plus-circle" size={12} color="white" />
              <Text style={styles.totalBadgeText}>+{novosPacientes} este mês</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ..."
          placeholderTextColor="#6B7280"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'todos' && styles.filterChipActive]} 
          onPress={() => setActiveFilter('todos')}
        >
          <Text style={[styles.filterText, activeFilter === 'todos' && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChipOutline, activeFilter === 'ativos' && styles.filterChipOutlineActive]} 
          onPress={() => setActiveFilter('ativos')}
        >
          <Text style={[styles.filterOutlineText, activeFilter === 'ativos' && styles.filterOutlineTextActive]}>Ativos</Text>
          <Icon name="chevron-down" size={12} color="#475569" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChipOutline, activeFilter === 'recentes' && styles.filterChipOutlineActive]} 
          onPress={() => setActiveFilter('recentes')}
        >
          <Text style={[styles.filterOutlineText, activeFilter === 'recentes' && styles.filterOutlineTextActive]}>Recentes</Text>
          <Icon name="chevron-down" size={12} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Pacientes List */}
      <FlatList
        data={filteredPacientes}
        keyExtractor={(item) => item.id}
        renderItem={renderPacienteCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.pacientesList, { paddingBottom: 80 }]}
      />

      {/* FAB Button */}
      <TouchableOpacity style={styles.fabButton} onPress={() => navigation.navigate('CadastroPaciente')}>
        <Icon name="user-plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de Cadastro */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar novo paciente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Informações básicas</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome Completo *</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Digite o nome completo" value={nomeCompleto} onChangeText={setNomeCompleto} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail *</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="exemplo@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="(00) 00000-0000" value={telefone} onChangeText={(text) => setTelefone(formatTelefone(text))} keyboardType="phone-pad" />
                </View>
              </View>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Informações clínicas</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Diagnóstico Principal</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="file-text" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Digite o diagnóstico" value={diagnostico} onChangeText={setDiagnostico} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Resumo Clínico</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Icon name="clipboard" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descreva brevemente o histórico..." value={resumoClinico} onChangeText={setResumoClinico} multiline numberOfLines={3} textAlignVertical="top" />
                </View>
              </View>
              <TouchableOpacity style={styles.cadastrarButton} onPress={handleSalvarPaciente} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.cadastrarButtonText}>Cadastrar Paciente</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation - Componente reutilizável */}
      <BottomNav navigation={navigation} currentScreen="Pacientes" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  // Header
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    padding: 8,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    borderRadius: 8,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
  },
  // Total Card
  totalCard: {
    padding: 24,
    backgroundColor: '#B367D4',
    borderRadius: 12,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  totalLabel: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    opacity: 0.9,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  totalNumber: {
    color: 'white',
    fontSize: 36,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 40,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 9999,
    marginBottom: 8,
  },
  totalBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
  },
  // Search
  searchContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#B367D4',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#B367D4',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 16,
  },
  filterTextActive: {
    color: 'white',
  },
  filterChipOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterChipOutlineActive: {
    borderColor: '#B367D4',
  },
  filterOutlineText: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 16,
  },
  filterOutlineTextActive: {
    color: '#B367D4',
  },
  // List
  pacientesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pacienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pacienteAvatarInitial: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    borderWidth: 2,
    borderColor: 'rgba(179, 103, 212, 0.10)',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    color: '#B367D4',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  pacienteInfo: {
    flex: 1,
  },
  pacienteNome: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 4,
  },
  sessaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pacienteUltimaSessao: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
  },
  // FAB
  fabButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B367D4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  cadastrarButton: {
    backgroundColor: '#B367D4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  cadastrarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default Pacientes;