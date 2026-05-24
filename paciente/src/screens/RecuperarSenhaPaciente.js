// paciente/screens/RecuperarSenhaPaciente.js
import React, { useState } from 'react';
import { API_URL } from '../../../src/services/api'; // Caminho corrigido
import Icon from 'react-native-vector-icons/Feather';

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
  ActivityIndicator,
} from 'react-native';

const RecuperarSenhaPaciente = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleEnviarCodigo = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, digite seu e-mail');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/patient/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro desconhecido no servidor');
        return;
      }

      setStep(2);
      Alert.alert('Código enviado!', 'Verifique sua caixa de entrada ou spam.');
    } catch (err) {
      console.error("Erro na Requisição:", err);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (!codigo || codigo.length !== 6) {
      Alert.alert('Erro', 'O código deve ter 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/patient/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codigo, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Código inválido ou expirado');
        return;
      }
      setStep(3);
      Alert.alert('Código verificado!', 'Agora você pode criar uma nova senha');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedefinirSenha = async () => {
    if (!novaSenha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/patient/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codigo, newPassword: novaSenha }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro ao redefinir senha');
        return;
      }
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltarLogin = () => {
    navigation.goBack();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepsContainer}>
      <View style={styles.stepWrapper}>
        <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
          <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
        </View>
        <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>E-mail</Text>
      </View>
      <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
      <View style={styles.stepWrapper}>
        <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
          <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>
        </View>
        <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Código</Text>
      </View>
      <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
      <View style={styles.stepWrapper}>
        <View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
          <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
        </View>
        <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Nova Senha</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="mail" size={80} color="rgba(179, 103, 212, 0.84)" />
      </View>
      <Text style={styles.stepTitle}>Esqueceu sua senha?</Text>
      <Text style={styles.stepDescription}>
        Digite seu e-mail cadastrado e enviaremos um código de verificação para redefinir sua senha.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>E-mail</Text>
        <View style={styles.inputWrapper}>
          <Icon name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleEnviarCodigo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Enviar código →</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="shield" size={80} color="rgba(179, 103, 212, 0.84)" />
      </View>
      <Text style={styles.stepTitle}>Verificação</Text>
      <Text style={styles.stepDescription}>
        Enviamos um código de 6 dígitos para o e-mail {email}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Código de verificação</Text>
        <View style={styles.inputWrapper}>
          <Icon name="key" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#94A3B8"
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleVerificarCodigo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verificar código →</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.reenviarContainer}
        onPress={handleEnviarCodigo}
      >
        <Text style={styles.reenviarText}>Não recebeu o código? </Text>
        <Text style={styles.reenviarLink}>Reenviar</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="lock" size={80} color="rgba(179, 103, 212, 0.84)" />
      </View>
      <Text style={styles.stepTitle}>Nova senha</Text>
      <Text style={styles.stepDescription}>
        Crie uma nova senha forte e segura para sua conta.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nova senha</Text>
        <View style={styles.inputWrapper}>
          <Icon name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#94A3B8"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry={!showPassword}
            editable={!loading}
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
        <Text style={styles.inputLabel}>Confirmar nova senha</Text>
        <View style={styles.inputWrapper}>
          <Icon name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirme sua nova senha"
            placeholderTextColor="#94A3B8"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRedefinirSenha}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Redefinir senha →</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <Icon name="check-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.modalTitle}>Senha redefinida!</Text>
          <Text style={styles.modalDescription}>
            Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
          </Text>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => {
              setShowSuccessModal(false);
              navigation.goBack();
            }}
          >
            <Text style={styles.modalButtonText}>Fazer login →</Text>
          </TouchableOpacity>
        </View>
      </View>
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

          <TouchableOpacity style={styles.backButton} onPress={handleVoltarLogin}>
            <Icon name="arrow-left" size={24} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconHeaderContainer}>
              <View style={styles.iconHeaderWrapper}>
                <Icon name="heart" size={24} color="#B367D4" />
              </View>
            </View>
            <Text style={styles.title}>PsicoCare</Text>
            <Text style={styles.subtitle}>
              Plataforma clínica de saúde mental.
            </Text>
          </View>

          {renderStepIndicator()}

          <View style={styles.form}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          <View style={styles.footer}>
            <View style={styles.securityIcon} />
            <Text style={styles.securityText}>AMBIENTE SEGURO & CRIPTOGRAFADO</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderSuccessModal()}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  stepActive: {
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderColor: 'rgba(179, 103, 212, 0.84)',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: 'Manrope',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Manrope',
  },
  stepLabelActive: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
  },
  form: {
    marginBottom: 32,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
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
  button: {
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  reenviarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  reenviarText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#64748B',
  },
  reenviarLink: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: 'rgba(179, 103, 212, 0.84)',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Manrope',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RecuperarSenhaPaciente;