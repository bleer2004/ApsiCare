import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';

const AccessibilityContext = createContext();

// Configurações padrão
const CONFIGURACOES_PADRAO = {
  baixaVisao: false,
  daltonismo: false,
};

export const AccessibilityProvider = ({ children }) => {
  const [configuracoes, setConfiguracoes] = useState(CONFIGURACOES_PADRAO);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimoErro, setUltimoErro] = useState(null);

  // ==========================================================
  // CARREGAMENTO INICIAL
  // ==========================================================
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  /**
   * Carrega as configurações do AsyncStorage
   */
  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      setUltimoErro(null);
      
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const acessibilidade = user?.configuracoesApp?.acessibilidade || {};
        
        setConfiguracoes({
          baixaVisao: Boolean(acessibilidade.baixaVisao),
          daltonismo: Boolean(acessibilidade.daltonismo),
        });
      } else {
        // Se não tem usuário, mantém padrão
        setConfiguracoes(CONFIGURACOES_PADRAO);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setUltimoErro(error.message);
      // Em caso de erro, mantém configurações padrão
      setConfiguracoes(CONFIGURACOES_PADRAO);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SINCRONIZAÇÃO COM BACKEND
  // ==========================================================
  
  /**
   * Busca configurações do backend e mescla com local
   */
  const sincronizarComBackend = async () => {
    setSincronizando(true);
    setUltimoErro(null);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (!token || !userStr) {
        console.warn('Sincronização ignorada: token ou usuário não encontrados');
        return { success: false, reason: 'not_authenticated' };
      }

      const user = JSON.parse(userStr);
      const response = await fetch(`${API_URL}/patients/${user.id}/configuracoes`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const acessibilidade = data?.configuracoesApp?.acessibilidade || {};
        
        const novasConfigs = {
          baixaVisao: Boolean(acessibilidade.baixaVisao),
          daltonismo: Boolean(acessibilidade.daltonismo),
        };

        setConfiguracoes(novasConfigs);

        // Atualizar AsyncStorage
        const updatedUser = {
          ...user,
          configuracoesApp: {
            ...user.configuracoesApp,
            acessibilidade: novasConfigs,
          },
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true, data: novasConfigs };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com backend:', error);
      setUltimoErro(error.message);
      return { success: false, error: error.message };
    } finally {
      setSincronizando(false);
    }
  };

  // ==========================================================
  // ATUALIZAÇÃO DE CONFIGURAÇÕES
  // ==========================================================
  
  /**
   * Atualiza configurações (otimista - local primeiro, depois backend)
   */
  const atualizarConfiguracoes = async (novasConfigs) => {
    try {
      setUltimoErro(null);
      
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        console.warn('Nenhum usuário logado para atualizar configurações');
        return { success: false, reason: 'no_user' };
      }
      
      const user = JSON.parse(userStr);
      
      // 1. Atualizar localmente primeiro (otimista)
      const configsAnteriores = { ...configuracoes };
      setConfiguracoes(prev => ({ ...prev, ...novasConfigs }));
      
      // 2. Atualizar AsyncStorage
      const updatedUser = {
        ...user,
        configuracoesApp: {
          ...user.configuracoesApp,
          acessibilidade: {
            ...user.configuracoesApp?.acessibilidade,
            ...novasConfigs,
          },
        },
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      // 3. Tentar sincronizar com backend
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${API_URL}/patients/${user.id}/configuracoes`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              configuracoesApp: updatedUser.configuracoesApp,
            }),
          });

          if (!response.ok) {
            console.warn('Erro ao sincronizar com backend, mas dados mantidos localmente');
            return { success: true, synced: false, reason: 'backend_error' };
          }
          
          return { success: true, synced: true };
        } catch (syncError) {
          console.warn('Erro de rede ao sincronizar:', syncError.message);
          return { success: true, synced: false, reason: 'network_error' };
        }
      } else {
        return { success: true, synced: false, reason: 'no_token' };
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      setUltimoErro(error.message);
      
      // Reverter em caso de erro
      await carregarConfiguracoes();
      return { success: false, error: error.message };
    }
  };

  // ==========================================================
  // RESET E LIMPEZA
  // ==========================================================
  
  /**
   * Limpa apenas as configurações locais (sem backend)
   */
  const limparConfiguracoesLocais = useCallback(() => {
    setConfiguracoes({ ...CONFIGURACOES_PADRAO });
    setUltimoErro(null);
  }, []);

  /**
   * Reseta configurações (local + backend)
   */
  const resetarConfiguracoes = async () => {
    try {
      setUltimoErro(null);
      
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const resetConfigs = { ...CONFIGURACOES_PADRAO };
        
        setConfiguracoes(resetConfigs);
        
        const updatedUser = {
          ...user,
          configuracoesApp: {
            ...user.configuracoesApp,
            acessibilidade: resetConfigs,
          },
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        // Sincronizar com backend
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await fetch(`${API_URL}/patients/${user.id}/configuracoes`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              configuracoesApp: updatedUser.configuracoesApp,
            }),
          });
        }
        
        return { success: true };
      }
      return { success: false, reason: 'no_user' };
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      setUltimoErro(error.message);
      await carregarConfiguracoes();
      return { success: false, error: error.message };
    }
  };

  // ==========================================================
  // TOGGLES (ATALHOS)
  // ==========================================================
  
  const toggleBaixaVisao = async () => {
    return await atualizarConfiguracoes({ baixaVisao: !configuracoes.baixaVisao });
  };

  const toggleDaltonismo = async () => {
    return await atualizarConfiguracoes({ daltonismo: !configuracoes.daltonismo });
  };

  const setBaixaVisao = async (valor) => {
    return await atualizarConfiguracoes({ baixaVisao: Boolean(valor) });
  };

  const setDaltonismo = async (valor) => {
    return await atualizarConfiguracoes({ daltonismo: Boolean(valor) });
  };

  // ==========================================================
  // UTILITÁRIOS
  // ==========================================================
  
  /**
   * Verifica se algum modo de acessibilidade está ativo
   */
  const modoAcessivelAtivo = configuracoes.baixaVisao || configuracoes.daltonismo;

  /**
   * Retorna quantas configurações estão ativas
   */
  const totalConfiguracoesAtivas = 
    (configuracoes.baixaVisao ? 1 : 0) + 
    (configuracoes.daltonismo ? 1 : 0);

  // ==========================================================
  // PROVIDER
  // ==========================================================
  return (
    <AccessibilityContext.Provider
      value={{
        // Estado
        configuracoes,
        loading,
        sincronizando,
        ultimoErro,
        modoAcessivelAtivo,
        totalConfiguracoesAtivas,
        
        // Funções principais
        atualizarConfiguracoes,
        sincronizarComBackend,
        resetarConfiguracoes,
        limparConfiguracoesLocais,
        recarregar: carregarConfiguracoes,
        
        // Toggles
        toggleBaixaVisao,
        toggleDaltonismo,
        setBaixaVisao,
        setDaltonismo,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;