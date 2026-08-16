import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../src/services/api';
import Icon from 'react-native-vector-icons/Feather';
import { useAccessibilityStyles } from '../hooks/useAccessibilityStyles';

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

const RecuperarSenhaPaciente = ({ navigation, route }) => {
  const primeiroAcesso = route?.params?.primeiroAcesso || false;
  const emailInicial = route?.params?.email || '';
  const [email, setEmail] = useState(emailInicial);
  const [step, setStep] = useState(emailInicial ? 2 : 1);
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Hooks de acessibilidade
  const {
    baixaVisao,
    daltonismo,
    getColors,
    getTextStyle,
    getButtonStyle,
    getIconProps,
    getSpacing,
    getInputStyle,
    adaptarCor,
  } = useAccessibilityStyles();

  const colors = getColors();

  useEffect(() => {
    if (primeiroAcesso && emailInicial) {
      enviarCodigoParaEmail(emailInicial).then(() => {
        Alert.alert('Código enviado!', `Enviamos um código para ${emailInicial}. Verifique sua caixa de entrada ou spam.`);
      });
    }
  }, []);

  const enviarCodigoParaEmail = async (emailParaEnviar) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/patient/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParaEnviar }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Erro ao enviar código');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarCodigo = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, digite seu e-mail');
      return;
    }
    await enviarCodigoParaEmail(email);
    setStep(2);
    Alert.alert('Código enviado!', 'Verifique sua caixa de entrada ou spam.');
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
      Alert.alert('Código verificado!', 'Agora você pode criar sua senha');
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
        Alert.alert('Erro', data.error || 'Erro ao criar senha');
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
    navigation.replace('LoginPaciente');
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepsContainer, { paddingHorizontal: baixaVisao ? 10 : 20 }]}>
      <View style={styles.stepWrapper}>
        <View style={[
          styles.stepCircle,
          step >= 1 && styles.stepActive,
          {
            width: baixaVisao ? 48 : 40,
            height: baixaVisao ? 48 : 40,
            borderRadius: baixaVisao ? 24 : 20,
            borderColor: step >= 1 ? colors.primary : colors.border,
            backgroundColor: step >= 1 ? colors.primary : colors.cardBackground,
          }
        ]}>
          <Text style={[
            styles.stepNumber,
            getTextStyle('medium', step >= 1 ? '#FFFFFF' : colors.textMuted, '600'),
          ]}>1</Text>
        </View>
        <Text style={[
          styles.stepLabel,
          getTextStyle('small', step >= 1 ? colors.primary : colors.textMuted, step >= 1 ? '600' : '400'),
        ]}>E-mail</Text>
      </View>
      <View style={[
        styles.stepLine,
        step >= 2 && styles.stepLineActive,
        {
          backgroundColor: step >= 2 ? colors.primary : colors.border,
          height: baixaVisao ? 3 : 2,
        }
      ]} />
      <View style={styles.stepWrapper}>
        <View style={[
          styles.stepCircle,
          step >= 2 && styles.stepActive,
          {
            width: baixaVisao ? 48 : 40,
            height: baixaVisao ? 48 : 40,
            borderRadius: baixaVisao ? 24 : 20,
            borderColor: step >= 2 ? colors.primary : colors.border,
            backgroundColor: step >= 2 ? colors.primary : colors.cardBackground,
          }
        ]}>
          <Text style={[
            styles.stepNumber,
            getTextStyle('medium', step >= 2 ? '#FFFFFF' : colors.textMuted, '600'),
          ]}>2</Text>
        </View>
        <Text style={[
          styles.stepLabel,
          getTextStyle('small', step >= 2 ? colors.primary : colors.textMuted, step >= 2 ? '600' : '400'),
        ]}>Código</Text>
      </View>
      <View style={[
        styles.stepLine,
        step >= 3 && styles.stepLineActive,
        {
          backgroundColor: step >= 3 ? colors.primary : colors.border,
          height: baixaVisao ? 3 : 2,
        }
      ]} />
      <View style={styles.stepWrapper}>
        <View style={[
          styles.stepCircle,
          step >= 3 && styles.stepActive,
          {
            width: baixaVisao ? 48 : 40,
            height: baixaVisao ? 48 : 40,
            borderRadius: baixaVisao ? 24 : 20,
            borderColor: step >= 3 ? colors.primary : colors.border,
            backgroundColor: step >= 3 ? colors.primary : colors.cardBackground,
          }
        ]}>
          <Text style={[
            styles.stepNumber,
            getTextStyle('medium', step >= 3 ? '#FFFFFF' : colors.textMuted, '600'),
          ]}>3</Text>
        </View>
        <Text style={[
          styles.stepLabel,
          getTextStyle('small', step >= 3 ? colors.primary : colors.textMuted, step >= 3 ? '600' : '400'),
        ]}>Criar Senha</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="mail" {...getIconProps('mail', 'xlarge', colors.primary)} />
      </View>
      <Text style={[styles.stepTitle, getTextStyle('xlarge', colors.text, '700')]}>
        {primeiroAcesso ? 'Primeiro acesso' : 'Acessar sua conta'}
      </Text>
      <Text style={[styles.stepDescription, getTextStyle('medium', colors.textSecondary, '400')]}>
        {primeiroAcesso
          ? 'Confirme seu e-mail para receber o código de verificação.'
          : 'Digite seu e-mail cadastrado e enviaremos um código de verificação.'
        }
      </Text>
      <View style={[styles.inputContainer, { marginBottom: getSpacing('large') }]}>
        <Text style={[styles.inputLabel, getTextStyle('medium', colors.text)]}>E-mail</Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            height: baixaVisao ? 64 : 56,
            paddingHorizontal: getSpacing('medium'),
          }
        ]}>
          <Icon name="mail" {...getIconProps('mail', 'medium', colors.textMuted)} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: getTextStyle('medium').fontSize,
                paddingVertical: baixaVisao ? 18 : 14,
              }
            ]}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            paddingVertical: baixaVisao ? 20 : 16,
            marginBottom: getSpacing('medium'),
          }
        ]}
        onPress={handleEnviarCodigo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.buttonText, getTextStyle('large', '#FFFFFF', '700')]}>Enviar código →</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="shield" {...getIconProps('shield', 'xlarge', colors.primary)} />
      </View>
      <Text style={[styles.stepTitle, getTextStyle('xlarge', colors.text, '700')]}>Verificação</Text>

      {loading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[getTextStyle('medium', colors.textSecondary)]}>Enviando código...</Text>
        </View>
      )}

      <Text style={[styles.stepDescription, getTextStyle('medium', colors.textSecondary, '400')]}>
        {primeiroAcesso
          ? `Enviamos um código de 6 dígitos para ${emailInicial}. Verifique sua caixa de entrada.`
          : `Enviamos um código de 6 dígitos para o e-mail ${email}`
        }
      </Text>
      <View style={[styles.inputContainer, { marginBottom: getSpacing('large') }]}>
        <Text style={[styles.inputLabel, getTextStyle('medium', colors.text)]}>Código de verificação</Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            height: baixaVisao ? 64 : 56,
            paddingHorizontal: getSpacing('medium'),
          }
        ]}>
          <Icon name="key" {...getIconProps('key', 'medium', colors.textMuted)} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: getTextStyle('medium').fontSize,
                paddingVertical: baixaVisao ? 18 : 14,
              }
            ]}
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            paddingVertical: baixaVisao ? 20 : 16,
            marginBottom: getSpacing('medium'),
          }
        ]}
        onPress={handleVerificarCodigo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.buttonText, getTextStyle('large', '#FFFFFF', '700')]}>Verificar código →</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.reenviarContainer}
        onPress={() => enviarCodigoParaEmail(email).then(() => {
          Alert.alert('Código reenviado!', 'Verifique sua caixa de entrada ou spam.');
        })}
      >
        <Text style={[styles.reenviarText, getTextStyle('medium', colors.textSecondary)]}>Não recebeu o código? </Text>
        <Text style={[styles.reenviarLink, getTextStyle('medium', colors.primary, '600')]}>Reenviar</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="lock" {...getIconProps('lock', 'xlarge', colors.primary)} />
      </View>
      <Text style={[styles.stepTitle, getTextStyle('xlarge', colors.text, '700')]}>
        {primeiroAcesso ? 'Criar sua senha' : 'Redefinir sua senha'}
      </Text>
      <Text style={[styles.stepDescription, getTextStyle('medium', colors.textSecondary, '400')]}>
        Crie uma senha forte e segura para acessar o ApsiCare.
      </Text>
      <View style={[styles.inputContainer, { marginBottom: getSpacing('large') }]}>
        <Text style={[styles.inputLabel, getTextStyle('medium', colors.text)]}>Nova senha</Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            height: baixaVisao ? 64 : 56,
            paddingHorizontal: getSpacing('medium'),
          }
        ]}>
          <Icon name="lock" {...getIconProps('lock', 'medium', colors.textMuted)} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: getTextStyle('medium').fontSize,
                paddingVertical: baixaVisao ? 18 : 14,
              }
            ]}
            placeholder="Digite sua nova senha"
            placeholderTextColor={colors.textMuted}
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              {...getIconProps(showPassword ? 'eye-off' : 'eye', 'medium', colors.textMuted)}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.inputContainer, { marginBottom: getSpacing('large') }]}>
        <Text style={[styles.inputLabel, getTextStyle('medium', colors.text)]}>Confirmar senha</Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            height: baixaVisao ? 64 : 56,
            paddingHorizontal: getSpacing('medium'),
          }
        ]}>
          <Icon name="lock" {...getIconProps('lock', 'medium', colors.textMuted)} style={styles.inputIcon} />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: getTextStyle('medium').fontSize,
                paddingVertical: baixaVisao ? 18 : 14,
              }
            ]}
            placeholder="Confirme sua senha"
            placeholderTextColor={colors.textMuted}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            paddingVertical: baixaVisao ? 20 : 16,
            marginBottom: getSpacing('medium'),
          }
        ]}
        onPress={handleRedefinirSenha}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.buttonText, getTextStyle('large', '#FFFFFF', '700')]}>
            {primeiroAcesso ? 'Criar senha →' : 'Redefinir senha →'}
          </Text>
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
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor: colors.cardBackground,
            borderRadius: baixaVisao ? 28 : 24,
            padding: baixaVisao ? 32 : 24,
          }
        ]}>
          <View style={styles.successIconContainer}>
            <Icon name="check-circle" {...getIconProps('check-circle', 'xlarge', '#10B981')} />
          </View>
          <Text style={[styles.modalTitle, getTextStyle('xlarge', colors.text, '700')]}>
            {primeiroAcesso ? 'Senha criada!' : 'Senha redefinida!'}
          </Text>
          <Text style={[styles.modalDescription, getTextStyle('medium', colors.textSecondary, '400')]}>
            {primeiroAcesso
              ? 'Sua senha foi criada com sucesso. Agora você pode usar o app.'
              : 'Sua senha foi redefinida com sucesso. Agora você pode fazer login.'
            }
          </Text>
          <TouchableOpacity
            style={[
              styles.modalButton,
              {
                backgroundColor: colors.primary,
                paddingVertical: baixaVisao ? 16 : 12,
              }
            ]}
            onPress={() => {
              setShowSuccessModal(false);
              navigation.replace('LoginPaciente');
            }}
          >
            <Text style={[styles.modalButtonText, getTextStyle('large', '#FFFFFF', '600')]}>Fazer login →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={baixaVisao ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {!baixaVisao && (
            <View style={styles.blurBackground}>
              <View style={[styles.blurCircle, { backgroundColor: colors.primary + '15' }]} />
            </View>
          )}

          <TouchableOpacity style={[
            styles.backButton,
            {
              backgroundColor: colors.cardBackground,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }
          ]} onPress={handleVoltarLogin}>
            <Icon name="arrow-left" {...getIconProps('arrow-left', 'medium', colors.text)} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconHeaderContainer}>
              <View style={[
                styles.iconHeaderWrapper,
                {
                  backgroundColor: baixaVisao ? 'rgba(255,255,255,0.10)' : 'rgba(16, 185, 129, 0.10)',
                }
              ]}>
                <Icon name="heart" {...getIconProps('heart', 'medium', colors.primary)} />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text, fontSize: baixaVisao ? 32 : 24 }]}>ApsiCare</Text>
            <Text style={[styles.subtitle, getTextStyle('medium', colors.textSecondary, '500')]}>
              {primeiroAcesso ? 'Configure sua senha de acesso.' : 'Plataforma clínica de saúde mental.'}
            </Text>
          </View>

          {renderStepIndicator()}

          <View style={styles.form}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          <View style={styles.footer}>
            <View style={[styles.securityIcon, { backgroundColor: adaptarCor('#10B981') }]} />
            <Text style={[styles.securityText, getTextStyle('small', adaptarCor('#10B981'), '500'), { textTransform: 'uppercase', letterSpacing: 0.5 }]}>
              AMBIENTE SEGURO & CRIPTOGRAFADO
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
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
    zIndex: 1,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  stepNumber: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  stepLabel: {
    fontFamily: 'Manrope',
  },
  stepLine: {
    flex: 1,
    marginHorizontal: 8,
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
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
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
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope',
    fontWeight: '400',
    paddingHorizontal: 0,
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
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
    fontFamily: 'Manrope',
  },
  reenviarLink: {
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
  },
  securityText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontFamily: 'Manrope',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
});

export default RecuperarSenhaPaciente;