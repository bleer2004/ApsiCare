import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../src/services/api';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [configuracoes, setConfiguracoes] = useState({
    baixaVisao: false,
    daltonismo: false,
  });
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const acessibilidade = user?.configuracoesApp?.acessibilidade || {};
        setConfiguracoes({
          baixaVisao: acessibilidade.baixaVisao || false,
          daltonismo: acessibilidade.daltonismo || false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar com o backend
  const sincronizarComBackend = async () => {
    setSincronizando(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (!token || !userStr) return;

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
          baixaVisao: acessibilidade.baixaVisao || false,
          daltonismo: acessibilidade.daltonismo || false,
        };

        // Atualizar localmente se houver diferença
        if (
          novasConfigs.baixaVisao !== configuracoes.baixaVisao ||
          novasConfigs.daltonismo !== configuracoes.daltonismo
        ) {
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
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar com backend:', error);
    } finally {
      setSincronizando(false);
    }
  };

  const atualizarConfiguracoes = async (novasConfigs) => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Atualizar localmente primeiro (otimista)
        setConfiguracoes(prev => ({ ...prev, ...novasConfigs }));
        
        // Atualizar AsyncStorage
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

        // Tentar sincronizar com backend
        const token = await AsyncStorage.getItem('token');
        if (token) {
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
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      // Reverter em caso de erro
      await carregarConfiguracoes();
    }
  };

  const resetarConfiguracoes = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const resetConfigs = { baixaVisao: false, daltonismo: false };
        
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
      }
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      await carregarConfiguracoes();
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        configuracoes,
        loading,
        sincronizando,
        atualizarConfiguracoes,
        sincronizarComBackend,
        resetarConfiguracoes,
        recarregar: carregarConfiguracoes,
        // Atalhos para uso direto
        toggleBaixaVisao: async () => {
          await atualizarConfiguracoes({ baixaVisao: !configuracoes.baixaVisao });
        },
        toggleDaltonismo: async () => {
          await atualizarConfiguracoes({ daltonismo: !configuracoes.daltonismo });
        },
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