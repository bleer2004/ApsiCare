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
} from 'react-native';
import { styles } from './styles';
import { API_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginSignedUp = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // Se data.token for undefined, salvamos o ID como string para não dar erro
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

  const handleForgotPassword = () => {
    // Navega pra tela de forgot password 
    // navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('Cadastro');
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
          <View style={styles.header}>
            <Text style={styles.title}>PsicoCare</Text>
            <Text style={styles.subtitle}>
              Plataforma clínica de saúde mental.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.loginTitle}>Login</Text>
            <Text style={styles.loginDescription}>
              Acesse sua conta para gerenciar seus atendimentos e prontuários.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail profissional</Text>
              <TextInput
                style={styles.input}
                placeholder="exemplo@clinica.com.br"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginButtonText}>Entrar →</Text>
              }
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Não possui cadastro? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Cadastre-se já!</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.securityText}>
              AMBIENTE SEGURO & CRIPTOGRAFADO
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginSignedUp;