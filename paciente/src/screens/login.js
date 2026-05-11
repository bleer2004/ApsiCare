import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const LoginPaciente = ({ navigation }) => {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!senha) {
      Alert.alert('Erro', 'Por favor, digite sua senha');
      return;
    }
    
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    
    // Simular login
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      // navigation.navigate('HomePaciente');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Blur decorativo no fundo */}
          <View style={styles.decorativeBlur} />
          
          {/* Logo e Título */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIconWrapper}>
                <View style={styles.logoIcon}>
                  {/* Ícone do cérebro */}
                  <Icon name="brain" size={28} color="#B366D4" />
                </View>
              </View>
            </View>
            <Text style={styles.appName}>PsicoCare</Text>
            <Text style={styles.appDescription}>Plataforma clínica de saúde mental.</Text>
          </View>

          {/* Formulário de Login */}
          <View style={styles.formContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.loginTitle}>Login</Text>
              <Text style={styles.loginSubtitle}>
                Bem vindo (a) à nossa plataforma! Crie uma senha para começar a utilizar o sistema.
              </Text>
            </View>

            <View style={styles.form}>
              {/* Campo Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={senha}
                    onChangeText={setSenha}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Campo Confirmar Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirme sua senha</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botão Entrar */}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <Icon name="arrow-right" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Segurança */}
            <View style={styles.footer}>
              <View style={styles.securityBadge}>
                <Icon name="shield" size={12} color="#10B981" />
                <Text style={styles.securityText}>Ambiente Seguro & Criptografado</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  decorativeBlur: {
    position: 'absolute',
    top: -64,
    right: -100,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(179, 102, 211, 0.15)',
    borderRadius: 9999,
    transform: [{ scale: 1 }],
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoContainer: {
    paddingBottom: 16,
  },
  logoIconWrapper: {
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    color: '#0F172A',
    lineHeight: 32,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    paddingBottom: 32,
  },
  loginTitle: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 25,
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 24,
  },
  form: {
    paddingBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
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
    paddingVertical: 16,
  },
  loginButton: {
    height: 56,
    backgroundColor: 'rgba(179, 102, 211, 0.84)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footer: {
    paddingTop: 40,
    paddingBottom: 48,
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#10B981',
    textTransform: 'uppercase',
    lineHeight: 16.5,
    letterSpacing: 0.5,
  },
});

export default LoginPaciente;