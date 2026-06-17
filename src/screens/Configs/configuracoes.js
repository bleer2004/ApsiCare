import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';
import Icon from 'react-native-vector-icons/Feather';

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
  Switch,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'react-native-image-picker';

const Configuracoes = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [celular, setCelular] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [profissao, setProfissao] = useState('');
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [clinica, setClinica] = useState('');

  const [enderecoClinica, setEnderecoClinica] = useState('');
  const [notificacoes, setNotificacoes] = useState(true);
  const [emailPromocoes, setEmailPromocoes] = useState(false);
  const [biometria, setBiometria] = useState(true);
  const [temaEscuro, setTemaEscuro] = useState(false);
  
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  
  const [showProfissaoModal, setShowProfissaoModal] = useState(false);
  const [showEspecialidadeModal, setShowEspecialidadeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [avatar, setAvatar] = useState(null);

  const profissoes = [
    { id: '1', label: 'Psicólogo', value: 'psicologo', registroLabel: 'CRP' },
    { id: '2', label: 'Psiquiatra', value: 'psiquiatra', registroLabel: 'CRM' },
  ];

  const especialidades = [
    'Terapia Cognitivo-Comportamental',
    'Psicanálise',
    'Terapia Humanista',
    'Neuropsicologia',
    'Psicologia Infantil',
    'Psicologia Organizacional',
    'Psiquiatria Geral',
    'Psiquiatria Infantil',
  ];

  const [clinicianId, setClinicianId] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (!userStr) return;
      const user = JSON.parse(userStr);

      setClinicianId(user.id); 

      const response = await fetch(`${API_URL}/clinicians/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      console.log("Dados crus vindo da API:", result);

      if (response.ok) {
        const d = result; 

        const partes = (d.name || '').trim().split(' ');
        setNome(partes[0] || '');
        setSobrenome(partes.slice(1).join(' ') || '');
        
        setEmail(d.email || '');
        setTelefone(formatTelefone(d.phone || ''));
        setCelular(formatTelefone(d.phone || ''));
        setRegistroProfissional(d.councilId || '');
        setProfissao(d.profession || '');
        setEspecialidade(d.especialidade || '');
        setClinica(d.clinica || '');
        setEnderecoClinica(d.enderecoClinica || '');
        
        if (d.birthDate) {
          setDataNascimento(formatDate(d.birthDate));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const dia = String(date.getUTCDate()).padStart(2, '0');
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
    const ano = date.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dia = selectedDate.getDate().toString().padStart(2, '0');
      const mes = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const ano = selectedDate.getFullYear();
      setDataNascimento(`${dia}/${mes}/${ano}`);
    }
  };

  const handleEscolherImagem = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets[0]) {
        setAvatar(response.assets[0].uri);
      }
    });
  };

  const formatDateToAPI = (dateBR) => {
    if (!dateBR) return null;
    const [dia, mes, ano] = dateBR.split('/');
    return `${ano}-${mes}-${dia}`; 
  };

  const validarEmail = (email) => {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSalvarAlteracoes = async () => {
    try {
      if (!validarEmail(email)) {
        Alert.alert('Erro', 'Digite um e-mail válido (ex: nome@email.com)');
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const profileBody = {
        name: `${nome} ${sobrenome}`.trim(),
        email: email.trim(),
        phone: telefone.replace(/\D/g, ''), 
        cellphone: celular.replace(/\D/g, ''),       
        councilId: registroProfissional,
        profession: profissao,
        birthDate: dataNascimento ? formatDateToAPI(dataNascimento) : null,
        especialidade,
        clinica,
        enderecoClinica
      };

      const profileResponse = await fetch(`${API_URL}/clinicians/${clinicianId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileBody)
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Erro ao atualizar perfil');
      }

      if (novaSenha && novaSenha.trim().length > 0) {
        if (!senhaAtual) {
          Alert.alert('Atenção', 'Informe a senha atual para definir uma nova.');
          setLoading(false);
          return;
        }

        if (novaSenha !== confirmarSenha) {
          Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
          setLoading(false);
          return;
        }

        const passwordResponse = await fetch(`${API_URL}/clinicians/update-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            clinicianId: clinicianId,
            currentPassword: senhaAtual.trim(),
            newPassword: novaSenha.trim()
          })
        });

        if (!passwordResponse.ok) {
          const passError = await passwordResponse.json();
          throw new Error(passError.error || 'A senha atual está incorreta.');
        }
      }

      Alert.alert('Sucesso', 'As alterações foram salvas!');
      setEditMode(false);
      
      setTimeout(() => {
        carregarDados();
      }, 800);    
      
      const novoNomeCompleto = `${nome} ${sobrenome}`.trim();
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const updatedUser = { 
          ...userObj, 
          email: email.trim(), 
          name: novoNomeCompleto 
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setEditMode(false);
      await carregarDados();

    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (nome && sobrenome) {
      return `${nome[0]}${sobrenome[0]}`.toUpperCase();
    }
    if (nome) return nome[0].toUpperCase();
    return 'AB';
  };

  const renderInfoRow = (label, value, icon, onEdit) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        <Icon name={icon} size={20} color="#B367D4" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value || 'Não informado'}</Text>
        {editMode && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Icon name="edit-2" size={16} color="#B367D4" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderInputField = (label, value, onChangeText, icon, keyboardType = 'default', placeholder = '', isPassword = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Icon name={icon} size={20} color="#94A3B8" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isPassword}
          editable={editMode}
        />
      </View>
    </View>
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
          <Text style={styles.headerTitle}>Configurações</Text>
          <TouchableOpacity 
            onPress={() => editMode ? handleSalvarAlteracoes() : setEditMode(true)}
            style={styles.saveButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#B367D4" />
            ) : (
              <Text style={styles.saveButtonText}>{editMode ? 'Salvar' : 'Editar'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleEscolherImagem} disabled={!editMode} style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            {editMode && (
              <View style={styles.editAvatarButton}>
                <Icon name="camera" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarName}>{nome} {sobrenome}</Text>
          <Text style={styles.avatarProfissao}>
            {profissao === 'psicologo' ? 'Psicólogo' : 'Psiquiatra'} • {registroProfissional || 'Cadastre seu registro'}
          </Text>
        </View>

        {/* Informações Pessoais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="user" size={18} color="#B367D4" />
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          </View>
          
          {editMode ? (
            <>
              {renderInputField('Nome', nome, setNome, 'user', 'default', 'Digite seu nome')}
              {renderInputField('Sobrenome', sobrenome, setSobrenome, 'user', 'default', 'Digite seu sobrenome')}
              {renderInputField('E-mail', email, setEmail, 'mail', 'email-address', 'exemplo@clinica.com')}
              {renderInputField('Telefone', telefone, (text) => setTelefone(formatTelefone(text)), 'phone', 'phone-pad')}
              {renderInputField('Celular', celular, (text) => setCelular(formatTelefone(text)), 'smartphone', 'phone-pad')}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Data de Nascimento</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <Text style={[styles.input, !dataNascimento && styles.placeholderText]}>
                    {dataNascimento || 'DD/MM/AAAA'}
                  </Text>
                  <Icon name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {renderInfoRow('Nome completo', `${nome} ${sobrenome}`, 'user', () => setEditMode(true))}
              {renderInfoRow('E-mail', email, 'mail', () => setEditMode(true))}
              {renderInfoRow('Telefone', telefone, 'phone', () => setEditMode(true))}
              {renderInfoRow('Celular', celular, 'smartphone', () => setEditMode(true))}
              {renderInfoRow('Data de Nascimento', dataNascimento, 'calendar', () => setEditMode(true))}
            </>
          )}
        </View>

        {/* Informações Profissionais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="briefcase" size={18} color="#B367D4" />
            <Text style={styles.sectionTitle}>Informações Profissionais</Text>
          </View>
          
          {editMode ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Profissão</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper}
                  onPress={() => setShowProfissaoModal(true)}
                >
                  <Icon name="briefcase" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <Text style={[styles.input, !profissao && styles.placeholderText]}>
                    {profissoes.find(p => p.value === profissao)?.label || 'Selecione'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              {renderInputField(
                profissao === 'psicologo' ? 'CRP' : 'CRM',
                registroProfissional,
                setRegistroProfissional,
                'hash',
                'default',
                profissao === 'psicologo' ? 'Digite seu CRP' : 'Digite seu CRM'
              )}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Especialidade</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper}
                  onPress={() => setShowEspecialidadeModal(true)}
                >
                  <Icon name="star" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <Text style={[styles.input, !especialidade && styles.placeholderText]}>
                    {especialidade || 'Selecione'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              {renderInputField('Clínica', clinica, setClinica, 'map-pin', 'default', 'Nome da clínica')}
              {renderInputField('Endereço', enderecoClinica, setEnderecoClinica, 'home', 'default', 'Endereço completo')}
            </>
          ) : (
            <>
              {renderInfoRow('Profissão', profissoes.find(p => p.value === profissao)?.label, 'briefcase', () => setEditMode(true))}
              {renderInfoRow(profissao === 'psicologo' ? 'CRP' : 'CRM', registroProfissional, 'hash', () => setEditMode(true))}
              {renderInfoRow('Especialidade', especialidade, 'star', () => setEditMode(true))}
              {renderInfoRow('Clínica', clinica, 'map-pin', () => setEditMode(true))}
              {renderInfoRow('Endereço', enderecoClinica, 'home', () => setEditMode(true))}
            </>
          )}
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="sliders" size={18} color="#B367D4" />
            <Text style={styles.sectionTitle}>Preferências</Text>
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Icon name="bell" size={20} color="#B367D4" />
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>Notificações</Text>
                <Text style={styles.preferenceDescription}>Receber alertas de pacientes e atualizações</Text>
              </View>
            </View>
            <Switch
              value={notificacoes}
              onValueChange={setNotificacoes}
              trackColor={{ false: '#E2E8F0', true: '#B367D4' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Icon name="mail" size={20} color="#B367D4" />
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>E-mails promocionais</Text>
                <Text style={styles.preferenceDescription}>Receber novidades e ofertas exclusivas</Text>
              </View>
            </View>
            <Switch
              value={emailPromocoes}
              onValueChange={setEmailPromocoes}
              trackColor={{ false: '#E2E8F0', true: '#B367D4' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Icon name="fingerprint" size={20} color="#B367D4" />
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>Login com Biometria</Text>
                <Text style={styles.preferenceDescription}>Acessar usando impressão digital</Text>
              </View>
            </View>
            <Switch
              value={biometria}
              onValueChange={setBiometria}
              trackColor={{ false: '#E2E8F0', true: '#B367D4' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Icon name="moon" size={20} color="#B367D4" />
              <View style={styles.preferenceTextContainer}>
                <Text style={styles.preferenceLabel}>Tema escuro</Text>
                <Text style={styles.preferenceDescription}>Alterar para o tema escuro</Text>
              </View>
            </View>
            <Switch
              value={temaEscuro}
              onValueChange={setTemaEscuro}
              trackColor={{ false: '#E2E8F0', true: '#B367D4' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Segurança */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="shield" size={18} color="#B367D4" />
            <Text style={styles.sectionTitle}>Segurança</Text>
          </View>
          
          {renderInputField('Senha atual', senhaAtual, setSenhaAtual, 'lock', 'default', 'Digite sua senha atual', true)}
          {renderInputField('Nova senha', novaSenha, setNovaSenha, 'lock', 'default', 'Digite sua nova senha', true)}
          {renderInputField('Confirmar senha', confirmarSenha, setConfirmarSenha, 'lock', 'default', 'Confirme sua nova senha', true)}
        </View>

        {/* Ações da Conta */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={async () => {
              await AsyncStorage.clear();
              navigation.replace('LoginSignedUp');
            }}
          >
            <Icon name="log-out" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton}>
            <Icon name="trash-2" size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>

        {/* Versão do App */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 ApsiCare - Todos os direitos reservados</Text>
        </View>
      </ScrollView>

      {/* Modais */}
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
            {profissoes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.modalItem}
                onPress={() => {
                  setProfissao(item.value);
                  setShowProfissaoModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
                {profissao === item.value && (
                  <Icon name="check" size={20} color="#B367D4" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showEspecialidadeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEspecialidadeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowEspecialidadeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione sua especialidade</Text>
              <TouchableOpacity onPress={() => setShowEspecialidadeModal(false)}>
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {especialidades.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setEspecialidade(item);
                  setShowEspecialidadeModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
                {especialidade === item && (
                  <Icon name="check" size={20} color="#B367D4" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
    paddingBottom: 32,
  },
  headerBlur: {
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(179, 103, 212, 0.10)',
  },
  avatarText: {
    fontSize: 36,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#B367D4',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#B367D4',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarName: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  avatarProfissao: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#0F172A',
  },
  editButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
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
  placeholderText: {
    color: '#94A3B8',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
  },
  actionsSection: {
    marginTop: 24,
    marginHorizontal: 20,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#94A3B8',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#CBD5E1',
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
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
  },
});

export default Configuracoes;