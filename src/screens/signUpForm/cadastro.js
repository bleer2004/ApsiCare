import { API_URL } from '../../services/api';
import { ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const Cadastro = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [profissao, setProfissao] = useState('');
  const [showProfissaoModal, setShowProfissaoModal] = useState(false);
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempDate, setTempDate] = useState(new Date());

  const profissoes = [
    { id: '1', label: 'Psicólogo', value: 'psicologo', registroLabel: 'CRP' },
    { id: '2', label: 'Psiquiatra', value: 'psiquiatra', registroLabel: 'CRM' },
  ];

  const profissaoSelecionada = profissoes.find(p => p.value === profissao);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
      setDataNascimento(formattedDate);
    }
  };

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

  const handleCadastro = async () => {
    if (!nome || !sobrenome || !profissao || !registroProfissional || !dataNascimento || !email || !telefone || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);

    const formatDate = (date) => {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    };

    try {
      const response = await fetch(`${API_URL}/clinicians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${nome} ${sobrenome}`,
          email,
          password,
          phone: telefone.replace(/\D/g, ''),
          councilId: registroProfissional,
          profession: profissao,
          birthDate: formatDate(dataNascimento),
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', responseData.error || 'Erro no servidor');
        return;
      }

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      navigation.navigate('LoginSignedUp');

    } catch (err) {
      console.log("Erro de rede:", err);
      Alert.alert('Erro', 'Falha na conexão com servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarData = () => {
    const formattedDate = `${tempDate.getDate().toString().padStart(2, '0')}/${(tempDate.getMonth() + 1).toString().padStart(2, '0')}/${tempDate.getFullYear()}`;
    setDataNascimento(formattedDate);
    setShowDatePicker(false);
  };

  const renderProfissaoModal = () => (
    <Modal
      visible={showProfissaoModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowProfissaoModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowProfissaoModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione sua profissão</Text>
            <TouchableOpacity onPress={() => setShowProfissaoModal(false)}>
              <Icon name="x" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={profissoes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setProfissao(item.value);
                  setRegistroProfissional('');
                  setShowProfissaoModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
                {profissao === item.value && (
                  <Icon name="check" size={20} color="rgba(179, 103, 212, 0.84)" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Efeito de fundo blur */}
          <View style={styles.blurBackground}>
            <View style={styles.blurCircle} />
          </View>

          <View style={styles.header}>
            <View style={styles.iconHeaderContainer}>
              <View style={styles.iconHeaderWrapper}>
                <View style={styles.iconHeaderPlaceholder} />
              </View>
            </View>
            <Text style={styles.title}>PsicoCare</Text>
            <Text style={styles.subtitle}>
              Plataforma clínica de saúde mental.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.cadastroTitle}>Cadastro</Text>
            <Text style={styles.cadastroDescription}>
              Crie sua conta profissional para começar a gerenciar seus atendimentos.
            </Text>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Nome</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu nome"
                    placeholderTextColor="#94A3B8"
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Sobrenome</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu sobrenome"
                    placeholderTextColor="#94A3B8"
                    value={sobrenome}
                    onChangeText={setSobrenome}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Profissão</Text>
              <TouchableOpacity 
                style={styles.inputWrapper}
                onPress={() => setShowProfissaoModal(true)}
              >
                <Icon name="briefcase" size={20} color="#94A3B8" style={styles.inputIcon} />
                <Text style={[
                  styles.dropdownText,
                  !profissao && styles.placeholderText
                ]}>
                  {profissaoSelecionada ? profissaoSelecionada.label : 'Selecione sua profissão'}
                </Text>
                <Icon name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {profissao && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {profissao === 'psicologo' ? 'Número do CRP' : 'Número do CRM'}
                </Text>
                <View style={styles.inputWrapper}>
                  <Icon name="hash" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={profissao === 'psicologo' ? 'Digite seu CRP' : 'Digite seu CRM'}
                    placeholderTextColor="#94A3B8"
                    value={registroProfissional}
                    onChangeText={setRegistroProfissional}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Data de Nascimento</Text>
              <TouchableOpacity 
                style={styles.inputWrapper}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar" size={20} color="#94A3B8" style={styles.inputIcon} />
                <Text style={[
                  styles.dropdownText,
                  !dataNascimento && styles.placeholderText
                ]}>
                  {dataNascimento || 'DD/MM/AAAA'}
                </Text>
                <Icon name="chevron-right" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail profissional</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="exemplo@clinica.com.br"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  placeholderTextColor="#94A3B8"
                  value={telefone}
                  onChangeText={(text) => setTelefone(formatTelefone(text))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Senha</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Confirme sua senha"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.cadastroButton} onPress={handleCadastro} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.cadastroButtonText}>Cadastrar →</Text>
              }
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já possui cadastro? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('LoginSignedUp')}>
                <Text style={styles.loginLink}>Faça login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.securityIcon} />
            <Text style={styles.securityText}>AMBIENTE SEGURO & CRIPTOGRAFADO</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderProfissaoModal()}

      {showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: '#64748B', fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmarData}>
                  <Text style={{ color: 'rgba(179, 103, 212, 0.84)', fontSize: 16, fontWeight: '600' }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                locale="pt-BR"
                style={{ height: 380 }}
              />
            </View>
          </View>
        </Modal>
      )}
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  // Efeito de fundo blur
  blurBackground: {
    position: 'absolute',
    left: 198,
    top: -64,
    opacity: 0.10,
    zIndex: 0,
  },
  blurCircle: {
    width: 256,
    height: 256,
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 100, height: 100 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 1,
  },
  iconHeaderContainer: {
    paddingBottom: 16,
  },
  iconHeaderWrapper: {
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHeaderPlaceholder: {
    width: 28.52,
    height: 30,
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
    zIndex: 1,
  },
  cadastroTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 8,
  },
  cadastroDescription: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 32,
  },
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
    paddingVertical: 14,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  cadastroButton: {
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cadastroButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
  },
  loginLink: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 32,
    gap: 8,
    zIndex: 1,
  },
  securityIcon: {
    width: 9.33,
    height: 11.67,
    backgroundColor: '#10B981',
  },
  securityText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    textTransform: 'uppercase',
    lineHeight: 16.5,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
  },
});

export default Cadastro;