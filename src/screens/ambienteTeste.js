import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { lerSessao, rotaDaNotificacao } from '../services/sessao';

const { width, height } = Dimensions.get('window');

// ============================================================
// COMPONENTE: ONDA ANIMADA (movimento fluido e elegante)
// ============================================================
const AnimatedWave = ({ animatedValue }) => {
  const wave1TranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const wave2TranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const wave1Scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const wave1Path = `M0 ${height * 0.55} C${width * 0.25} ${height * 0.35}, ${width * 0.5} ${height * 0.65}, ${width * 0.75} ${height * 0.45} S${width * 1.1} ${height * 0.55}, ${width} ${height * 0.5} V${height} H0 Z`;
  const wave2Path = `M0 ${height * 0.65} C${width * 0.3} ${height * 0.5}, ${width * 0.6} ${height * 0.75}, ${width * 0.85} ${height * 0.6} S${width * 1.1} ${height * 0.7}, ${width} ${height * 0.65} V${height} H0 Z`;

  return (
    <>
      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateY: wave1TranslateY }, { scale: wave1Scale }] }
        ]}
      >
        <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="waveGradient1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#B367D4" stopOpacity="0.18" />
              <Stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#A8E6CF" stopOpacity="0.06" />
            </LinearGradient>
          </Defs>
          <Path d={wave1Path} fill="url(#waveGradient1)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateY: wave2TranslateY }] }
        ]}
      >
        <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="waveGradient2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#B367D4" stopOpacity="0.10" />
              <Stop offset="100%" stopColor="#D4F0E8" stopOpacity="0.04" />
            </LinearGradient>
          </Defs>
          <Path d={wave2Path} fill="url(#waveGradient2)" />
        </Svg>
      </Animated.View>
    </>
  );
};

// ============================================================
// COMPONENTE: PARTÍCULAS FLUTUANTES
// ============================================================
const FloatingParticles = () => {
  const particles = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height * 0.7,
      size: 3 + Math.random() * 8,
      delay: Math.random() * 3000,
      duration: 4000 + Math.random() * 4000,
      color: ['#B367D4', '#8B5CF6', '#A8E6CF', '#D4F0E8'][Math.floor(Math.random() * 4)],
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <FloatingParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

const FloatingParticle = ({ x, y, size, delay, duration, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: duration / 2,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -60,
            duration: duration,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: duration / 2,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
};

// ============================================================
// COMPONENTE: LOADER ANIMADO
// ============================================================
const AnimatedLoader = ({ visible }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      spinValue.setValue(0);
      pulseAnim.setValue(0);
    }
  }, [visible, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.05],
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.loaderOverlay, { opacity: fadeAnim }]}>
      <View style={styles.loaderContainer}>
        <View style={styles.loaderRing}>
          <Animated.View style={[
            styles.loaderPulse,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            }
          ]} />
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="loader" size={60} color="#B367D4" />
          </Animated.View>
        </View>
        <Text style={styles.loaderText}>Preparando seu espaço...</Text>
        <View style={styles.loaderDots}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={200} />
          <AnimatedDot delay={400} />
        </View>
      </View>
    </Animated.View>
  );
};

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

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const WelcomeScreen = ({ navigation }) => {
  const [showSelection, setShowSelection] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Animações da tela welcome
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleSlide = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const buttonShimmer = useRef(new Animated.Value(0)).current;

  // Animações da tela seleção
  const selectionFade = useRef(new Animated.Value(0)).current;
  const card1Slide = useRef(new Animated.Value(50)).current;
  const card2Slide = useRef(new Animated.Value(50)).current;

  // Verificação de sessão existente
  useEffect(() => {
    (async () => {
      const urlInicial = await Linking.getInitialURL().catch(() => null);
      if (urlInicial?.includes('privacidade')) {
        navigation.reset({ index: 0, routes: [{ name: 'DocumentoLegal', params: { tipo: 'privacidade' } }] });
        return;
      }
      const sessao = await lerSessao();
      if (!sessao) return;
      const ultimaResposta = Notifications.getLastNotificationResponse();
      const rotaPush = rotaDaNotificacao(ultimaResposta?.notification?.request?.content?.data, sessao);
      if (ultimaResposta) Notifications.clearLastNotificationResponse();
      const routes = [{ name: sessao.home }];
      if (rotaPush && rotaPush.name !== sessao.home) routes.push(rotaPush);
      else if (rotaPush) routes[0] = rotaPush;
      navigation.reset({ index: routes.length - 1, routes });
    })();
  }, []);

  // Animação de entrada principal
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
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleSlide, {
        toValue: 0,
        duration: 800,
        delay: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.2],
  });

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
      Animated.parallel([
        Animated.timing(selectionFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(card1Slide, {
          toValue: 0,
          duration: 700,
          delay: 200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(card2Slide, {
          toValue: 0,
          duration: 700,
          delay: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
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

  const handleBackToWelcome = () => {
    Animated.parallel([
      Animated.timing(selectionFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(card1Slide, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(card2Slide, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSelection(false);
    });
  };

  // ============================================================
  // TELA DE SELEÇÃO DE PERFIL
  // ============================================================
  if (showSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
        
        <AnimatedWave animatedValue={waveAnim} />
        <FloatingParticles />
        
        <Animated.View 
          style={[
            styles.selectionContainer, 
            { 
              opacity: selectionFade,
            }
          ]}
        >
          {/* Botão voltar */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToWelcome}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color="#475569" />
          </TouchableOpacity>

          <View style={styles.selectionHeader}>
            <View style={styles.selectionIconContainer}>
              <Icon name="users" size={32} color="#B367D4" />
            </View>
            <Text style={styles.selectionTitle}>Como você deseja acessar?</Text>
            <Text style={styles.selectionSubtitle}>
              Escolha seu perfil para continuar
            </Text>
          </View>

          <View style={styles.profilesContainer}>
            <Animated.View style={{ transform: [{ translateY: card1Slide }] }}>
              <TouchableOpacity
                style={[styles.profileCard, styles.psychologistCard]}
                onPress={() => handleProfileSelect('psychologist')}
                activeOpacity={0.85}
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
            </Animated.View>

            <Animated.View style={{ transform: [{ translateY: card2Slide }] }}>
              <TouchableOpacity
                style={[styles.profileCard, styles.patientCard]}
                onPress={() => handleProfileSelect('patient')}
                activeOpacity={0.85}
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
            </Animated.View>
          </View>

          <View style={styles.selectionFooter}>
            <Icon name="shield" size={14} color="#10B981" />
            <Text style={styles.selectionFooterText}>
              Ambiente Seguro & Criptografado
            </Text>
          </View>
        </Animated.View>

        <AnimatedLoader visible={showLoader} />
      </SafeAreaView>
    );
  }

  // ============================================================
  // TELA DE BOAS-VINDAS
  // ============================================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      {/* Fundo animado */}
      <AnimatedWave animatedValue={waveAnim} />
      <FloatingParticles />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Animated.View 
            style={[
              styles.logoIconWrapper,
              {
                transform: [
                  { scale: logoScale },
                  { rotate: logoRotateInterpolate },
                ]
              }
            ]}
          >
            <Animated.View style={[
              styles.logoIconGlow,
              {
                transform: [{ scale: glowScale }],
                opacity: glowOpacity,
              }
            ]} />
            <Icon name="heart" size={52} color="#B367D4" />
          </Animated.View>
          
          <Animated.View style={{ transform: [{ translateY: titleSlide }] }}>
            <Text style={styles.logoText}>Apsicare</Text>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ translateY: subtitleSlide }] }}>
            <Text style={styles.logoSubtext}>
              Cuidando da sua saúde mental
            </Text>
          </Animated.View>
        </View>

        {/* Boas-vindas */}
        <Animated.View style={[
          styles.welcomeContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          <Text style={styles.welcomeTitle}>Bem-vindo(a)!</Text>
          <Text style={styles.welcomeDescription}>
            Sua jornada para o bem-estar emocional começa aqui.{'\n'}
            Estamos aqui para apoiar você em cada passo.
          </Text>
        </Animated.View>

        {/* Botão Iniciar */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPress}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>Iniciar</Text>
            <View style={styles.startButtonIcon}>
              <Icon name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <View style={styles.securityDot} />
            <Text style={styles.securityText}>
              Ambiente Seguro & Criptografado
            </Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// ============================================================
// ESTILOS
// ============================================================
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
    height: height,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconWrapper: {
    width: 110,
    height: 110,
    backgroundColor: 'rgba(179, 103, 212, 0.12)',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 103, 212, 0.20)',
    position: 'relative',
  },
  logoIconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
  },
  logoText: {
    fontSize: 34,
    fontFamily: 'Manrope',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
    marginTop: 6,
  },
  
  // Welcome
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
    marginBottom: 14,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: '95%',
  },
  
  // Botão
  startButton: {
    backgroundColor: '#B367D4',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#B367D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  startButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  securityText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    lineHeight: 16,
    letterSpacing: 1,
  },

  // ============ TELA DE SELEÇÃO ============
  selectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  selectionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(179, 103, 212, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(179, 103, 212, 0.20)',
  },
  selectionTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
  profilesContainer: {
    gap: 16,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 18,
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
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 2,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientArrow: {
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
  },
  selectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
  },
  selectionFooterText: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ============ LOADER ============
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loaderRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(179, 103, 212, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 103, 212, 0.15)',
    position: 'relative',
  },
  loaderPulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#B367D4',
  },
  loaderText: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 28,
    marginBottom: 16,
  },
  loaderDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  loaderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B367D4',
  },
});

export default WelcomeScreen;