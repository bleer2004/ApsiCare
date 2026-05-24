import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { API_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const LoginSignedUp = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.error || 'E-mail ou senha incorretos.');
        return;
      }

      const tokenToSave = data.token || String(data.user.id);
      
      await AsyncStorage.setItem('token', tokenToSave);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      console.log('Login realizado com sucesso:', data.user);
      navigation.replace('VisaoGeral');
      
    } catch (err) {
      console.error("Erro na requisição de login:", err);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Cadastro');
  };
  
  const handleForgotPassword = () => {
    navigation.navigate('RecuperarSenha');
  };

  return (
    <SafeAreaView style={styles.container}>
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

          {/* Header com ícone */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <Icon name="heart" size={28} color="#B367D4" />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>ApsiCare</Text>
            </View>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Plataforma clínica de saúde mental.
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Login Title Section */}
            <View style={styles.loginHeader}>
              <View style={styles.loginTitleContainer}>
                <Text style={styles.loginTitle}>Login</Text>
              </View>
              <View style={styles.loginDescriptionContainer}>
                <Text style={styles.loginDescription}>
                  Acesse sua conta para gerenciar seus atendimentos e prontuários.
                </Text>
              </View>
            </View>

            {/* Input Fields Section */}
            <View style={styles.inputsSection}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail profissional</Text>
                <View style={styles.inputFieldContainer}>
                  <Icon name="mail" size={20} color="#94A3B8" style={styles.inputIconLeft} />
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

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={styles.inputFieldContainer}>
                  <Icon name="lock" size={20} color="#94A3B8" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIconRight}>
                    <Icon name={showPassword ? "eye" : "eye-off"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordWrapper} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin} 
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <Icon name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View style={styles.footerSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Não possui cadastro?</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={handleSignUp}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpText}>Cadastre-se já!</Text>
              </TouchableOpacity>
              
              <View style={styles.securityContainer}>
                <Icon name="shield" size={12} color="#10B981" />
                <Text style={styles.securityText}>
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
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingBottom: 40,
  },
  // Efeito de fundo
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
  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    paddingBottom: 16,
  },
  iconWrapper: {
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 0,
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitleContainer: {
    paddingTop: 4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  // Form Container
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
    zIndex: 1,
  },
  // Login Header
  loginHeader: {
    paddingBottom: 32,
  },
  loginTitleContainer: {
    marginBottom: 4,
  },
  loginTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 25,
  },
  loginDescriptionContainer: {
    marginTop: 0,
  },
  loginDescription: {
    color: '#64748B',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 24,
  },
  // Inputs Section
  inputsSection: {
    paddingBottom: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
    paddingLeft: 4,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    position: 'relative',
  },
  inputIconLeft: {
    marginRight: 12,
  },
  inputIconRight: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#0F172A',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  // Forgot Password
  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    lineHeight: 20,
  },
  // Login Button
  loginButton: {
    height: 56,
    backgroundColor: 'rgba(179, 103, 212, 0.84)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  // Footer Section
  footerSection: {
    paddingTop: 3,
    paddingBottom: 48,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 40,
    paddingBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    textTransform: 'uppercase',
    lineHeight: 16,
    letterSpacing: 1.2,
  },
  signUpButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(179, 103, 212, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    color: 'rgba(179, 103, 212, 0.84)',
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  securityText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    textTransform: 'uppercase',
    lineHeight: 16.5,
  },
});

export default LoginSignedUp;