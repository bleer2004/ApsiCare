import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [patientIdCriado, setPatientIdCriado] = useState(null);
  const [cadastroConcluido, setCadastroConcluido] = useState(false);

  // Configurações de IA
  const [interacaoMotivacional, setInteracaoMotivacional] = useState(true);
  const [analisePadroes, setAnalisePadroes] = useState(true);
  const [sugestoesReflexao, setSugestoesReflexao] = useState(false);
  const [intensidadeInteracao, setIntensidadeInteracao] = useState(50);

  // Configurações do App
  const [modoMinimalista, setModoMinimalista] = useState(false);
  const [removerEstimulos, setRemoverEstimulos] = useState(true);

  // Notificações
  const [frequenciaNotificacoes, setFrequenciaNotificacoes] = useState('diaria');
  const [showFrequenciaPicker, setShowFrequenciaPicker] = useState(false);
  const [horarioInicio, setHorarioInicio] = useState('09:00');
  const [horarioFim, setHorarioFim] = useState('18:00');
  const [intervaloNotificacoes, setIntervaloNotificacoes] = useState('2');

  // Contatos de emergência
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
    if (cleaned.length <= 2) return `(${cleaned}`;
    else if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    else if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    else return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const handleConfirmarData = () => {
    const d = tempDate;
    setDataNascimento(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`);
    setShowDatePicker(false);
  };

  const handleSalvar = async () => {
    if (!nome || !email) { Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { Alert.alert('Erro', 'Digite um e-mail válido'); return; }

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

      // 1. Cadastra o paciente
      const response = await fetch(`${API_URL}/clinicians/${user.id}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: `${nome} ${sobrenome}`.trim(),
          email,
          phone: telefone.replace(/\D/g, ''),
          birthDate: formatDate(dataNascimento),
          diagnostico,
          observacoes,
          configuracoesIA: { interacaoMotivacional, analisePadroes, sugestoesReflexao, intensidadeInteracao },
          configuracoesApp: {
            modoMinimalista, removerEstimulos,
            notificacoes: { frequencia: frequenciaNotificacoes, horarioInicio, horarioFim, intervalo: intervaloNotificacoes },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) { Alert.alert('Erro', data.error || 'Erro ao cadastrar paciente'); return; }

      const patientId = data.patient?.id;
      setPatientIdCriado(patientId);

      // 2. Salva contatos de emergência custom via PUT (mesma lambda do salvar-contato-emergencia)
      const contatosCustom = contatosEmergencia.filter(c => !c.isPreset);
      for (const contato of contatosCustom) {
        try {
          await fetch(`${API_URL}/patients/${patientId}/emergency-contact`, {
            method: 'PUT', // ← corrigido: usa PUT igual à rota configurada
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ nome: contato.nome, telefone: contato.numero, relacao: contato.relacao || 'Não informado' }),
          });
        } catch (err) { console.warn('Erro ao salvar contato:', err); }
      }

      Alert.alert('Paciente cadastrado!', 'O paciente foi cadastrado com sucesso.');
      setCadastroConcluido(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarConvite = async () => {
    if (!patientIdCriado) { Alert.alert('Atenção', 'Cadastre o paciente antes de enviar o convite.'); return; }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/patients/${patientIdCriado}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error || 'Erro ao enviar convite'); return; }
      Alert.alert('Convite enviado!', 'O paciente receberá um e-mail com as credenciais de acesso.');
    } catch { Alert.alert('Erro', 'Não foi possível enviar o convite.'); }
  };

  const handleAdicionarContato = () => {
    if (!novoContatoNome || !novoContatoNumero) { Alert.alert('Erro', 'Preencha nome e número do contato'); return; }
    if (editandoContato) {
      setContatosEmergencia(contatosEmergencia.map(c => c.id === editandoContato.id ? { ...c, nome: novoContatoNome, numero: novoContatoNumero } : c));
      setEditandoContato(null);
    } else {
      setContatosEmergencia([...contatosEmergencia, { id: String(Date.now()), nome: novoContatoNome, numero: novoContatoNumero, isPreset: false }]);
    }
    setNovoContatoNome(''); setNovoContatoNumero(''); setShowEmergenciaModal(false);
  };

  const handleRemoverContato = (id) => {
    if (contatosEmergencia.find(c => c.id === id)?.isPreset) { Alert.alert('Atenção', 'Não é possível remover contatos padrão'); return; }
    setContatosEmergencia(contatosEmergencia.filter(c => c.id !== id));
  };

  const handleEditarContato = (contato) => {
    if (contato.isPreset) { Alert.alert('Atenção', 'Não é possível editar contatos padrão'); return; }
    setEditandoContato(contato);
    setNovoContatoNome(contato.nome);
    setNovoContatoNumero(contato.numero);
    setShowEmergenciaModal(true);
  };

  const getFrequenciaLabel = (value) => frequenciaOptions.find(o => o.value === value)?.label || 'Diária';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />

      <View style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => {
            if (cadastroConcluido) { navigation.goBack(); return; }
            Alert.alert('Sair sem salvar?', 'O paciente ainda não foi cadastrado.', [
              { text: 'Ficar', style: 'cancel' },
              { text: 'Sair', onPress: () => navigation.goBack() }
            ]);
          }} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cadastrar novo paciente</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Informações Básicas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Icon name="info" size={16} color="#B367D4" /><Text style={styles.sectionTitle}>Informações básicas</Text></View>
            {[
              { label: 'Nome Completo *', icon: 'user', value: nome, onChange: setNome, placeholder: 'Digite o nome completo' },
              { label: 'Sobrenome', icon: 'user', value: sobrenome, onChange: setSobrenome, placeholder: 'Digite o sobrenome' },
              { label: 'E-mail *', icon: 'mail', value: email, onChange: setEmail, placeholder: 'exemplo@email.com', keyboard: 'email-address', autoCapitalize: 'none' },
              { label: 'Telefone', icon: 'phone', value: telefone, onChange: (t) => setTelefone(formatTelefone(t)), placeholder: '(00) 00000-0000', keyboard: 'phone-pad' },
            ].map((field, i) => (
              <View key={i} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Icon name={field.icon} size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder={field.placeholder} placeholderTextColor="#6B7280" value={field.value} onChangeText={field.onChange} keyboardType={field.keyboard || 'default'} autoCapitalize={field.autoCapitalize || 'sentences'} />
                </View>
              </View>
            ))}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Data de Nascimento</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                <Icon name="calendar" size={20} color="#94A3B8" style={styles.inputIcon} />
                <Text style={[styles.input, { color: dataNascimento ? '#0F172A' : '#6B7280' }]}>{dataNascimento || 'DD/MM/AAAA'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Informações Clínicas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Icon name="clipboard" size={20} color="#B367D4" /><Text style={styles.sectionTitle}>Informações clínicas</Text></View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Diagnóstico Principal</Text>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Digite o diagnóstico" placeholderTextColor="#6B7280" value={diagnostico} onChangeText={setDiagnostico} />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Resumo Clínico</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <Icon name="align-left" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Descreva brevemente o histórico e objetivos terapêuticos..." placeholderTextColor="#6B7280" value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={4} textAlignVertical="top" />
              </View>
            </View>
          </View>

          {/* Configuração de IA */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Icon name="cpu" size={19} color="#B367D4" /><Text style={styles.sectionTitle}>Configuração de IA</Text></View>
            <View style={styles.iaCard}>
              {[
                { label: 'Interação motivacional', value: interacaoMotivacional, onChange: setInteracaoMotivacional },
                { label: 'Análise de padrões', value: analisePadroes, onChange: setAnalisePadroes },
                { label: 'Sugestões de reflexão', value: sugestoesReflexao, onChange: setSugestoesReflexao },
              ].map((s, i) => (
                <View key={i} style={styles.switchRow}>
                  <Text style={styles.switchLabel}>{s.label}</Text>
                  <Switch value={s.value} onValueChange={s.onChange} trackColor={{ false: '#CBD5E1', true: '#B367D4' }} thumbColor="#FFFFFF" />
                </View>
              ))}
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Intensidade da Interação</Text>
                <Slider value={intensidadeInteracao} onValueChange={setIntensidadeInteracao} minimumValue={0} maximumValue={100} step={1} minimumTrackTintColor="#B367D4" maximumTrackTintColor="#E2E8F0" thumbTintColor="#B367D4" />
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
            <View style={styles.sectionHeader}><Icon name="settings" size={18} color="#B367D4" /><Text style={styles.sectionTitle}>Configurações do App</Text></View>
            {[
              { label: 'Modo Minimalista', value: modoMinimalista, onChange: setModoMinimalista },
              { label: 'Remover estímulos visuais', value: removerEstimulos, onChange: setRemoverEstimulos },
            ].map((s, i) => (
              <View key={i} style={styles.switchRowBorder}>
                <Text style={styles.switchLabel}>{s.label}</Text>
                <Switch value={s.value} onValueChange={s.onChange} trackColor={{ false: '#CBD5E1', true: '#B367D4' }} thumbColor="#FFFFFF" />
              </View>
            ))}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Frequência de Notificações</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowFrequenciaPicker(true)}>
                <Icon name="bell" size={20} color="#94A3B8" style={styles.inputIcon} />
                <Text style={styles.input}>{getFrequenciaLabel(frequenciaNotificacoes)}</Text>
                <Icon name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Contatos de Emergência */}
            <View style={styles.emergenciaSection}>
              <Text style={styles.emergenciaTitle}>Contatos de Emergência</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Manrope', marginBottom: 12 }}>
                Os contatos personalizados serão salvos no perfil do paciente após o cadastro.
              </Text>
              {contatosEmergencia.map((contato) => (
                <View key={contato.id} style={styles.contatoRow}>
                  <View style={styles.contatoInfo}>
                    <Text style={styles.contatoNome}>{contato.nome}</Text>
                    <Text style={styles.contatoNumero}>{contato.numero}</Text>
                  </View>
                  <View style={styles.contatoActions}>
                    {!contato.isPreset && (
                      <>
                        <TouchableOpacity onPress={() => handleEditarContato(contato)}><Icon name="edit-2" size={18} color="#B367D4" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoverContato(contato.id)}><Icon name="trash-2" size={18} color="#EF4444" /></TouchableOpacity>
                      </>
                    )}
                    {contato.isPreset && <Icon name="lock" size={16} color="#CBD5E1" />}
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addContatoButton} onPress={() => setShowEmergenciaModal(true)}>
                <Icon name="plus" size={16} color="#B367D4" />
                <Text style={styles.addContatoText}>Adicionar contato personalizado</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão Enviar Convite */}
          <TouchableOpacity style={[styles.inviteButton, !patientIdCriado && styles.inviteButtonDisabled]} onPress={handleEnviarConvite} disabled={!patientIdCriado}>
            <Icon name="mail" size={16} color={patientIdCriado ? '#B367D4' : '#94A3B8'} />
            <Text style={[styles.inviteButtonText, !patientIdCriado && styles.inviteButtonTextDisabled]}>Enviar convite por e-mail</Text>
          </TouchableOpacity>

          {/* Botão Cadastrar */}
          <TouchableOpacity style={[styles.saveButton, cadastroConcluido && { backgroundColor: '#10B981' }]} onPress={handleSalvar} disabled={loading || cadastroConcluido}>
            {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <>
                <Icon name={cadastroConcluido ? 'check' : 'save'} size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>{cadastroConcluido ? 'Paciente Cadastrado!' : 'Cadastrar Paciente'}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Data */}
      {showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: '#64748B', fontSize: 16 }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmarData}><Text style={{ color: '#B367D4', fontSize: 16, fontWeight: '600' }}>Confirmar</Text></TouchableOpacity>
              </View>
              <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'spinner'} onChange={handleDateChange} maximumDate={new Date()} locale="pt-BR" style={{ height: 380 }} />
            </View>
          </View>
        </Modal>
      )}

      {/* Modal Contato Emergência */}
      <Modal visible={showEmergenciaModal} transparent animationType="slide" onRequestClose={() => { setShowEmergenciaModal(false); setEditandoContato(null); setNovoContatoNome(''); setNovoContatoNumero(''); }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowEmergenciaModal(false)} />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editandoContato ? 'Editar Contato' : 'Novo Contato de Emergência'}</Text>
              <TouchableOpacity onPress={() => { setShowEmergenciaModal(false); setEditandoContato(null); setNovoContatoNome(''); setNovoContatoNumero(''); }}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalContent, { paddingBottom: 32 }]}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nome do Contato</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Ex: Mãe, Irmão, Amigo" placeholderTextColor="#94A3B8" value={novoContatoNome} onChangeText={setNovoContatoNome} />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Número de Telefone</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="phone" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="(00) 00000-0000" placeholderTextColor="#94A3B8" value={novoContatoNumero} onChangeText={(t) => setNovoContatoNumero(formatTelefone(t))} keyboardType="phone-pad" />
                </View>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handleAdicionarContato}>
                <Text style={styles.modalButtonText}>{editandoContato ? 'Atualizar Contato' : 'Adicionar Contato'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Frequência */}
      <Modal visible={showFrequenciaPicker} transparent animationType="slide" onRequestClose={() => setShowFrequenciaPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFrequenciaPicker(false)}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Frequência de Notificações</Text>
              <TouchableOpacity onPress={() => setShowFrequenciaPicker(false)}><Icon name="x" size={24} color="#64748B" /></TouchableOpacity>
            </View>
            {frequenciaOptions.map((option) => (
              <TouchableOpacity key={option.value} style={[styles.pickerOption, frequenciaNotificacoes === option.value && styles.pickerOptionActive]} onPress={() => { setFrequenciaNotificacoes(option.value); setShowFrequenciaPicker(false); }}>
                <Text style={[styles.pickerOptionText, frequenciaNotificacoes === option.value && styles.pickerOptionTextActive]}>{option.label}</Text>
                {frequenciaNotificacoes === option.value && <Icon name="check" size={20} color="#B367D4" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('VisaoGeral')}>
          <Icon name="home" size={20} color="#94A3B8" /><Text style={styles.navText}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="users" size={20} color="#B367D4" /><Text style={[styles.navText, styles.navTextActive]}>Pacientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Relatorios')}>
          <Icon name="bar-chart-2" size={20} color="#94A3B8" /><Text style={styles.navText}>Relatórios</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 16 },
  headerBlur: { backgroundColor: 'rgba(246, 246, 248, 0.80)', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#0F172A', fontSize: 20, fontFamily: 'Manrope', fontWeight: '700' },
  section: { marginTop: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontFamily: 'Manrope', fontWeight: '700' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', marginBottom: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 12, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Manrope', color: '#0F172A', paddingVertical: 12 },
  textAreaWrapper: { alignItems: 'flex-start', minHeight: 120 },
  textArea: { height: 100, paddingTop: 12 },
  iaCard: { padding: 16, backgroundColor: 'rgba(179, 103, 212, 0.05)', borderRadius: 12, gap: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchRowBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  switchLabel: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  sliderContainer: { marginTop: 8 },
  sliderLabel: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', marginBottom: 12 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sliderLabelText: { color: '#64748B', fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase' },
  emergenciaSection: { marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  emergenciaTitle: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500', marginBottom: 4 },
  contatoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  contatoInfo: { flex: 1 },
  contatoNome: { color: '#0F172A', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  contatoNumero: { color: '#64748B', fontSize: 12, fontFamily: 'Manrope' },
  contatoActions: { flexDirection: 'row', gap: 16 },
  addContatoButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  addContatoText: { color: '#B367D4', fontSize: 14, fontFamily: 'Manrope', fontWeight: '500' },
  inviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, marginTop: 16, borderRadius: 8, borderWidth: 1, borderColor: '#B367D4' },
  inviteButtonDisabled: { borderColor: '#CBD5E1', opacity: 0.6 },
  inviteButtonText: { color: '#B367D4', fontSize: 16, fontFamily: 'Manrope' },
  inviteButtonTextDisabled: { color: '#94A3B8' },
  saveButton: { backgroundColor: '#B367D4', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 16, marginBottom: 32 },
  saveButtonText: { color: 'white', fontSize: 16, fontFamily: 'Manrope', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  modalContent: { padding: 20 },
  modalButton: { backgroundColor: '#B367D4', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  modalButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Manrope', fontWeight: '600' },
  pickerModalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  pickerModalTitle: { fontSize: 18, fontFamily: 'Manrope', fontWeight: '600', color: '#0F172A' },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerOptionActive: { backgroundColor: 'rgba(179, 103, 212, 0.05)' },
  pickerOptionText: { fontSize: 16, fontFamily: 'Manrope', color: '#0F172A' },
  pickerOptionTextActive: { color: '#B367D4', fontWeight: '600' },
  bottomNavigation: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 24 },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navItemActive: {},
  navText: { color: '#94A3B8', fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase' },
  navTextActive: { color: '#B367D4' },
});

export default CadastroPaciente;