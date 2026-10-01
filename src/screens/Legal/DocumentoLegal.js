import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { termosDeUso, politicaDePrivacidade } from '../../content/legalDocs';

const DocumentoLegal = ({ navigation, route }) => {
  const doc = route?.params?.tipo === 'privacidade' ? politicaDePrivacidade : termosDeUso;

  const renderBloco = (bloco, index) => {
    switch (bloco.tipo) {
      case 'h2':
        return <Text key={index} style={styles.h2}>{bloco.texto}</Text>;

      case 'h3':
        return <Text key={index} style={styles.h3}>{bloco.texto}</Text>;

      case 'p':
        return <Text key={index} style={styles.p}>{bloco.texto}</Text>;

      case 'bullet':
        return (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{bloco.texto}</Text>
          </View>
        );

      case 'aviso':
        return (
          <View key={index} style={styles.aviso}>
            <Icon name={bloco.icone || 'info'} size={18} color="#8B3FAD" style={styles.avisoIcon} />
            <Text style={styles.avisoText}>{bloco.texto}</Text>
          </View>
        );

      case 'emergencia':
        return (
          <View key={index} style={styles.emergencia}>
            <View style={styles.emergenciaHead}>
              <Icon name="alert-triangle" size={20} color="#C23B3B" />
              <Text style={styles.emergenciaTitulo}>{bloco.titulo}</Text>
            </View>
            <Text style={styles.emergenciaTexto}>{bloco.texto}</Text>
            <View style={styles.emergenciaContatos}>
              {bloco.contatos.map((c) => (
                <TouchableOpacity
                  key={c.numero}
                  style={styles.emergenciaContato}
                  onPress={() => Linking.openURL(`tel:${c.numero}`)}
                >
                  <Text style={styles.emergenciaContatoNome}>{c.nome}</Text>
                  <Text style={styles.emergenciaContatoNumero}>{c.numero}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'compartilhamento':
        return (
          <View key={index} style={styles.compartilhamentoCard}>
            <View style={styles.compartilhamentoHead}>
              <Text style={styles.compartilhamentoServico}>{bloco.servico}</Text>
              <Text style={[
                styles.compartilhamentoLocal,
                bloco.nacional && styles.compartilhamentoLocalNacional,
              ]}>
                {bloco.local}
              </Text>
            </View>
            <Text style={styles.compartilhamentoFinalidade}>{bloco.finalidade}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F8" />

      <View style={styles.headerBlur}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'AmbienteTeste' }] }))} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{doc.titulo}</Text>
          <View style={styles.backButton} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.atualizadoEm}>Última atualização: {doc.atualizadoEm}</Text>
        {doc.blocos.map(renderBloco)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },

  headerBlur: {
    backgroundColor: 'rgba(246, 246, 248, 0.80)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontFamily: 'Manrope', fontWeight: '700', fontSize: 18, color: '#0F172A',
  },

  atualizadoEm: {
    fontFamily: 'Manrope', fontSize: 12, color: '#94A3B8', marginBottom: 20,
  },

  h2: {
    fontFamily: 'Manrope', fontWeight: '700', fontSize: 17, color: '#0F172A',
    marginTop: 24, marginBottom: 10, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  h3: {
    fontFamily: 'Manrope', fontWeight: '700', fontSize: 14.5, color: '#334155',
    marginTop: 14, marginBottom: 4,
  },
  p: {
    fontFamily: 'Manrope', fontSize: 14, lineHeight: 21, color: '#334155',
    marginBottom: 10,
  },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingLeft: 2 },
  bulletDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#B367D4',
    marginTop: 7,
  },
  bulletText: {
    flex: 1, fontFamily: 'Manrope', fontSize: 14, lineHeight: 20, color: '#334155',
  },

  aviso: {
    flexDirection: 'row', gap: 10, backgroundColor: '#F7EFFE',
    borderWidth: 1, borderColor: '#E8D0F5', borderRadius: 12,
    padding: 14, marginVertical: 12,
  },
  avisoIcon: { marginTop: 1 },
  avisoText: {
    flex: 1, fontFamily: 'Manrope', fontSize: 13, lineHeight: 19, color: '#4C1D6E',
  },

  emergencia: {
    backgroundColor: '#FBEAEA', borderWidth: 1, borderColor: '#E8B9B9',
    borderRadius: 14, padding: 16, marginVertical: 16,
  },
  emergenciaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  emergenciaTitulo: {
    flex: 1, fontFamily: 'Manrope', fontWeight: '800', fontSize: 15, color: '#C23B3B',
  },
  emergenciaTexto: {
    fontFamily: 'Manrope', fontSize: 13.5, lineHeight: 19, color: '#5A2020', marginBottom: 12,
  },
  emergenciaContatos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emergenciaContato: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8B9B9',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 100,
  },
  emergenciaContatoNome: { fontFamily: 'Manrope', fontSize: 11, color: '#5A2020', marginBottom: 2 },
  emergenciaContatoNumero: { fontFamily: 'Manrope', fontWeight: '800', fontSize: 16, color: '#C23B3B' },

  compartilhamentoCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  compartilhamentoHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  compartilhamentoServico: { fontFamily: 'Manrope', fontWeight: '700', fontSize: 14, color: '#0F172A' },
  compartilhamentoLocal: {
    fontFamily: 'Manrope', fontSize: 11, color: '#64748B',
    backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  compartilhamentoLocalNacional: { color: '#8B3FAD', backgroundColor: '#F7EFFE' },
  compartilhamentoFinalidade: { fontFamily: 'Manrope', fontSize: 13, lineHeight: 18, color: '#64748B' },
});

export default DocumentoLegal;
