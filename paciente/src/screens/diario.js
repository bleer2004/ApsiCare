import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Share,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const DiarioPaciente = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [anotacao, setAnotacao] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnotacao, setSelectedAnotacao] = useState(null);

  const moods = [
    { id: 'feliz', label: 'Feliz', color: '#E3F2FD', iconColor: '#2563EB', emoji: '😃' },
    { id: 'calmo', label: 'Calmo', color: '#E0F2F1', iconColor: '#0D9488', emoji: '😌' },
    { id: 'ansioso', label: 'Ansioso', color: '#F3E5F5', iconColor: '#9333EA', emoji: '😰' },
    { id: 'triste', label: 'Triste', color: '#FCE4EC', iconColor: '#DB2777', emoji: '😢' },
    { id: 'neutral', label: 'Neutral', color: '#F1F5F9', iconColor: '#64748B', emoji: '😐' },
  ];

  const [anotacoes, setAnotacoes] = useState([
    {
      id: '1',
      humor: 'feliz',
      titulo: 'Se sentindo alegre',
      texto: 'Hoje dei uma caminhada matinal com meu cachorro e me senti melhor durante o dia.',
      data: 'Ontem - 10:30',
      compartilhada: false,
    },
    {
      id: '2',
      humor: 'calmo',
      titulo: 'Dia tranquilo',
      texto: 'Consegui meditar por 10 minutos hoje pela manhã. Me ajudou a começar o dia melhor.',
      data: '16/05/2024 - 09:15',
      compartilhada: true,
    },
    {
      id: '3',
      humor: 'ansioso',
      titulo: 'Dia desafiador',
      texto: 'Tive uma apresentação no trabalho e fiquei muito nervosa. Mas consegui respirar e me acalmar.',
      data: '15/05/2024 - 14:30',
      compartilhada: false,
    },
  ]);

  const getMoodEmoji = (moodId) => {
    const mood = moods.find(m => m.id === moodId);
    return mood ? mood.emoji : '😐';
  };

  const getMoodTitle = (moodId) => {
    const mood = moods.find(m => m.id === moodId);
    return mood ? `Se sentindo ${mood.label.toLowerCase()}` : 'Registro emocional';
  };

  const handleSalvar = () => {
    if (!selectedMood) {
      Alert.alert('Atenção', 'Selecione como você está se sentindo');
      return;
    }
    if (!anotacao.trim()) {
      Alert.alert('Atenção', 'Escreva sua anotação');
      return;
    }

    const novaAnotacao = {
      id: String(anotacoes.length + 1),
      humor: selectedMood,
      titulo: getMoodTitle(selectedMood),
      texto: anotacao,
      data: new Date().toLocaleDateString('pt-BR') + ' - ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      compartilhada: false,
    };

    setAnotacoes([novaAnotacao, ...anotacoes]);
    setSelectedMood(null);
    setAnotacao('');
    Alert.alert('Sucesso', 'Anotação salva com sucesso!');
  };

  const handleCompartilhar = async (anotacaoItem) => {
    try {
      const mood = moods.find(m => m.id === anotacaoItem.humor);
      const mensagem = `📔 *Diário PsicoCare*\n\n${mood?.emoji || '📝'} *${anotacaoItem.titulo}*\n\n📅 ${anotacaoItem.data}\n\n"${anotacaoItem.texto}"\n\n---\nCompartilhado via PsicoCare`;
      
      await Share.share({
        message: mensagem,
        title: `Diário - ${anotacaoItem.titulo}`,
      });
      
      // Marcar como compartilhada
      setAnotacoes(anotacoes.map(a => 
        a.id === anotacaoItem.id ? { ...a, compartilhada: true } : a
      ));
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
    }
  };

  const handleCompartilharComPsicologo = (anotacaoItem) => {
    Alert.alert(
      'Compartilhar com psicólogo',
      'Deseja compartilhar esta anotação com seu psicólogo? Ele poderá ver e acompanhar seu progresso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Compartilhar', 
          onPress: () => {
            setAnotacoes(anotacoes.map(a => 
              a.id === anotacaoItem.id ? { ...a, compartilhada: true } : a
            ));
            Alert.alert('Sucesso', 'Anotação compartilhada com seu psicólogo!');
          }
        }
      ]
    );
  };

  const handleVerAnotacao = (anotacaoItem) => {
    setSelectedAnotacao(anotacaoItem);
    setModalVisible(true);
  };

  const handleVerHistorico = () => {
    Alert.alert('Histórico completo', 'Funcionalidade em desenvolvimento');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Icon name="arrow-left" size={20} color="#B367D4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diário emocional</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Seletor de Humor */}
        <View style={styles.moodSection}>
          <Text style={styles.moodTitle}>Como você está se sentindo hoje?</Text>
          <View style={styles.moodContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  selectedMood === mood.id && styles.moodItemSelected
                ]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <View style={[styles.moodIconWrapper, { backgroundColor: mood.color }]}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </View>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Campo de Anotação */}
        <View style={styles.anotacaoSection}>
          <View style={styles.anotacaoContainer}>
            <TextInput
              style={styles.anotacaoInput}
              placeholder="Este é um local seguro, expresse suas ideias, pensamentos... sinta-se à vontade."
              placeholderTextColor="#94A3B8"
              multiline
              value={anotacao}
              onChangeText={setAnotacao}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>

        {/* Anotações Recentes */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Anotações recentes</Text>
          
          {anotacoes.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.anotacaoCard}
              onPress={() => handleVerAnotacao(item)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardEmoji}>{getMoodEmoji(item.humor)}</Text>
                  <View>
                    <Text style={styles.cardTitle}>{item.titulo}</Text>
                    <Text style={styles.cardDate}>{item.data}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {item.compartilhada && (
                    <View style={styles.sharedBadge}>
                      <Icon name="share-2" size={10} color="#10B981" />
                      <Text style={styles.sharedText}>Compart.</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleCompartilharComPsicologo(item)}>
                    <Icon name="share-2" size={16} color="#B367D4" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardText} numberOfLines={2}>
                {item.texto}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.historyButton} onPress={handleVerHistorico}>
            <Text style={styles.historyButtonText}>Ver histórico completo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Detalhes da Anotação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
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
                <Text style={styles.modalText}>{selectedAnotacao.texto}</Text>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.modalShareButton}
                    onPress={() => {
                      handleCompartilhar(selectedAnotacao);
                      setModalVisible(false);
                    }}
                  >
                    <Icon name="share-2" size={18} color="#FFFFFF" />
                    <Text style={styles.modalShareText}>Compartilhar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalPsychButton}
                    onPress={() => {
                      handleCompartilharComPsicologo(selectedAnotacao);
                      setModalVisible(false);
                    }}
                  >
                    <Icon name="user" size={18} color="#B367D4" />
                    <Text style={styles.modalPsychText}>Compartilhar com psicólogo</Text>
                  </TouchableOpacity>
                </View>
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
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MetasPaciente')}>
          <Icon name="target" size={20} color="#94A3B8" />
          <Text style={styles.navText}>Metas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Icon name="book-open" size={20} color="#B367D4" />
          <Text style={[styles.navText, styles.navTextActive]}>Diário</Text>
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
  moodItemSelected: {
    opacity: 0.7,
  },
  moodIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  saveButton: {
    backgroundColor: '#B367D4',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 24,
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  sharedText: {
    fontSize: 8,
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
  historyButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#B367D4',
    lineHeight: 20,
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
  modalText: {
    fontSize: 16,
    fontFamily: 'Manrope',
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalShareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B367D4',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  modalShareText: {
    fontSize: 14,
    fontFamily: 'Manrope',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalPsychButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
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