import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Alert, Modal, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const DiarioPaciente = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [anotacao, setAnotacao] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [breathingModalVisible, setBreathingModalVisible] = useState(false);
  const [breathingStep, setBreathingStep] = useState(1);
  const [selectedAnotacao, setSelectedAnotacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState(null);
  const [anotacoes, setAnotacoes] = useState([]);

  // NOVOS ESTADOS
  const [humorNota, setHumorNota] = useState(5);
  const [impactoNota, setImpactoNota] = useState(3);
  const [contexto, setContexto] = useState('');

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
    setBreathingModalVisible(true);
    iniciarContagemRespiração();
  }, []);

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

  const renderBreathingModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={breathingModalVisible}
      onRequestClose={() => setBreathingModalVisible(false)}
    >
      <View style={styles.breathingOverlay}>
        <View style={styles.breathingContainer}>
          <View style={styles.breathingCircle}>
            <Text style={styles.breathingNumber}>{breathingStep}</Text>
          </View>
          <Text style={styles.breathingTitle}>Respire fundo...</Text>
          <Text style={styles.breathingSubtitle}>
            Inspire e expire lentamente enquanto escreve o que vem à sua mente
          </Text>
          <TouchableOpacity 
            style={styles.breathingSkipButton} 
            onPress={() => setBreathingModalVisible(false)}
          >
            <Text style={styles.breathingSkipText}>Pular</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      {renderBreathingModal()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#B367D4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diário emocional</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.moodTitle}>Como você está se sentindo hoje?</Text>
          <View style={styles.moodContainer}>
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
                    { backgroundColor: mood.color },
                    selecionado && styles.moodIconWrapperSelected,
                  ]}>
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </View>
                  <Text style={[styles.moodLabel, selecionado && styles.moodLabelSelected]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Qual foi seu nível de humor hoje?</Text>
          <Text style={styles.ratingSubtitle}>1 = Muito mal | 10 = Muito bem</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingMin}>1</Text>
            <View style={styles.ratingSlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.ratingDot,
                    humorNota >= num && styles.ratingDotActive,
                  ]}
                  onPress={() => setHumorNota(num)}
                >
                  <Text style={[
                    styles.ratingDotText,
                    humorNota >= num && styles.ratingDotTextActive
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingMax}>10</Text>
          </View>
        </View>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>O quanto isso impactou no seu dia?</Text>
          <Text style={styles.ratingSubtitle}>1 = Pouco impacto | 5 = Muito impacto</Text>
          <View style={styles.impactContainer}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.impactButton,
                  impactoNota === num && styles.impactButtonActive,
                ]}
                onPress={() => setImpactoNota(num)}
              >
                <Text style={[
                  styles.impactButtonText,
                  impactoNota === num && styles.impactButtonTextActive
                ]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.contextSection}>
          <Text style={styles.contextTitle}>Em que contexto você estava?</Text>
          <View style={styles.contextContainer}>
            {contextos.map((ctx) => (
              <TouchableOpacity
                key={ctx.id}
                style={[
                  styles.contextButton,
                  contexto === ctx.id && styles.contextButtonActive,
                ]}
                onPress={() => setContexto(ctx.id)}
              >
                <Icon name={ctx.icon} size={18} color={contexto === ctx.id ? '#FFFFFF' : '#64748B'} />
                <Text style={[
                  styles.contextButtonText,
                  contexto === ctx.id && styles.contextButtonTextActive
                ]}>{ctx.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.anotacaoSection}>
          <View style={styles.sectionLabelContainer}>
            <Icon name="edit-2" size={16} color="#B367D4" />
            <Text style={styles.sectionLabel}>Anotações do dia</Text>
          </View>
          <View style={styles.anotacaoContainer}>
            <TextInput
              style={styles.anotacaoInput}
              placeholder="Este é um local seguro, expresse suas ideias, pensamentos..."
              placeholderTextColor="#94A3B8"
              multiline
              value={anotacao}
              onChangeText={setAnotacao}
              textAlignVertical="top"
            />
          </View>
        </View>

        

        {/* Botões de ação */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleEnviarAnotacaoAtual} disabled={loading}>
            <Icon name="send" size={18} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Enviar ao psicólogo</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico de Anotações */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Anotações recentes</Text>
          {anotacoes.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="book-open" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhuma anotação ainda</Text>
            </View>
          ) : (
            anotacoes.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.anotacaoCard} 
                onPress={() => { setSelectedAnotacao(item); setModalVisible(true); }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardEmoji}>{getMoodEmoji(item.humor)}</Text>
                    <View>
                      <Text style={styles.cardTitle}>{item.titulo}</Text>
                      <Text style={styles.cardDate}>{item.data}</Text>
                    </View>
                  </View>
                  {!item.shared && item.texto && (
                    <TouchableOpacity 
                      style={styles.shareIconButton} 
                      onPress={() => handleEnviarParaPsicologo(item)}
                      disabled={sharingId === item.id}
                    >
                      {sharingId === item.id ? (
                        <ActivityIndicator size="small" color="#B367D4" />
                      ) : (
                        <Icon name="send" size={16} color="#B367D4" />
                      )}
                    </TouchableOpacity>
                  )}
                  {item.shared && (
                    <View style={styles.sharedBadge}>
                      <Icon name="check-circle" size={12} color="#10B981" />
                      <Text style={styles.sharedText}>Compartilhado</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardBadges}>
                  <View style={styles.cardBadge}>
                    <Icon name="star" size={10} color="#F59E0B" />
                    <Text style={styles.cardBadgeText}>Humor: {item.humorNota || 5}/10</Text>
                  </View>
                  <View style={styles.cardBadge}>
                    <Icon name="activity" size={10} color="#10B981" />
                    <Text style={styles.cardBadgeText}>Impacto: {item.impactoNota || 3}/5</Text>
                  </View>
                  {item.contexto && (
                    <View style={styles.cardBadge}>
                      <Icon name="map-pin" size={10} color="#3B82F6" />
                      <Text style={styles.cardBadgeText}>{getContextoLabel(item.contexto)}</Text>
                    </View>
                  )}
                </View>
                
                {item.texto && (
                  <Text style={styles.cardText} numberOfLines={2}>{item.texto}</Text>
                )}
                
                
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da anotação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {selectedAnotacao && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalMood}>
                  <Text style={styles.modalEmoji}>{getMoodEmoji(selectedAnotacao.humor)}</Text>
                  <Text style={styles.modalMoodText}>{selectedAnotacao.titulo}</Text>
                </View>
                <Text style={styles.modalDate}>{selectedAnotacao.data}</Text>
                
                {/* Notas no modal */}
                <View style={styles.modalBadges}>
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeLabel}>😊 Humor</Text>
                    <Text style={styles.modalBadgeValue}>{selectedAnotacao.humorNota || 5}/10</Text>
                  </View>
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeLabel}>⚡ Impacto</Text>
                    <Text style={styles.modalBadgeValue}>{selectedAnotacao.impactoNota || 3}/5</Text>
                  </View>
                  {selectedAnotacao.contexto && (
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeLabel}>📍 Contexto</Text>
                      <Text style={styles.modalBadgeValue}>{getContextoLabel(selectedAnotacao.contexto)}</Text>
                    </View>
                  )}
                </View>
                
                {selectedAnotacao.texto && (
                  <>
                    <Text style={styles.modalSubtitle}>📝 Anotações</Text>
                    <Text style={styles.modalText}>{selectedAnotacao.texto}</Text>
                  </>
                )}
                
                {!selectedAnotacao.shared && selectedAnotacao.texto && (
                  <TouchableOpacity 
                    style={styles.modalPsychButton} 
                    onPress={() => {
                      handleEnviarParaPsicologo(selectedAnotacao);
                      setModalVisible(false);
                    }}
                  >
                    <Icon name="send" size={18} color="#B367D4" />
                    <Text style={styles.modalPsychText}>Compartilhar com psicólogo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomePaciente')}>
          <Icon name="home" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="book-open" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Diário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PerfilPaciente')}>
          <Icon name="user" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
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
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43, 108, 238, 0.10)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  headerPlaceholder: {
    width: 40,
  },
  moodSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  moodTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
  },
  moodItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: 2,
  },
  moodIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodIconWrapperSelected: {
    borderColor: '#B367D4',
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },
  moodLabelSelected: {
    color: '#B367D4',
    fontWeight: '700',
  },
  // NOVOS ESTILOS
  ratingSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingMin: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
    width: 20,
  },
  ratingMax: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
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
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  ratingDotActive: {
    backgroundColor: '#B367D4',
  },
  ratingDotText: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#64748B',
  },
  ratingDotTextActive: {
    color: '#FFFFFF',
  },
  impactContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  impactButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  impactButtonActive: {
    backgroundColor: '#10B981',
  },
  impactButtonText: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#64748B',
  },
  impactButtonTextActive: {
    color: '#FFFFFF',
  },
  contextSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  contextTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contextButtonActive: {
    backgroundColor: '#B367D4',
    borderColor: '#B367D4',
  },
  contextButtonText: {
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
  },
  contextButtonTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#64748B',
  },
  modalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalBadge: {
    alignItems: 'center',
    gap: 4,
  },
  modalBadgeLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
  },
  modalBadgeValue: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  anotacaoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  anotacaoContainer: {
    minHeight: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 238, 0.10)',
    padding: 16,
  },
  anotacaoInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#B367D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2B6CEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  recentSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
  },
  anotacaoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F2EEF6',
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
  cardEmoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '400',
    textTransform: 'uppercase',
    color: '#94A3B8',
    lineHeight: 15,
    letterSpacing: 0.5,
  },
  shareIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(179, 103, 212, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  sharedText: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#10B981',
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#475569',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
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
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(179, 103, 212, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#B367D4',
  },
  breathingNumber: {
    fontSize: 48,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#B367D4',
  },
  breathingTitle: {
    fontSize: 24,
    fontFamily: 'Manrope',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  breathingSubtitle: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#94A3B8',
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
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#1F2937',
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
  modalEmoji: {
    fontSize: 28,
  },
  modalMoodText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#1F2937',
  },
  modalDate: {
    fontSize: 12,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 16,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalPsychButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalPsychText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  navTextActive: {
    color: '#B367D4',
    fontWeight: '700',
  },
});

export default DiarioPaciente;