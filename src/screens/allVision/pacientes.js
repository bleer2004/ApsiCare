import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const Pacientes = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos'); // todos, ativos, recentes

  //dados mockados do paciente 
  const pacientesData = [
    {
      id: '1',
      nome: 'Ana Clara Silva',
      ultimaSessao: 'Ontem, 14:00',
      status: 'ativo',
      ultimoAcesso: new Date('2024-01-15'),
      avatar: null,
    },
    {
      id: '2',
      nome: 'Marcos Oliveira',
      ultimaSessao: '12 Out, 10:30',
      status: 'ativo',
      ultimoAcesso: new Date('2024-01-12'),
      avatar: null,
    },
    {
      id: '3',
      nome: 'Beatriz Santos',
      ultimaSessao: '10 Out, 16:15',
      status: 'inativo',
      ultimoAcesso: new Date('2024-01-10'),
      avatar: null,
    },
    {
      id: '4',
      nome: 'Ricardo Pereira',
      ultimaSessao: '08 Out, 09:00',
      status: 'ativo',
      ultimoAcesso: new Date('2024-01-08'),
      avatar: null,
    },
    {
      id: '5',
      nome: 'Juliana Farias',
      ultimaSessao: '05 Out, 11:30',
      status: 'inativo',
      ultimoAcesso: new Date('2024-01-05'),
      avatar: null,
    },
    {
      id: '6',
      nome: 'Fernanda Costa',
      ultimaSessao: '03 Out, 15:45',
      status: 'ativo',
      ultimoAcesso: new Date('2024-01-03'),
      avatar: null,
    },
    {
      id: '7',
      nome: 'Gustavo Lima',
      ultimaSessao: '30 Set, 09:30',
      status: 'recente',
      ultimoAcesso: new Date('2024-01-15'),
      avatar: null,
    },
  ];

  const totalPacientes = pacientesData.length;
  const novosPacientes = pacientesData.filter(p => p.status === 'recente').length;

  const getFilteredPacientes = () => {
    let filtered = pacientesData;
    
    if (searchText) {
      filtered = filtered.filter(paciente =>
        paciente.nome.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (activeFilter === 'ativos') {
      filtered = filtered.filter(paciente => paciente.status === 'ativo');
    } else if (activeFilter === 'recentes') {
      filtered = filtered.filter(paciente => paciente.status === 'recente');
    }
    
    return filtered;
  };

  const handlePacientePress = (paciente) => {
    console.log('Abrir paciente:', paciente.nome);
    // Navegar para detalhes do paciente
    // navigation.navigate('DetalhesPaciente', { paciente });
  };

  const formatarDataSessao = (data) => {
    return data;
  };

  const renderPacienteCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.pacienteCard}
      onPress={() => handlePacientePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.pacienteAvatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.nome.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.pacienteInfo}>
        <Text style={styles.pacienteNome}>{item.nome}</Text>
        <View style={styles.sessaoContainer}>
          <Icon name="calendar" size={14} color="#9CA3AF" />
          <Text style={styles.pacienteUltimaSessao}>
            Última sessão: {formatarDataSessao(item.ultimaSessao)}
          </Text>
        </View>
      </View>
      
      <Icon name="chevron-right" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="users" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>Nenhum paciente encontrado</Text>
      <Text style={styles.emptyStateText}>
        {searchText ? 'Tente buscar por outro nome' : 'Adicione seus primeiros pacientes'}
      </Text>
    </View>
  );

  const filteredPacientes = getFilteredPacientes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Pacientes</Text>
          <View style={styles.totalContainer}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalNumber}>{totalPacientes}</Text>
              <Text style={styles.totalLabel}>Total de Pacientes</Text>
            </View>
            <View style={styles.novoBadge}>
              <Icon name="plus-circle" size={14} color="#10B981" />
              <Text style={styles.novoTexto}>+{novosPacientes} este mês</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'todos' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('todos')}
          >
            <Text style={[styles.filterText, activeFilter === 'todos' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'ativos' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('ativos')}
          >
            <Text style={[styles.filterText, activeFilter === 'ativos' && styles.filterTextActive]}>
              Ativos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'recentes' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('recentes')}
          >
            <Text style={[styles.filterText, activeFilter === 'recentes' && styles.filterTextActive]}>
              Recentes
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredPacientes}
          keyExtractor={(item) => item.id}
          renderItem={renderPacienteCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pacientesList}
          ListEmptyComponent={renderEmptyState}
        />
      </View>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('VisaoGeral')}
        >
          <Icon name="home" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => navigation.navigate('Pacientes')}
        >
          <Icon name="users" size={24} color="#6366F1" />
          <Text style={[styles.navText, styles.navTextActive]}>Pacientes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Relatorios')}
        >
          <Icon name="bar-chart-2" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Relatórios</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.fabButton}>
        <Icon name="user-plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  totalInfo: {
    flex: 1,
  },
  totalNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  novoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  novoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  pacientesList: {
    paddingBottom: 20,
    gap: 12,
  },
  pacienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pacienteAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  pacienteInfo: {
    flex: 1,
  },
  pacienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  sessaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pacienteUltimaSessao: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  navTextActive: {
    color: '#6366F1',
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default Pacientes;