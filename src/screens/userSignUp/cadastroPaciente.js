import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Switch,
  Slider,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';

// Opções para o Picker customizado
const frequenciaOptions = [
  { label: 'Diária', value: 'diaria' },
  { label: 'A cada 2 dias', value: 'cada2dias' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Personalizado', value: 'personalizado' },
];

const CadastroPaciente = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  // Configurações de IA
  const [interacaoMotivacional, setInteracaoMotivacional] = useState(true);
  const [analisePadroes, setAnalisePadroes] = useState(true);
  const [sugestoesReflexao, setSugestoesReflexao] = useState(false);
  const [intensidadeInteracao, setIntensidadeInteracao] = useState(50);

  // Configurações do App
  const [modoMinimalista, setModoMinimalista] = useState(false);
  const [removerEstimulos, setRemoverEstimulos] = useState(true);

  // NOVAS FUNCIONALIDADES
  // 1. Intervalo de notificações
  const [frequenciaNotificacoes, setFrequenciaNotificacoes] = useState('diaria');
  const [showFrequenciaPicker, setShowFrequenciaPicker] = useState(false);
  const [horarioInicio, setHorarioInicio] = useState('09:00');
  const [horarioFim, setHorarioFim] = useState('18:00');
  const [intervaloNotificacoes, setIntervaloNotificacoes] = useState('2');

  // 2. Cadastro de ligações de emergência
  const [contatosEmergencia, setContatosEmergencia] = useState([
    { id: '1', nome: 'CVV', numero: '188', isPreset: true },
    { id: '2', nome: 'SAMU', numero: '192', isPreset: true },
    { id: '3', nome: 'Polícia', numero: '190', isPreset: true },
  ]);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);
  const [novoContatoNome, setNovoContatoNome] = useState('');
  const [novoContatoNumero, setNovoContatoNumero] = useState('');
  const [editandoContato, setEditandoContato] = useState(null);

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

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const handleConfirmarData = () => {
    const formattedDate = `${tempDate.getDate().toString().padStart(2, '0')}/${(tempDate.getMonth() + 1).toString().padStart(2, '0')}/${tempDate.getFullYear()}`;
    setDataNascimento(formattedDate);
    setShowDatePicker(false);
  };

  const handleSalvar = async () => {
    if (!nome || !sobrenome || !email) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios');
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: `${nome} ${sobrenome}`,
          email,
          phone: telefone.replace(/\D/g, ''),
          birthDate: formatDate(dataNascimento),
          diagnostico,
          observacoes,
          configuracoesIA: {
            interacaoMotivacional,
            analisePadroes,
            sugestoesReflexao,
            intensidadeInteracao,
          },
          configuracoesApp: {
            modoMinimalista,
            removerEstimulos,
            notificacoes: {
              frequencia: frequenciaNotificacoes,
              horarioInicio,
              horarioFim,
              intervalo: intervaloNotificacoes,
            },
            contatosEmergencia: contatosEmergencia.filter(c => !c.isPreset || c.numero),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro ao cadastrar paciente');
        return;
      }
      Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarContato = () => {
    if (!novoContatoNome || !novoContatoNumero) {
      Alert.alert('Erro', 'Preencha nome e número do contato');
      return;
    }
    const novoId = String(contatosEmergencia.length + 1);
    const novoContato = {
      id: novoId,
      nome: novoContatoNome,
      numero: novoContatoNumero,
      isPreset: false,
    };
    if (editandoContato) {
      setContatosEmergencia(contatosEmergencia.map(c => 
        c.id === editandoContato.id ? { ...c, nome: novoContatoNome, numero: novoContatoNumero } : c
      ));
      setEditandoContato(null);
    } else {
      setContatosEmergencia([...contatosEmergencia, novoContato]);
    }
    setNovoContatoNome('');
    setNovoContatoNumero('');
    setShowEmergenciaModal(false);
  };

  const handleRemoverContato = (id) => {
    const contato = contatosEmergencia.find(c => c.id === id);
    if (contato?.isPreset) {
      Alert.alert('Atenção', 'Não é possível remover contatos padrão');
      return;
    }
    setContatosEmergencia(contatosEmergencia.filter(c => c.id !== id));
  };

  const handleEditarContato = (contato) => {
    if (contato.isPreset) {
      Alert.alert('Atenção', 'Edite o número do contato padrão diretamente no campo');
      return;
    }
    setEditandoContato(contato);
    setNovoContatoNome(contato.nome);
    setNovoContatoNumero(contato.numero);
    setShowEmergenciaModal(true);
  };

  const getFrequenciaLabel = (value) => {
    const option = frequenciaOptions.find(opt => opt.value === value);
    return option ? option.label : 'Diária';
  };

  const renderEmergenciaModal = () => (
    <Modal
      visible={showEmergenciaModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowEmergenciaModal(false);
        setEditandoContato(null);
        setNovoContatoNome('');
        setNovoContatoNumero('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editandoContato ? 'Editar Contato' : 'Novo Contato de Emergência'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowEmergenciaModal(false);
              setEditandoContato(null);
              setNovoContatoNome('');
              setNovoContatoNumero('');
            }}>
              <Icon name="x" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome do Contato</Text>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Mãe, Irmão, Amigo"
                  placeholderTextColor="#94A3B8"
                  value={novoContatoNome}
                  onChangeText={setNovoContatoNome}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número de Telefone</Text>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#94A3B8"
                  value={novoContatoNumero}
                  onChangeText={(text) => setNovoContatoNumero(formatTelefone(text))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarContato}>
              <Text style={styles.modalButtonText}>
                {editandoContato ? 'Atualizar Contato' : 'Adicionar Contato'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFrequenciaPickerModal = () => (
    <Modal
      visible={showFrequenciaPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFrequenciaPicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowFrequenciaPicker(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Frequência de Notificações</Text>
            <TouchableOpacity onPress={() => setShowFrequenciaPicker(false)}>
              <Icon name="x" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          {frequenciaOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.pickerOption,
                frequenciaNotificacoes === option.value && styles.pickerOptionActive
              ]}
              onPress={() => {
                setFrequenciaNotificacoes(option.value);
                setShowFrequenciaPicker(false);
              }}
            >
              <Text style={[
                styles.pickerOptionText,
                frequenciaNotificacoes === option.value && styles.pickerOptionTextActive
              ]}>
                {option.label}
              </Text>
              {frequenciaNotificacoes === option.value && (
                <Icon name="check" size={20} color="#B367D4" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />

      {/* Header com blur */}
      <View style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cadastrar novo paciente</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Informações Básicas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="info" size={16} color="#B367D4" />
              <Text style={styles.sectionTitle}>Informações básicas</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome completo"
                  placeholderTextColor="#6B7280"
                  value={nome}
                  onChangeText={setNome}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="exemplo@email.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#6B7280"
                  value={telefone}
                  onChangeText={(text) => setTelefone(formatTelefone(text))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Informações Clínicas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="clipboard" size={20} color="#B367D4" />
              <Text style={styles.sectionTitle}>Informações clínicas</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Diagnóstico Principal</Text>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Selecione um diagnóstico"
                  placeholderTextColor="#0F172A"
                  value={diagnostico}
                  onChangeText={setDiagnostico}
                />
                <Icon name="chevron-down" size={20} color="#6B7280" />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Resumo Clínico</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <Icon name="align-left" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva brevemente o histórico e objetivos terapêuticos..."
                  placeholderTextColor="#6B7280"
                  value={observacoes}
                  onChangeText={setObservacoes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* Configuração de IA */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="cpu" size={19} color="#B367D4" />
              <Text style={styles.sectionTitle}>Configuração de IA</Text>
            </View>
            
            <View style={styles.iaCard}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Interação motivacional</Text>
                <Switch
                  value={interacaoMotivacional}
                  onValueChange={setInteracaoMotivacional}
                  trackColor={{ false: '#CBD5E1', true: '#B367D4' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Análise de padrões</Text>
                <Switch
                  value={analisePadroes}
                  onValueChange={setAnalisePadroes}
                  trackColor={{ false: '#CBD5E1', true: '#B367D4' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Sugestões de reflexão</Text>
                <Switch
                  value={sugestoesReflexao}
                  onValueChange={setSugestoesReflexao}
                  trackColor={{ false: '#CBD5E1', true: '#B367D4' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Intensidade da Interação</Text>
                <Slider
                  value={intensidadeInteracao}
                  onValueChange={setIntensidadeInteracao}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  minimumTrackTintColor="#B367D4"
                  maximumTrackTintColor="#E2E8F0"
                  thumbTintColor="#B367D4"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>Sutil</Text>
                  <Text style={styles.sliderLabelText}>Média</Text>
                  <Text style={styles.sliderLabelText}>Frequente</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Configurações do App */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="settings" size={18} color="#B367D4" />
              <Text style={styles.sectionTitle}>Configurações do App</Text>
            </View>

            <View style={styles.switchRowBorder}>
              <Text style={styles.switchLabel}>Modo Minimalista</Text>
              <Switch
                value={modoMinimalista}
                onValueChange={setModoMinimalista}
                trackColor={{ false: '#CBD5E1', true: '#B367D4' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.switchRowBorder}>
              <Text style={styles.switchLabel}>Remover estímulos visuais</Text>
              <Switch
                value={removerEstimulos}
                onValueChange={setRemoverEstimulos}
                trackColor={{ false: '#CBD5E1', true: '#B367D4' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Frequência de Notificações</Text>
              <TouchableOpacity 
                style={styles.inputWrapper}
                onPress={() => setShowFrequenciaPicker(true)}
              >
                <Icon name="bell" size={20} color="#94A3B8" style={styles.inputIcon} />
                <Text style={styles.input}>
                  {getFrequenciaLabel(frequenciaNotificacoes)}
                </Text>
                <Icon name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {frequenciaNotificacoes === 'personalizado' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Horário de Início</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="clock" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="09:00"
                      placeholderTextColor="#6B7280"
                      value={horarioInicio}
                      onChangeText={setHorarioInicio}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Horário de Fim</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="clock" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="18:00"
                      placeholderTextColor="#6B7280"
                      value={horarioFim}
                      onChangeText={setHorarioFim}
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Intervalo entre notificações (horas)</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="repeat" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="2"
                      placeholderTextColor="#6B7280"
                      value={intervaloNotificacoes}
                      onChangeText={setIntervaloNotificacoes}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Contatos de Emergência */}
            <View style={styles.emergenciaSection}>
              <Text style={styles.emergenciaTitle}>Contatos de Emergência</Text>
              {contatosEmergencia.map((contato) => (
                <View key={contato.id} style={styles.contatoRow}>
                  <View style={styles.contatoInfo}>
                    <Text style={styles.contatoNome}>{contato.nome}</Text>
                    <Text style={styles.contatoNumero}>{contato.numero}</Text>
                  </View>
                  <View style={styles.contatoActions}>
                    <TouchableOpacity onPress={() => handleEditarContato(contato)}>
                      <Icon name="edit-2" size={18} color="#B367D4" />
                    </TouchableOpacity>
                    {!contato.isPreset && (
                      <TouchableOpacity onPress={() => handleRemoverContato(contato.id)}>
                        <Icon name="trash-2" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.addContatoButton}
                onPress={() => setShowEmergenciaModal(true)}
              >
                <Icon name="plus" size={16} color="#B367D4" />
                <Text style={styles.addContatoText}>Adicionar novo contato</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão Enviar Convite */}
          <TouchableOpacity style={styles.inviteButton}>
            <Icon name="mail" size={16} color="#B367D4" />
            <Text style={styles.inviteButtonText}>Enviar convite por e-mail</Text>
          </TouchableOpacity>

          {/* Botão Cadastrar */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="save" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Cadastrar Paciente</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Data */}
      {showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmarData}>
                  <Text style={styles.datePickerConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                locale="pt-BR"
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Emergência */}
      {renderEmergenciaModal()}

      {/* Modal de Frequência de Notificações */}
      {renderFrequenciaPickerModal()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VisaoGeral')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="users" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Pacientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Relatorios')}>
          <Icon name="bar-chart-2" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Relatórios</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  // Header
  headerBlur: {
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
  },
  // Seções
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
  },
  // Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  // IA Card
  iaCard: {
    padding: 16,
    backgroundColor: 'rgba(179, 103, 212, 0.05)',
    borderRadius: 12,
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 12,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  // Emergência
  emergenciaSection: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  emergenciaTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 12,
  },
  contatoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contatoInfo: {
    flex: 1,
  },
  contatoNome: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
  },
  contatoNumero: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
  },
  contatoActions: {
    flexDirection: 'row',
    gap: 16,
  },
  addContatoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addContatoText: {
    color: '#B367D4',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
  },
  // Botões
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B367D4',
  },
  inviteButtonText: {
    color: '#B367D4',
    fontSize: 16,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: '#B367D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
  },
  modalContent: {
    padding: 20,
  },
  modalButton: {
    backgroundColor: '#B367D4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  // Picker Modal
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(179, 103, 212, 0.05)',
  },
  pickerOptionText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
  },
  pickerOptionTextActive: {
    color: '#B367D4',
    fontWeight: '600',
  },
  // Date Picker
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  datePickerCancelText: {
    color: '#64748B',
    fontSize: 16,
  },
  datePickerConfirmText: {
    color: '#B367D4',
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    height: 380,
  },
  // Bottom Navigation
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {},
  navText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#B367D4',
  },
});

export default CadastroPaciente;