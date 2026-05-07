import React, { useState } from 'react';
import { API_URL } from '../../services/api';
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

const RecuperarSenha = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: Código, 3: Nova Senha
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleEnviarCodigo = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, digite seu e-mail profissional');
      return;
    }
    
    setLoading(true);
    console.log("Tentando enviar para:", `${API_URL}/auth/forgot-password`); // Log da URL

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Resposta do Servidor:", data); 

      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro desconhecido no servidor');
        return;
      }

      setStep(2);
      Alert.alert('Código enviado!', 'Verifique sua caixa de entrada ou spam.');
    } catch (err) {
      console.error("Erro na Requisição:", err); // Log do erro técnico
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
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codigo }),
      });
      const data = await response.json();
      console.log(data)
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
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codigo, newPassword: novaSenha }),
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
        <Icon name="mail" size={80} color="#6366F1" />
      </View>
      <Text style={styles.stepTitle}>Esqueceu sua senha?</Text>
      <Text style={styles.stepDescription}>
        Digite seu e-mail profissional cadastrado e enviaremos um código de verificação para redefinir sua senha.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>E-mail profissional</Text>
        <View style={styles.inputWrapper}>
          <Icon name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="exemplo@clinica.com.br"
            placeholderTextColor="#9CA3AF"
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
        <Icon name="shield" size={80} color="#6366F1" />
      </View>
      <Text style={styles.stepTitle}>Verificação</Text>
      <Text style={styles.stepDescription}>
        Enviamos um código de 6 dígitos para o e-mail {email}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Código de verificação</Text>
        <View style={styles.inputWrapper}>
          <Icon name="key" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
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
        <Icon name="lock" size={80} color="#6366F1" />
      </View>
      <Text style={styles.stepTitle}>Nova senha</Text>
      <Text style={styles.stepDescription}>
        Crie uma nova senha forte e segura para sua conta.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nova senha</Text>
        <View style={styles.inputWrapper}>
          <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#9CA3AF"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirmar nova senha</Text>
        <View style={styles.inputWrapper}>
          <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirme sua nova senha"
            placeholderTextColor="#9CA3AF"
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleVoltarLogin}>
            <Icon name="arrow-left" size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.header}>
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
            <Icon name="shield" size={16} color="#10B981" />
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
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#6366F1',
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#6366F1',
  },
  form: {
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
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
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reenviarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  reenviarText: {
    fontSize: 14,
    color: '#6B7280',
  },
  reenviarLink: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 32,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
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
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RecuperarSenha;