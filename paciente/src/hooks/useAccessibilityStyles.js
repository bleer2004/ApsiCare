import { useAccessibility } from '../contexts/AccessibilityContext';

// Mapeamento de cores para daltonismo
const daltonismoCores = {
  // Roxos
  '#B367D4': '#6C8EBF',
  '#B366D4': '#6C8EBF',
  '#8B5CF6': '#6C8EBF',
  '#7C3AED': '#5A7BAE',
  '#6D28D9': '#4A6A9E',
  '#A855F7': '#6C8EBF',
  '#9333EA': '#5A7BAE',
  
  // Vermelhos
  '#EF4444': '#FF8C00',
  '#DC2626': '#E07B00',
  '#F87171': '#FFA54B',
  '#B91C1C': '#CC6B00',
  
  // Verdes
  '#22C55E': '#1E90FF',
  '#10B981': '#1E90FF',
  '#34D399': '#4AA3E8',
  '#059669': '#1A7BC8',
  '#16A34A': '#1E90FF',
  '#15803D': '#1A7BC8',
  
  // Amarelos/Laranjas
  '#F59E0B': '#FFB347',
  '#FBBF24': '#FFC966',
  '#D97706': '#E09900',
  
  // Azuis
  '#3B82F6': '#4A90D9',
  '#2563EB': '#3A7BC8',
  '#60A5FA': '#6AA3E0',
  '#1D4ED8': '#2A6BB8',
  
  // Outros
  '#6366F1': '#6C8EBF',
  '#EC4899': '#FF6B9D',
  '#F43F5E': '#FF6B6B',
  '#14B8A6': '#4AA3E8',
  '#8B5CF6': '#6C8EBF',
  '#D946EF': '#C96BBF',
  '#F472B6': '#FF8BAD',
};

// Configurações para baixa visão
const baixaVisaoConfig = {
  fontSize: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 28,
    xxlarge: 32,
    xxxlarge: 36,
  },
  spacing: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    xxlarge: 24,
    xxxlarge: 28,
  },
  iconSize: {
    small: 24,
    medium: 28,
    large: 32,
    xlarge: 36,
    xxlarge: 40,
    xxxlarge: 44,
  },
};

// Tamanhos padrão
const padraoConfig = {
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 20,
    xxxlarge: 22,
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    xxlarge: 20,
    xxxlarge: 24,
  },
  iconSize: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 28,
    xxlarge: 32,
    xxxlarge: 36,
  },
};

export const useAccessibilityStyles = () => {
  const { configuracoes } = useAccessibility();
  const { baixaVisao, daltonismo } = configuracoes;

  const adaptarCor = (cor) => {
    if (!daltonismo || !cor) return cor;
    return daltonismoCores[cor] || cor;
  };

  const getFontSize = (tamanho = 'medium') => {
    const config = baixaVisao ? baixaVisaoConfig : padraoConfig;
    return config.fontSize[tamanho] || config.fontSize.medium;
  };

  const getSpacing = (tamanho = 'medium') => {
    const config = baixaVisao ? baixaVisaoConfig : padraoConfig;
    return config.spacing[tamanho] || config.spacing.medium;
  };

  const getIconSize = (tamanho = 'medium') => {
    const config = baixaVisao ? baixaVisaoConfig : padraoConfig;
    return config.iconSize[tamanho] || config.iconSize.medium;
  };

  // Estilos base para cores
  const getColors = () => ({
    background: baixaVisao ? '#000000' : '#F6F6F8',
    cardBackground: baixaVisao ? '#1A1A1A' : '#FFFFFF',
    text: baixaVisao ? '#FFFFFF' : '#0F172A',
    textSecondary: baixaVisao ? '#AAAAAA' : '#64748B',
    textMuted: baixaVisao ? '#666666' : '#94A3B8',
    border: baixaVisao ? '#444444' : '#E2E8F0',
    inputBackground: baixaVisao ? '#1A1A1A' : '#FFFFFF',
    primary: baixaVisao ? '#FFFFFF' : adaptarCor('#B367D4'),
    primaryLight: baixaVisao ? 'rgba(255,255,255,0.15)' : 'rgba(179,103,212,0.05)',
    success: adaptarCor('#10B981'),
    warning: adaptarCor('#F59E0B'),
    danger: adaptarCor('#EF4444'),
    // Cores adicionais
    placeholder: baixaVisao ? '#666666' : '#94A3B8',
    shadow: baixaVisao ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  });

  // Estilos para textos
  const getTextStyle = (tamanho = 'medium', cor = null, peso = '400') => {
    const colors = getColors();
    const fontSize = getFontSize(tamanho);
    return {
      fontSize,
      color: cor ? adaptarCor(cor) : colors.text,
      fontWeight: baixaVisao ? '700' : peso,
      lineHeight: baixaVisao ? fontSize * 1.6 : undefined,
      fontFamily: baixaVisao ? 'Manrope-Bold' : 'Manrope',
    };
  };

  // Estilos para inputs
  const getInputStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      height: baixaVisao ? 64 : 56,
      fontSize: getFontSize('medium'),
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: getSpacing('medium'),
      paddingVertical: baixaVisao ? 16 : 12,
      borderRadius: baixaVisao ? 16 : 12,
      borderWidth: 1,
      ...customStyles,
    };
  };

  // Estilos para botões
  const getButtonStyle = (cor = null, customStyles = {}) => {
    const colors = getColors();
    return {
      height: baixaVisao ? 64 : 56,
      backgroundColor: cor ? adaptarCor(cor) : colors.primary,
      borderRadius: baixaVisao ? 16 : 12,
      paddingHorizontal: getSpacing('large'),
      paddingVertical: baixaVisao ? 16 : 12,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: baixaVisao ? 120 : 80,
      ...customStyles,
    };
  };

  // Estilos para cards
  const getCardStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      backgroundColor: colors.cardBackground,
      borderRadius: baixaVisao ? 16 : 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: getSpacing('medium'),
      marginBottom: getSpacing('medium'),
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      ...customStyles,
    };
  };

  // Estilos para containers
  const getContainerStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      backgroundColor: colors.background,
      flex: 1,
      ...customStyles,
    };
  };

  // Estilos para headers
  const getHeaderStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      backgroundColor: baixaVisao ? colors.background : 'rgba(246, 246, 248, 0.80)',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      paddingHorizontal: getSpacing('medium'),
      paddingVertical: getSpacing('medium'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...customStyles,
    };
  };

  // Função para obter ícones com props
  const getIconProps = (nome, tamanho = 'medium', cor = null) => {
    const colors = getColors();
    return {
      name: nome,
      size: getIconSize(tamanho),
      color: cor ? adaptarCor(cor) : colors.textSecondary,
    };
  };

  // Função para estilos de StatusBar
  const getStatusBarStyle = () => ({
    barStyle: baixaVisao ? 'light-content' : 'dark-content',
    backgroundColor: baixaVisao ? '#000000' : '#F6F6F8',
  });

  // Verifica se está em modo de acessibilidade
  const isModoAcessivel = baixaVisao || daltonismo;

  return {
    // Configurações
    baixaVisao,
    daltonismo,
    isModoAcessivel,
    
    // Funções principais
    adaptarCor,
    getFontSize,
    getSpacing,
    getIconSize,
    getColors,
    
    // Estilos prontos
    getTextStyle,
    getInputStyle,
    getButtonStyle,
    getCardStyle,
    getContainerStyle,
    getHeaderStyle,
    getIconProps,
    getStatusBarStyle,
    
    // Utilitários
    getIconProps,
  };
};