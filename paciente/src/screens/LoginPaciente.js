import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, registerForPushNotificationsAsync } from '../../../src/services/api';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAccessibilityStyles } from '../hooks/useAccessibilityStyles';

const LoginPaciente = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    baixaVisao,
    getColors,
    getTextStyle,
    getInputStyle,
    getButtonStyle,
    getIconProps,
    getSpacing,
  } = useAccessibilityStyles();

  const colors = getColors();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha email e senha');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/patient/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Erro', data.error || 'Email ou senha incorretos');
        return;
      }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      registerForPushNotificationsAsync('patient');
      navigation.replace('HomePaciente');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.replace('RecuperarSenhaPaciente', { email, primeiroAcesso: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={baixaVisao ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!baixaVisao && <View style={styles.decorativeBlur} />}

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoIconWrapper, baixaVisao && { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                <View style={styles.logoIcon}>
                  <Icon name="heart" {...getIconProps('heart', 'large', '#B366D4')} />
                </View>
              </View>
            </View>
            <Text style={[styles.appName, getTextStyle('xxlarge', colors.text)]}>
              ApsiCare
            </Text>
            <Text style={[styles.appDescription, getTextStyle('medium', colors.textSecondary)]}>
              Plataforma clínica de saúde mental.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.titleContainer}>
              <Text style={[styles.loginTitle, getTextStyle('xlarge', colors.text, '700')]}>
                Login
              </Text>
              <Text style={[styles.loginSubtitle, getTextStyle('large', colors.textSecondary)]}>
                Bem vindo(a)! Acesse sua conta para continuar.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputGroup, { marginBottom: getSpacing('large') }]}>
                <Text style={[styles.inputLabel, getTextStyle('medium', colors.text)]}>
                  E-mail
                </Text>
                <View style={[styles.inputWrapper, getInputStyle()]}>
                  <Icon name="mail" {...getIconProps('mail', 'medium')} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontSize: getTextStyle('medium').fontSize }]}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { marginBottom: getSpacing('large') }]}>
                <Text style={[styles.inputLabel, getTextStyle('medium', colors.text)]}>
                  Senha
                </Text>
                <View style={[styles.inputWrapper, getInputStyle()]}>
                  <Icon name="lock" {...getIconProps('lock', 'medium')} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontSize: getTextStyle('medium').fontSize }]}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={senha}
                    onChangeText={setSenha}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye' : 'eye-off'} {...getIconProps(showPassword ? 'eye' : 'eye-off', 'medium')} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
                <Text style={[styles.forgotPasswordText, getTextStyle('medium', colors.primary)]}>
                  Esqueci minha senha / Primeiro acesso
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.loginButton, getButtonStyle()]} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={baixaVisao ? '#000000' : '#FFFFFF'} />
                ) : (
                  <>
                    <Text style={[styles.loginButtonText, getTextStyle('large', baixaVisao ? '#000000' : '#FFFFFF', '700')]}>
                      Entrar
                    </Text>
                    <Icon name="arrow-right" {...getIconProps('arrow-right', 'medium', baixaVisao ? '#000000' : '#FFFFFF')} style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.securityBadge}>
                <Icon name="shield" {...getIconProps('shield', 'small', colors.success)} />
                <Text style={[styles.securityText, getTextStyle('small', colors.success)]}>
                  Ambiente Seguro & Criptografado
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  decorativeBlur: {
    position: 'absolute',
    top: -64,
    right: -100,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(179, 102, 211, 0.15)',
    borderRadius: 9999,
  },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 },
  logoContainer: { paddingBottom: 16 },
  logoIconWrapper: { padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.10)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  appName: { fontFamily: 'ABeeZee', fontWeight: '400', textAlign: 'center' },
  appDescription: { fontFamily: 'Manrope', fontWeight: '500', textAlign: 'center', marginTop: 4 },
  formContainer: { flex: 1, paddingHorizontal: 24 },
  titleContainer: { paddingBottom: 32 },
  loginTitle: { fontFamily: 'Manrope', fontWeight: '700', marginBottom: 4 },
  loginSubtitle: { fontFamily: 'Manrope', fontWeight: '400' },
  form: { paddingBottom: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontFamily: 'ABeeZee', fontWeight: '400', marginBottom: 8, paddingLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: 'Manrope', fontWeight: '400', paddingVertical: 16 },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontFamily: 'ABeeZee', fontWeight: '400' },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#2B6CEE', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  loginButtonText: { fontFamily: 'Manrope', fontWeight: '700', marginRight: 8 },
  buttonIcon: { marginLeft: 4 },
  footer: { paddingTop: 40, paddingBottom: 48, alignItems: 'center' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  securityText: { fontFamily: 'Manrope', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default LoginPaciente;
