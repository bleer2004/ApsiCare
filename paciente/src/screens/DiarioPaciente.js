import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, GROQ_API_KEY } from '../../../src/services/api';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, Modal, ActivityIndicator, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Audio from 'expo-av/build/Audio';
import { useAccessibilityStyles } from '../hooks/useAccessibilityStyles';

const DiarioPaciente = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [anotacao, setAnotacao] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [breathingModalVisible, setBreathingModalVisible] = useState(false);
  const [breathingStep, setBreathingStep] = useState(1);
  const [selectedAnotacao, setSelectedAnotacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState(null);
  const [anotacoes, setAnotacoes] = useState([]);

  const [humorNota, setHumorNota] = useState(5);
  const [impactoNota, setImpactoNota] = useState(3);
  const [contexto, setContexto] = useState('');

  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const recordingRef = useRef(null);

  // Hooks de acessibilidade
  const {
    baixaVisao,
    daltonismo,
    getColors,
    getTextStyle,
    getButtonStyle,
    getCardStyle,
    getIconProps,
    getSpacing,
    adaptarCor,
  } = useAccessibilityStyles();

  const colors = getColors();

  const contextos = [
    { id: 'estudando', label: '📚 Estudando', icon: 'book' },
    { id: 'trabalhando', label: '💼 Trabalhando', icon: 'briefcase' },
    { id: 'deslocando', label: '🚗 Me deslocando', icon: 'navigation' },
    { id: 'socializando', label: '👥 Socializando', icon: 'users' },
    { id: 'descansando', label: '😌 Descansando', icon: 'coffee' },
    { id: 'exercicio', label: '🏃 Praticando exercício', icon: 'activity' },
  ];

  const moods = [
    { id: 'feliz', label: 'Feliz', color: '#E3F2FD', iconColor: '#2563EB', emoji: '😃', valence: 8, arousal: 7 },
    { id: 'calmo', label: 'Calmo', color: '#E0F2F1', iconColor: '#0D9488', emoji: '😌', valence: 7, arousal: 3 },
    { id: 'ansioso', label: 'Ansioso', color: '#F3E5F5', iconColor: '#9333EA', emoji: '😰', valence: 3, arousal: 8 },
    { id: 'triste', label: 'Triste', color: '#FCE4EC', iconColor: '#DB2777', emoji: '😢', valence: 2, arousal: 2 },
    { id: 'neutral', label: 'Neutro', color: '#F1F5F9', iconColor: '#64748B', emoji: '😐', valence: 5, arousal: 5 },
  ];

  useEffect(() => {
    carregarHistorico();
    verificarConsentimento();
  }, []);

  const verificarConsentimento = async () => {
    const aceito = await AsyncStorage.getItem('diarioLgpdConsent');
    if (aceito === 'true') {
      setBreathingModalVisible(true);
      iniciarContagemRespiração();
    } else {
      setConsentModalVisible(true);
    }
  };

  const aceitarConsentimento = async () => {
    await AsyncStorage.setItem('diarioLgpdConsent', 'true');
    setConsentModalVisible(false);
    setBreathingModalVisible(true);
    iniciarContagemRespiração();
  };

  const iniciarContagemRespiração = () => {
    let step = 1;
    const interval = setInterval(() => {
      if (step < 5) {
        step++;
        setBreathingStep(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBreathingModalVisible(false);
        }, 500);
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const carregarHistorico = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const response = await fetch(`${API_URL}/patients/${user.id}/moods?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const formatados = (data.moods || [])
          .filter(m => m.diaryText)
          .map((m, i) => ({
            id: String(i),
            humor: m.contextTags?.[0] || 'neutro',
            titulo: `Se sentindo ${m.contextTags?.[0] || 'neutro'}`,
            texto: m.diaryText || '',
            humorNota: m.moodScore || 5,
            impactoNota: m.impactScore || 3,
            contexto: m.context || '',
            data: new Date(m.timestamp).toLocaleDateString('pt-BR'),
            shared: m.sharedWithPsychologist || false,
            moodId: m.id,
          }));
        setAnotacoes(formatados);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMoodEmoji = (moodId) => moods.find(m => m.id === moodId)?.emoji || '😐';
  const getContextoLabel = (contextoId) => {
    const ctx = contextos.find(c => c.id === contextoId);
    return ctx ? ctx.label : contextoId;
  };

  const iniciarGravacao = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permissão negada', 'Autorize o uso do microfone nas configurações.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setGravando(true);
    } catch (e) {
      Alert.alert('Erro ao gravar', e?.message || String(e));
    }
  };

  const pararGravacaoETranscrever = async () => {
    if (!recordingRef.current) return;
    setGravando(false);
    setTranscrevendo(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      const formData = new FormData();
      formData.append('file', { uri, type: 'audio/m4a', name: 'recording.m4a' });
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'pt');

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setAnotacao(prev => prev ? `${prev} ${data.text}` : data.text);
      } else {
        Alert.alert('Erro na transcrição', data.error?.message || `Status ${res.status}`);
      }
    } catch (e) {
      console.error('[transcrever] erro geral:', e?.message);
      Alert.alert('Erro', e?.message || String(e));
    } finally {
      setTranscrevendo(false);
    }
  };

  const handleSalvar = async () => {
    if (!selectedMood) {
      Alert.alert('Atenção', 'Selecione como você está se sentindo');
      return;
    }
    if (!anotacao.trim()) {
      Alert.alert('Atenção', 'Escreva algo nas anotações antes de salvar');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const mood = moods.find(m => m.id === selectedMood);

      const response = await fetch(`${API_URL}/patients/${user.id}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          valenceScore: mood.valence,
          arousalScore: mood.arousal,
          contextTags: [selectedMood],
          diaryText: anotacao,
          moodScore: humorNota,
          impactScore: impactoNota,
          context: contexto,
        })
      });

      if (response.ok) {
        setSelectedMood(null);
        setAnotacao('');
        setHumorNota(5);
        setImpactoNota(3);
        setContexto('');
        Alert.alert('Sucesso', 'Anotação salva com sucesso!');
        await carregarHistorico();
      } else {
        const errData = await response.json().catch(() => ({}));
        Alert.alert('Erro', errData.message || `Status ${response.status}`);
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a anotação');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarComPartilha = async () => {
    if (!selectedMood) {
      Alert.alert('Atenção', 'Selecione como você está se sentindo');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      const mood = moods.find(m => m.id === selectedMood);

      const response = await fetch(`${API_URL}/patients/${user.id}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          valenceScore: mood.valence,
          arousalScore: mood.arousal,
          contextTags: [selectedMood],
          diaryText: anotacao,
          moodScore: humorNota,
          impactScore: impactoNota,
          context: contexto,
          sharedWithPsychologist: true,
        })
      });

      if (response.ok) {
        setSelectedMood(null);
        setAnotacao('');
        setHumorNota(5);
        setImpactoNota(3);
        setContexto('');
        Alert.alert('Sucesso', 'Anotação salva e compartilhada com seu psicólogo!');
        await carregarHistorico();
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a anotação');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarParaPsicologo = async (anotacaoItem) => {
    Alert.alert(
      'Enviar para psicólogo',
      'Deseja compartilhar esta anotação com seu psicólogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setSharingId(anotacaoItem.id);
            try {
              const token = await AsyncStorage.getItem('token');
              const userStr = await AsyncStorage.getItem('user');
              const user = JSON.parse(userStr);
              
              const response = await fetch(`${API_URL}/patients/${user.id}/moods/${anotacaoItem.moodId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sharedWithPsychologist: true })
              });

              if (response.ok) {
                Alert.alert('Sucesso', 'Anotação compartilhada com seu psicólogo!');
                await carregarHistorico();
              } else {
                Alert.alert('Erro', 'Não foi possível compartilhar a anotação');
              }
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível compartilhar a anotação');
            } finally {
              setSharingId(null);
            }
          }
        }
      ]
    );
  };

  const handleEnviarAnotacaoAtual = () => {
    if (!anotacao.trim()) {
      Alert.alert('Atenção', 'Escreva algo antes de enviar para o psicólogo');
      return;
    }
    Alert.alert(
      'Enviar para psicólogo',
      'Deseja compartilhar esta anotação com seu psicólogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => handleSalvarComPartilha() }
      ]
    );
  };

  const renderConsentModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={consentModalVisible}
      onRequestClose={() => {}}
    >
      <View style={styles.breathingOverlay}>
        <View style={[styles.consentContainer, { backgroundColor: baixaVisao ? '#1A1A1A' : '#1E1B2E' }]}>
          <Icon name="shield" {...getIconProps('shield', 'xlarge', '#B367D4')} />
          <Text style={[styles.consentTitle, getTextStyle('xlarge', '#FFFFFF', '700')]}>Sua privacidade importa</Text>
          <Text style={[styles.consentText, getTextStyle('medium', '#CBD5E1', '400')]}>
            O texto que você escreve ou grava aqui é enviado para serviços de
            inteligência artificial de terceiros (para transcrição de voz e
            análise de sentimento/estresse), com o objetivo de gerar insights
            para você e seu psicólogo.{'\n\n'}
            Não envie dados como CPF, endereço ou outras informações que não
            sejam sobre como você está se sentindo.
          </Text>
          <TouchableOpacity
            style={[styles.consentButton, { backgroundColor: colors.primary }]}
            onPress={aceitarConsentimento}
          >
            <Text style={[styles.consentButtonText, getTextStyle('medium', '#FFFFFF', '700')]}>Entendi e aceito</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderBreathingModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={breathingModalVisible}
      onRequestClose={() => setBreathingModalVisible(false)}
    >
      <View style={styles.breathingOverlay}>
        <View style={styles.breathingContainer}>
          <View style={[styles.breathingCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.breathingNumber, { color: colors.primary, fontSize: baixaVisao ? 64 : 48 }]}>{breathingStep}</Text>
          </View>
          <Text style={[styles.breathingTitle, getTextStyle('xxlarge', '#FFFFFF', '700')]}>Respire fundo...</Text>
          <Text style={[styles.breathingSubtitle, getTextStyle('large', '#94A3B8', '400')]}>
            Inspire e expire lentamente enquanto escreve o que vem à sua mente
          </Text>
          <TouchableOpacity 
            style={styles.breathingSkipButton} 
            onPress={() => setBreathingModalVisible(false)}
          >
            <Text style={[styles.breathingSkipText, getTextStyle('medium', '#FFFFFF', '500')]}>Pular</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={baixaVisao ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {renderConsentModal()}
      {renderBreathingModal()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: baixaVisao ? colors.background : 'rgba(246, 246, 248, 0.80)', borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" {...getIconProps('arrow-left', 'medium', colors.primary)} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, getTextStyle('large', colors.text, '700')]}>Diário emocional</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Seção de Humor */}
        <View style={[styles.moodSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.moodTitle, getTextStyle('large', colors.text, '600')]}>Como você está se sentindo hoje?</Text>
          <View style={[
            styles.moodContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              padding: baixaVisao ? 20 : 16,
            }
          ]}>
            {moods.map((mood) => {
              const selecionado = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={styles.moodItem}
                  onPress={() => setSelectedMood(mood.id)}
                >
                  <View style={[
                    styles.moodIconWrapper,
                    { 
                      backgroundColor: baixaVisao ? colors.cardBackground : mood.color,
                      width: baixaVisao ? 72 : 56,
                      height: baixaVisao ? 72 : 56,
                      borderRadius: baixaVisao ? 20 : 16,
                      borderColor: selecionado ? colors.primary : 'transparent',
                      borderWidth: selecionado ? 3 : 2,
                    },
                    selecionado && styles.moodIconWrapperSelected,
                  ]}>
                    <Text style={[styles.moodEmoji, { fontSize: baixaVisao ? 32 : 24 }]}>{mood.emoji}</Text>
                  </View>
                  <Text style={[
                    styles.moodLabel,
                    getTextStyle('small', selecionado ? colors.primary : '#475569', selecionado ? '700' : '500')
                  ]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Avaliação de Humor */}
        <View style={[styles.ratingSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.ratingTitle, getTextStyle('medium', colors.text, '600')]}>Qual foi seu nível de humor hoje?</Text>
          <Text style={[styles.ratingSubtitle, getTextStyle('small', colors.textSecondary)]}>1 = Muito mal | 10 = Muito bem</Text>
          <View style={styles.ratingContainer}>
            <Text style={[styles.ratingMin, getTextStyle('small', colors.textSecondary)]}>1</Text>
            <View style={styles.ratingSlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.ratingDot,
                    humorNota >= num && { backgroundColor: colors.primary },
                    { paddingVertical: baixaVisao ? 10 : 6 },
                  ]}
                  onPress={() => setHumorNota(num)}
                >
                  <Text style={[
                    styles.ratingDotText,
                    getTextStyle('small', humorNota >= num ? '#FFFFFF' : colors.textSecondary, '600'),
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingMax, getTextStyle('small', colors.textSecondary)]}>10</Text>
          </View>
        </View>

        {/* Impacto */}
        <View style={[styles.ratingSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.ratingTitle, getTextStyle('medium', colors.text, '600')]}>O quanto isso impactou no seu dia?</Text>
          <Text style={[styles.ratingSubtitle, getTextStyle('small', colors.textSecondary)]}>1 = Pouco impacto | 5 = Muito impacto</Text>
          <View style={styles.impactContainer}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.impactButton,
                  impactoNota === num && { backgroundColor: adaptarCor('#10B981') },
                  { paddingVertical: baixaVisao ? 16 : 12 },
                ]}
                onPress={() => setImpactoNota(num)}
              >
                <Text style={[
                  styles.impactButtonText,
                  getTextStyle('large', impactoNota === num ? '#FFFFFF' : colors.textSecondary, '700'),
                ]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contexto */}
        <View style={[styles.contextSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.contextTitle, getTextStyle('medium', colors.text, '600')]}>Em que contexto você estava?</Text>
          <View style={styles.contextContainer}>
            {contextos.map((ctx) => (
              <TouchableOpacity
                key={ctx.id}
                style={[
                  styles.contextButton,
                  contexto === ctx.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                  { 
                    paddingHorizontal: baixaVisao ? 18 : 14,
                    paddingVertical: baixaVisao ? 12 : 8,
                  }
                ]}
                onPress={() => setContexto(ctx.id)}
              >
                <Icon name={ctx.icon} {...getIconProps(ctx.icon, 'medium', contexto === ctx.id ? '#FFFFFF' : colors.textSecondary)} />
                <Text style={[
                  styles.contextButtonText,
                  getTextStyle('small', contexto === ctx.id ? '#FFFFFF' : colors.textSecondary, '500'),
                ]}>{ctx.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Anotações */}
        <View style={[styles.anotacaoSection, { paddingHorizontal: getSpacing('medium') }]}>
          <View style={styles.sectionLabelContainer}>
            <Icon name="edit-2" {...getIconProps('edit-2', 'medium', colors.primary)} />
            <Text style={[styles.sectionLabel, getTextStyle('medium', colors.text, '600')]}>Anotações do dia</Text>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                gravando && { backgroundColor: adaptarCor('#EF4444') },
                { backgroundColor: colors.primary }
              ]}
              onPress={gravando ? pararGravacaoETranscrever : iniciarGravacao}
              disabled={transcrevendo}
            >
              {transcrevendo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name={gravando ? 'square' : 'mic'} {...getIconProps(gravando ? 'square' : 'mic', 'small', '#FFFFFF')} />
              )}
              <Text style={[styles.voiceButtonText, getTextStyle('small', '#FFFFFF', '600')]}>
                {transcrevendo ? 'Transcrevendo...' : gravando ? 'Parar' : 'Gravar voz'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[
            styles.anotacaoContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              minHeight: baixaVisao ? 200 : 180,
              padding: baixaVisao ? 20 : 16,
            }
          ]}>
            <TextInput
              style={[
                styles.anotacaoInput,
                {
                  color: colors.text,
                  fontSize: getTextStyle('medium').fontSize,
                  minHeight: baixaVisao ? 170 : 150,
                }
              ]}
              placeholder="Escreva ou grave sua voz para preencher automaticamente..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={anotacao}
              onChangeText={setAnotacao}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botões de ação */}
        <View style={[styles.buttonsRow, { paddingHorizontal: getSpacing('medium') }]}>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: colors.primary,
                paddingVertical: baixaVisao ? 20 : 16,
              }
            ]} 
            onPress={handleSalvar} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.saveButtonText, getTextStyle('large', '#FFFFFF', '700')]}>Salvar</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.shareButton, 
              { 
                backgroundColor: adaptarCor('#10B981'),
                paddingVertical: baixaVisao ? 20 : 16,
              }
            ]} 
            onPress={handleEnviarAnotacaoAtual} 
            disabled={loading}
          >
            <Icon name="send" {...getIconProps('send', 'medium', '#FFFFFF')} />
            <Text style={[styles.shareButtonText, getTextStyle('medium', '#FFFFFF', '700')]}>Enviar ao psicólogo</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico */}
        <View style={[styles.recentSection, { paddingHorizontal: getSpacing('medium') }]}>
          <Text style={[styles.recentTitle, getTextStyle('large', colors.text, '600')]}>Anotações recentes</Text>
          {anotacoes.length === 0 ? (
            <View style={[styles.emptyState, { paddingVertical: baixaVisao ? 80 : 60 }]}>
              <Icon name="book-open" {...getIconProps('book-open', 'xlarge', colors.textMuted)} />
              <Text style={[styles.emptyText, getTextStyle('medium', colors.textSecondary, '500')]}>Nenhuma anotação ainda</Text>
            </View>
          ) : (
            anotacoes.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.anotacaoCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    padding: baixaVisao ? 20 : 16,
                  }
                ]} 
                onPress={() => { setSelectedAnotacao(item); setModalVisible(true); }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.cardEmoji, { fontSize: baixaVisao ? 26 : 20 }]}>{getMoodEmoji(item.humor)}</Text>
                    <View>
                      <Text style={[styles.cardTitle, getTextStyle('medium', colors.text, '700')]}>{item.titulo}</Text>
                      <Text style={[styles.cardDate, getTextStyle('small', colors.textMuted)]}>{item.data}</Text>
                    </View>
                  </View>
                  {!item.shared && item.texto && (
                    <TouchableOpacity 
                      style={[styles.shareIconButton, { backgroundColor: baixaVisao ? 'rgba(179,103,212,0.15)' : 'rgba(179,103,212,0.10)' }]} 
                      onPress={() => handleEnviarParaPsicologo(item)}
                      disabled={sharingId === item.id}
                    >
                      {sharingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Icon name="send" {...getIconProps('send', 'small', colors.primary)} />
                      )}
                    </TouchableOpacity>
                  )}
                  {item.shared && (
                    <View style={[styles.sharedBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Icon name="check-circle" {...getIconProps('check-circle', 'small', '#10B981')} />
                      <Text style={[styles.sharedText, getTextStyle('small', '#10B981', '500')]}>Compartilhado</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardBadges}>
                  <View style={[styles.cardBadge, { backgroundColor: baixaVisao ? colors.cardBackground : '#F8FAFC' }]}>
                    <Icon name="star" {...getIconProps('star', 'small', '#F59E0B')} />
                    <Text style={[styles.cardBadgeText, getTextStyle('small', colors.textSecondary)]}>Humor: {item.humorNota || 5}/10</Text>
                  </View>
                  <View style={[styles.cardBadge, { backgroundColor: baixaVisao ? colors.cardBackground : '#F8FAFC' }]}>
                    <Icon name="activity" {...getIconProps('activity', 'small', '#10B981')} />
                    <Text style={[styles.cardBadgeText, getTextStyle('small', colors.textSecondary)]}>Impacto: {item.impactoNota || 3}/5</Text>
                  </View>
                  {item.contexto && (
                    <View style={[styles.cardBadge, { backgroundColor: baixaVisao ? colors.cardBackground : '#F8FAFC' }]}>
                      <Icon name="map-pin" {...getIconProps('map-pin', 'small', '#3B82F6')} />
                      <Text style={[styles.cardBadgeText, getTextStyle('small', colors.textSecondary)]}>{getContextoLabel(item.contexto)}</Text>
                    </View>
                  )}
                </View>
                
                {item.texto && (
                  <Text style={[styles.cardText, getTextStyle('medium', colors.textSecondary), { numberOfLines: 2 }]}>{item.texto}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            {
              backgroundColor: colors.cardBackground,
              borderTopLeftRadius: baixaVisao ? 28 : 24,
              borderTopRightRadius: baixaVisao ? 28 : 24,
            }
          ]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, getTextStyle('large', colors.text, '600')]}>Detalhes da anotação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" {...getIconProps('x', 'medium', colors.textMuted)} />
              </TouchableOpacity>
            </View>
            {selectedAnotacao && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalMood}>
                  <Text style={[styles.modalEmoji, { fontSize: baixaVisao ? 36 : 28 }]}>{getMoodEmoji(selectedAnotacao.humor)}</Text>
                  <Text style={[styles.modalMoodText, getTextStyle('large', colors.text, '600')]}>{selectedAnotacao.titulo}</Text>
                </View>
                <Text style={[styles.modalDate, getTextStyle('small', colors.textMuted)]}>{selectedAnotacao.data}</Text>
                
                <View style={[styles.modalBadges, { borderBottomColor: colors.border }]}>
                  <View style={styles.modalBadge}>
                    <Text style={[styles.modalBadgeLabel, getTextStyle('small', colors.textMuted)]}>😊 Humor</Text>
                    <Text style={[styles.modalBadgeValue, getTextStyle('large', colors.text, '700')]}>{selectedAnotacao.humorNota || 5}/10</Text>
                  </View>
                  <View style={styles.modalBadge}>
                    <Text style={[styles.modalBadgeLabel, getTextStyle('small', colors.textMuted)]}>⚡ Impacto</Text>
                    <Text style={[styles.modalBadgeValue, getTextStyle('large', colors.text, '700')]}>{selectedAnotacao.impactoNota || 3}/5</Text>
                  </View>
                  {selectedAnotacao.contexto && (
                    <View style={styles.modalBadge}>
                      <Text style={[styles.modalBadgeLabel, getTextStyle('small', colors.textMuted)]}>📍 Contexto</Text>
                      <Text style={[styles.modalBadgeValue, getTextStyle('large', colors.text, '700')]}>{getContextoLabel(selectedAnotacao.contexto)}</Text>
                    </View>
                  )}
                </View>
                
                {selectedAnotacao.texto && (
                  <>
                    <Text style={[styles.modalSubtitle, getTextStyle('medium', colors.text, '600')]}>📝 Anotações</Text>
                    <Text style={[styles.modalText, getTextStyle('medium', colors.textSecondary)]}>{selectedAnotacao.texto}</Text>
                  </>
                )}
                
                {!selectedAnotacao.shared && selectedAnotacao.texto && (
                  <TouchableOpacity 
                    style={[styles.modalPsychButton, { backgroundColor: baixaVisao ? colors.cardBackground : '#F3F4F6', borderColor: colors.border, borderWidth: 1 }]} 
                    onPress={() => {
                      handleEnviarParaPsicologo(selectedAnotacao);
                      setModalVisible(false);
                    }}
                  >
                    <Icon name="send" {...getIconProps('send', 'medium', colors.primary)} />
                    <Text style={[styles.modalPsychText, getTextStyle('medium', colors.primary, '600')]}>Compartilhar com psicólogo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={[
        styles.bottomNavigation,
        {
          backgroundColor: baixaVisao ? colors.cardBackground : 'rgba(255, 255, 255, 0.80)',
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" {...getIconProps('home', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="book-open" {...getIconProps('book-open', 'medium', colors.primary)} />
          <Text style={[styles.navText, getTextStyle('small', colors.primary, '700')]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" {...getIconProps('target', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" {...getIconProps('user', 'medium', colors.textMuted)} />
          <Text style={[styles.navText, getTextStyle('small', colors.textMuted, '500')]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Mantenha os styles originais, apenas remova as cores fixas que foram substituídas
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 28,
  },
  headerPlaceholder: {
    width: 40,
  },
  moodSection: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  moodTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
  },
  moodItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: 2,
  },
  moodIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodIconWrapperSelected: {
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {},
  moodLabel: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 16,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingMin: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    width: 20,
  },
  ratingMax: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    width: 20,
    textAlign: 'right',
  },
  ratingSlider: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  ratingDot: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
  },
  ratingDotText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  impactContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  impactButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
  },
  impactButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
  contextSection: {
    marginBottom: 20,
  },
  contextTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  contextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  contextButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  voiceButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  sectionLabel: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 20,
  },
  anotacaoSection: {
    marginBottom: 16,
  },
  anotacaoContainer: {
    borderRadius: 12,
    borderWidth: 1,
  },
  anotacaoInput: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 24,
  },
  recentSection: {
    marginBottom: 16,
  },
  recentTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 16,
  },
  anotacaoCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardEmoji: {},
  cardTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    lineHeight: 20,
  },
  cardDate: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    textTransform: 'uppercase',
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  shareIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sharedText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  cardText: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    marginTop: 12,
  },
  breathingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  consentContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    marginHorizontal: 24,
  },
  consentTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  consentText: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  consentButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  consentButtonText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
  },
  breathingNumber: {
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
  breathingTitle: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    marginBottom: 16,
  },
  breathingSubtitle: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  breathingSkipButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  breathingSkipText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalEmoji: {},
  modalMoodText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  modalDate: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    marginBottom: 16,
  },
  modalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalBadge: {
    alignItems: 'center',
    gap: 4,
  },
  modalBadgeLabel: {
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  modalBadgeValue: {
    fontFamily: 'Manrope',
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: 'Manrope',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  modalText: {
    fontFamily: 'Manrope',
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalPsychButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalPsychText: {
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  bottomNavigation: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {},
  navText: {
    fontFamily: 'Manrope',
    fontWeight: '500',
    lineHeight: 15,
    textTransform: 'uppercase',
  },
});

export default DiarioPaciente;