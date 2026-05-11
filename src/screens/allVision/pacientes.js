import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';

const Pacientes = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [resumoClinico, setResumoClinico] = useState('');

  // Dados mockados dos pacientes
  const [pacientesData, setPacientesData] = useState([
    {
      id: '1',
      nome: 'Ana Clara Silva',
      ultimaSessao: 'Ontem, 14:00',
      status: 'ativo',
      idade: 32,
      diagnosticoPrincipal: 'F41.1 - Transtorno de Ansiedade Generalizada (TAG)',
      condicao: 'Anorexia',
      statusEmocional: 'Estável',
      melhoraPercentual: 15,
    },
    {
      id: '2',
      nome: 'Marcos Oliveira',
      ultimaSessao: '12 Out, 10:30',
      status: 'ativo',
      idade: 45,
      diagnosticoPrincipal: 'F32.2 - Transtorno Depressivo Maior',
      condicao: 'Depressão',
      statusEmocional: 'Instável',
      melhoraPercentual: 8,
    },
    {
      id: '3',
      nome: 'Beatriz Santos',
      ultimaSessao: '10 Out, 16:15',
      status: 'inativo',
      idade: 28,
      diagnosticoPrincipal: 'F40.1 - Fobia Social',
      condicao: 'Fobia Social',
      statusEmocional: 'Estável',
      melhoraPercentual: 22,
    },
    {
      id: '4',
      nome: 'Ricardo Pereira',
      ultimaSessao: '08 Out, 09:00',
      status: 'ativo',
      idade: 51,
      diagnosticoPrincipal: 'F41.0 - Transtorno de Pânico',
      condicao: 'Pânico',
      statusEmocional: 'Estável',
      melhoraPercentual: 12,
    },
    {
      id: '5',
      nome: 'Juliana Farias',
      ultimaSessao: '05 Out, 11:30',
      status: 'inativo',
      idade: 37,
      diagnosticoPrincipal: 'F42.0 - Transtorno Obsessivo-Compulsivo',
      condicao: 'TOC',
      statusEmocional: 'Instável',
      melhoraPercentual: 5,
    },
    {
      id: '6',
      nome: 'Fernanda Costa',
      ultimaSessao: '03 Out, 15:45',
      status: 'ativo',
      idade: 29,
      diagnosticoPrincipal: 'F43.1 - Transtorno de Estresse Pós-Traumático',
      condicao: 'TEPT',
      statusEmocional: 'Estável',
      melhoraPercentual: 18,
    },
    {
      id: '7',
      nome: 'Gustavo Lima',
      ultimaSessao: '30 Set, 09:30',
      status: 'recente',
      idade: 24,
      diagnosticoPrincipal: 'F31.2 - Transtorno Bipolar',
      condicao: 'Bipolar',
      statusEmocional: 'Instável',
      melhoraPercentual: 10,
    },
  ]);

  const totalPacientes = pacientesData.length;
  const novosPacientes = pacientesData.filter(p => p.status === 'recente').length;

  const formatTelefone = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 2) {
        return `(${cleaned}`;
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      } else if (cleaned.length <= 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
      } else {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
      }
    }
    return text;
  };

  const getFilteredPacientes = () => {
    let filtered = pacientesData;
    
    if (searchText) {
      filtered = filtered.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (activeFilter === 'ativos') {
      filtered = filtered.filter(paciente => paciente.status === 'ativo');
    } else if (activeFilter === 'recentes') {
      filtered = filtered.filter(paciente => paciente.status === 'recente');
    }
    
    return filtered;
  };

  // ========== FUNÇÃO PARA NAVEGAR AO PERFIL DO PACIENTE ==========
  const handlePacientePress = (paciente) => {
    console.log('Abrindo perfil do paciente:', paciente.nome);
    // Navega para a tela de perfil passando os dados do paciente
    navigation.navigate('DashboardPaciente', { paciente });
  };

  const handleEnviarConvite = () => {
    Alert.alert('Convite enviado', `Um e-mail de convite foi enviado para ${email}`);
  };

  const handleSalvarPaciente = () => {
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
    
    setTimeout(() => {
      const novoPaciente = {
        id: String(pacientesData.length + 1),
        nome: nomeCompleto,
        ultimaSessao: 'Primeira sessão',
        status: 'recente',
        idade: 0,
        diagnosticoPrincipal: diagnostico || 'Aguardando diagnóstico',
        condicao: 'Em avaliação',
        statusEmocional: 'Estável',
        melhoraPercentual: 0,
      };
      
      setPacientesData([novoPaciente, ...pacientesData]);
      
      setNomeCompleto('');
      setEmail('');
      setTelefone('');
      setDiagnostico('');
      setResumoClinico('');
      
      setLoading(false);
      setModalVisible(false);
      
      Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!');
    }, 1500);
  };

  const renderPacienteCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.pacienteCard}
      onPress={() => handlePacientePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.pacienteAvatar}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.nome.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
      </View>
      
      <View style={styles.pacienteInfo}>
        <Text style={styles.pacienteNome}>{item.nome}</Text>
        <View style={styles.sessaoContainer}>
          <Icon name="calendar" size={14} color="#9CA3AF" />
          <Text style={styles.pacienteUltimaSessao}>
            Última sessão: {item.ultimaSessao}
          </Text>
        </View>
        <View style={styles.diagnosticoContainer}>
          <Icon name="file-text" size={12} color="#9CA3AF" />
          <Text style={styles.pacienteDiagnostico} numberOfLines={1}>
            {item.diagnosticoPrincipal}
          </Text>
        </View>
      </View>
      
      <Icon name="chevron-right" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const filteredPacientes = getFilteredPacientes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Pacientes</Text>
          <View style={styles.totalContainer}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalNumber}>{totalPacientes}</Text>
              <Text style={styles.totalLabel}>Total de Pacientes</Text>
            </View>
            <View style={styles.novoBadge}>
              <Icon name="plus-circle" size={14} color="#10B981" />
              <Text style={styles.novoTexto}>+{novosPacientes} este mês</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'todos' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('todos')}
          >
            <Text style={[styles.filterText, activeFilter === 'todos' && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'ativos' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('ativos')}
          >
            <Text style={[styles.filterText, activeFilter === 'ativos' && styles.filterTextActive]}>Ativos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'recentes' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('recentes')}
          >
            <Text style={[styles.filterText, activeFilter === 'recentes' && styles.filterTextActive]}>Recentes</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredPacientes}
          keyExtractor={(item) => item.id}
          renderItem={renderPacienteCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pacientesList}
        />
      </View>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VisaoGeral')}>
          <Icon name="home" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="users" size={24} color="#6366F1" />
          <Text style={[styles.navText, styles.navTextActive]}>Pacientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Relatorios')}>
          <Icon name="bar-chart-2" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.fabButton} onPress={() => setModalVisible(true)}>
        <Icon name="user-plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MODAL de cadastro */}
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

              <TouchableOpacity style={styles.conviteButton} onPress={handleEnviarConvite}>
                <Icon name="mail" size={18} color="#6366F1" />
                <Text style={styles.conviteButtonText}>Enviar convite por e-mail</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cadastrarButton} onPress={handleSalvarPaciente} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.cadastrarButtonText}>Cadastrar Paciente</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  totalInfo: { flex: 1 },
  totalNumber: { fontSize: 32, fontWeight: 'bold', color: '#6366F1' },
  totalLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  novoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  novoTexto: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1F2937', paddingVertical: 12 },
  filtersContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  filterButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#F3F4F6' },
  filterButtonActive: { backgroundColor: '#6366F1' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  filterTextActive: { color: '#FFFFFF' },
  pacientesList: { paddingBottom: 20, gap: 12 },
  pacienteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 8 },
  pacienteAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  pacienteInfo: { flex: 1 },
  pacienteNome: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  sessaoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pacienteUltimaSessao: { fontSize: 12, color: '#6B7280' },
  diagnosticoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pacienteDiagnostico: { fontSize: 11, color: '#9CA3AF', flex: 1 },
  bottomNavigation: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'space-between' },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navText: { fontSize: 12, color: '#9CA3AF' },
  navTextActive: { color: '#6366F1', fontWeight: '500' },
  fabButton: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  modalContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#F9FAFB' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', paddingVertical: 14, paddingHorizontal: 0 },
  textAreaWrapper: { alignItems: 'flex-start' },
  textArea: { height: 80, paddingTop: 12 },
  conviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EEF2FF', paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  conviteButtonText: { fontSize: 14, fontWeight: '500', color: '#6366F1' },
  cadastrarButton: { backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  cadastrarButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default Pacientes;