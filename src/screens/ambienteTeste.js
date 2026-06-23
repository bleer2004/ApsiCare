import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Componente de Onda Animada
const AnimatedWave = ({ animatedValue }) => {
  // Corrigido: usando transformação de translateY diretamente
  const waveTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  // Gerando o path da onda
  const getWavePath = () => {
    return `M0 ${height * 0.4} C${width * 0.2} ${height * 0.2}, ${width * 0.4} ${height * 0.5}, ${width * 0.5} ${height * 0.4} C${width * 0.6} ${height * 0.3}, ${width * 0.8} ${height * 0.5}, ${width} ${height * 0.4} V${height} H0 Z`;
  };

  return (
    <Animated.View 
      style={[
        styles.waveContainer,
        {
          transform: [{ translateY: waveTranslateY }]
        }
      ]}
    >
      <Svg height={height * 0.8} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A8E6CF" stopOpacity="0.3"/>
            <Stop offset="100%" stopColor="#D4F0E8" stopOpacity="0.05"/>
          </LinearGradient>
        </Defs>
        <Path d={getWavePath()} fill="url(#waveGradient)" />
      </Svg>
    </Animated.View>
  );
};

// Componente de Loading Animado
const AnimatedLoader = ({ visible }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.loaderOverlay}>
      <View style={styles.loaderContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Icon name="loader" size={60} color="#B367D4" />
        </Animated.View>
        <Text style={styles.loaderText}>Redirecionando...</Text>
        <View style={styles.loaderDots}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={200} />
          <AnimatedDot delay={400} />
        </View>
      </View>
    </View>
  );
};

// Componente de Pontos Animados
const AnimatedDot = ({ delay }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [scale, delay]);

  return (
    <Animated.View
      style={[
        styles.loaderDot,
        { transform: [{ scale }] },
      ]}
    />
  );
};

const WelcomeScreen = ({ navigation }) => {
  const [showSelection, setShowSelection] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  // Animação de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back()),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back()),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const handleStartPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSelection(true);
    });
  };

  const handleProfileSelect = (profile) => {
    setShowLoader(true);
    
    setTimeout(() => {
      setShowLoader(false);
      if (profile === 'psychologist') {
        navigation.replace('LoginSignedUp');
      } else {
        navigation.replace('LoginPaciente');
      }
    }, 2500);
  };

  if (showSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
        
        <Animated.View style={[styles.selectionContainer, { opacity: fadeAnim }]}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Como você deseja acessar?</Text>
            <Text style={styles.selectionSubtitle}>
              Escolha seu perfil para continuar
            </Text>
          </View>

          <View style={styles.profilesContainer}>
            <TouchableOpacity
              style={[styles.profileCard, styles.psychologistCard]}
              onPress={() => handleProfileSelect('psychologist')}
              activeOpacity={0.8}
            >
              <View style={styles.profileIconWrapper}>
                <Icon name="briefcase" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileCardTitle}>Psicólogo</Text>
                <Text style={styles.profileCardDescription}>
                  Acesse o painel profissional
                </Text>
              </View>
              <View style={styles.profileCardArrow}>
                <Icon name="arrow-right" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileCard, styles.patientCard]}
              onPress={() => handleProfileSelect('patient')}
              activeOpacity={0.8}
            >
              <View style={[styles.profileIconWrapper, styles.patientIconWrapper]}>
                <Icon name="user" size={32} color="#B367D4" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileCardTitle, styles.patientTitle]}>
                  Paciente
                </Text>
                <Text style={[styles.profileCardDescription, styles.patientDescription]}>
                  Acesse seu diário emocional
                </Text>
              </View>
              <View style={[styles.profileCardArrow, styles.patientArrow]}>
                <Icon name="arrow-right" size={20} color="#B367D4" />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <AnimatedLoader visible={showLoader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <AnimatedWave animatedValue={waveAnim} />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Animated.View 
            style={[
              styles.logoIconWrapper,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Icon name="heart" size={48} color="#B367D4" />
          </Animated.View>
          <Text style={styles.logoText}>ApsiCare</Text>
          <Text style={styles.logoSubtext}>
            Cuidando da sua saúde mental
          </Text>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Bem-vindo(a)!</Text>
          <Text style={styles.welcomeDescription}>
            Sua jornada para o bem-estar emocional começa aqui.
            Estamos aqui para apoiar você em cada passo.
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPress}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>Iniciar</Text>
            <Icon name="arrow-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <Icon name="shield" size={14} color="#10B981" />
            <Text style={styles.securityText}>
              Ambiente Seguro & Criptografado
            </Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconWrapper: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 40,
  },
  logoSubtext: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    marginTop: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 36,
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: '90%',
  },
  startButton: {
    backgroundColor: '#B367D4',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#B367D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#10B981',
    textTransform: 'uppercase',
    lineHeight: 16.5,
    letterSpacing: 0.5,
  },

  // Selection Screen Styles
  selectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 30,
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  selectionTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
  },
  profilesContainer: {
    gap: 20,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  psychologistCard: {
    backgroundColor: '#B367D4',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileIconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientIconWrapper: {
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
  },
  profileInfo: {
    flex: 1,
  },
  profileCardTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  patientTitle: {
    color: '#0F172A',
  },
  profileCardDescription: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  patientDescription: {
    color: '#64748B',
  },
  profileCardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientArrow: {
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
  },

  // Loader Styles
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 16,
  },
  loaderDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B367D4',
  },
});

export default WelcomeScreen;