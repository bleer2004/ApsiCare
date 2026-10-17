import { useAccessibility } from '../contexts/AccessibilityContext';

// ============================================================
// MAPEAMENTO DE CORES PARA DALTONISMO
// ============================================================
const daltonismoCores = {
  // Roxos
  '#B367D4': '#6C8EBF',
  '#B366D4': '#6C8EBF',
  '#8B5CF6': '#6C8EBF',
  '#7C3AED': '#5A7BAE',
  '#6D28D9': '#4A6A9E',
  '#A855F7': '#6C8EBF',
  '#9333EA': '#5A7BAE',
  '#B367D4': '#6C8EBF',
  
  // Vermelhos
  '#EF4444': '#FF8C00',
  '#DC2626': '#E07B00',
  '#F87171': '#FFA54B',
  '#B91C1C': '#CC6B00',
  '#FCA5A5': '#FFB86B',
  
  // Verdes
  '#22C55E': '#1E90FF',
  '#10B981': '#1E90FF',
  '#34D399': '#4AA3E8',
  '#059669': '#1A7BC8',
  '#16A34A': '#1E90FF',
  '#15803D': '#1A7BC8',
  '#86EFAC': '#4AA3E8',
  
  // Amarelos/Laranjas
  '#F59E0B': '#FFB347',
  '#FBBF24': '#FFC966',
  '#D97706': '#E09900',
  '#FCD34D': '#FFD97D',
  
  // Azuis
  '#3B82F6': '#4A90D9',
  '#2563EB': '#3A7BC8',
  '#60A5FA': '#6AA3E0',
  '#1D4ED8': '#2A6BB8',
  '#93C5FD': '#7AB3E8',
  
  // Outros
  '#6366F1': '#6C8EBF',
  '#EC4899': '#FF6B9D',
  '#F43F5E': '#FF6B6B',
  '#14B8A6': '#4AA3E8',
  '#D946EF': '#C96BBF',
  '#F472B6': '#FF8BAD',
  '#64748B': '#6C8EBF',
  '#94A3B8': '#8C8C8C',
  '#CBD5E1': '#B0B0B0',
};

// ============================================================
// CONFIGURAÇÕES PARA BAIXA VISÃO
// ============================================================
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

// ============================================================
// TAMANHOS PADRÃO
// ============================================================
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

// ============================================================
// HOOK PRINCIPAL
// ============================================================
export const useAccessibilityStyles = () => {
  const { configuracoes } = useAccessibility();
  const { baixaVisao = false, daltonismo = false } = configuracoes || {};

  // ==========================================================
  // FUNÇÕES AUXILIARES
  // ==========================================================
  
  /**
   * Adapta uma cor para daltonismo
   */
  const adaptarCor = (cor) => {
    if (!daltonismo || !cor) return cor;
    if (typeof cor !== 'string') return cor;
    
    // Verificar se é uma cor com alpha (rgba)
    if (cor.startsWith('rgba')) {
      const match = cor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const [, r, g, b, a] = match;
        const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`.toUpperCase();
        if (daltonismoCores[hex]) {
          const novaCor = daltonismoCores[hex];
          return `rgba(${parseInt(novaCor.slice(1, 3), 16)}, ${parseInt(novaCor.slice(3, 5), 16)}, ${parseInt(novaCor.slice(5, 7), 16)}, ${a})`;
        }
      }
      return cor;
    }
    
    // Cor hexadecimal
    const corUpper = cor.toUpperCase();
    return daltonismoCores[corUpper] || daltonismoCores[cor] || cor;
  };

  /**
   * Obtém o tamanho de fonte
   */
  const getFontSize = (tamanho = 'medium') => {
    const config = baixaVisao ? baixaVisaoConfig : padraoConfig;
    return config.fontSize[tamanho] || config.fontSize.medium;
  };

  /**
   * Obtém o espaçamento
   */
  const getSpacing = (tamanho = 'medium') => {
    const config = baixaVisao ? baixaVisaoConfig : padraoConfig;
    return config.spacing[tamanho] || config.spacing.medium;
  };

  /**
   * Obtém o tamanho de ícone
   */
  const getIconSize = (tamanho = 'medium') => {
    const config = baixaVisao ? baixaVisaoConfig : padraoConfig;
    return config.iconSize[tamanho] || config.iconSize.medium;
  };

  // ==========================================================
  // PALETA DE CORES
  // ==========================================================
  
  /**
   * Retorna a paleta de cores baseada nas configurações
   */
  const getColors = () => ({
    // Fundos
    background: baixaVisao ? '#000000' : '#F6F6F8',
    cardBackground: baixaVisao ? '#1A1A1A' : '#FFFFFF',
    inputBackground: baixaVisao ? '#1A1A1A' : '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Textos
    text: baixaVisao ? '#FFFFFF' : '#0F172A',
    textSecondary: baixaVisao ? '#AAAAAA' : '#64748B',
    textMuted: baixaVisao ? '#666666' : '#94A3B8',
    textInverse: baixaVisao ? '#000000' : '#FFFFFF',
    
    // Bordas
    border: baixaVisao ? '#444444' : '#E2E8F0',
    borderLight: baixaVisao ? '#333333' : '#F1F5F9',
    
    // Cores principais
    primary: baixaVisao ? '#FFFFFF' : adaptarCor('#B367D4'),
    primaryLight: baixaVisao ? 'rgba(255,255,255,0.15)' : 'rgba(179,103,212,0.05)',
    primaryDark: baixaVisao ? '#CCCCCC' : adaptarCor('#8B5CF6'),
    
    // Status
    success: adaptarCor('#10B981'),
    successLight: baixaVisao ? 'rgba(30,144,255,0.15)' : 'rgba(16,185,129,0.10)',
    warning: adaptarCor('#F59E0B'),
    warningLight: baixaVisao ? 'rgba(255,179,71,0.15)' : 'rgba(245,158,11,0.10)',
    danger: adaptarCor('#EF4444'),
    dangerLight: baixaVisao ? 'rgba(255,140,0,0.15)' : 'rgba(239,68,68,0.10)',
    info: adaptarCor('#3B82F6'),
    infoLight: baixaVisao ? 'rgba(74,144,217,0.15)' : 'rgba(59,130,246,0.10)',
    
    // Utilitários
    placeholder: baixaVisao ? '#666666' : '#94A3B8',
    shadow: baixaVisao ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    disabled: baixaVisao ? '#444444' : '#CBD5E1',
    
    // Específicas do app
    moodFeliz: baixaVisao ? '#1A1A1A' : adaptarCor('#E3F2FD'),
    moodCalmo: baixaVisao ? '#1A1A1A' : adaptarCor('#E0F2F1'),
    moodAnsioso: baixaVisao ? '#1A1A1A' : adaptarCor('#F3E5F5'),
    moodTriste: baixaVisao ? '#1A1A1A' : adaptarCor('#FCE4EC'),
    moodNeutro: baixaVisao ? '#1A1A1A' : adaptarCor('#F1F5F9'),
    
    // Sonhos (tema noturno)
    dreamBackground: baixaVisao ? '#0A0A1A' : '#1E1B4B',
    dreamText: '#FFFFFF',
    dreamAccent: adaptarCor('#3B82F6'),
  });

  // ==========================================================
  // ESTILOS PRONTOS
  // ==========================================================

  /**
   * Estilo para textos
   */
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

  /**
   * Estilo para inputs
   */
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

  /**
   * Estilo para botões
   */
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

  /**
   * Estilo para cards
   */
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

  /**
   * Estilo para containers
   */
  const getContainerStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      backgroundColor: colors.background,
      flex: 1,
      ...customStyles,
    };
  };

  /**
   * Estilo para headers
   */
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

  /**
   * Estilo para modais
   */
  const getModalStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: baixaVisao ? 28 : 24,
      borderTopRightRadius: baixaVisao ? 28 : 24,
      maxHeight: '85%',
      ...customStyles,
    };
  };

  /**
   * Estilo para tabs/bottom navigation
   */
  const getTabBarStyle = (customStyles = {}) => {
    const colors = getColors();
    return {
      backgroundColor: baixaVisao ? colors.cardBackground : '#FFFFFF',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      paddingVertical: baixaVisao ? 16 : 12,
      paddingHorizontal: getSpacing('large'),
      flexDirection: 'row',
      justifyContent: 'space-between',
      ...customStyles,
    };
  };

  /**
   * Estilo para badges
   */
  const getBadgeStyle = (tipo = 'primary', customStyles = {}) => {
    const colors = getColors();
    const badgeColors = {
      primary: colors.primary,
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
      info: colors.info,
    };
    return {
      backgroundColor: badgeColors[tipo] || colors.primary,
      paddingHorizontal: getSpacing('small'),
      paddingVertical: 2,
      borderRadius: 10,
      ...customStyles,
    };
  };

  // ==========================================================
  // UTILITÁRIOS
  // ==========================================================

  /**
   * Retorna props para ícones
   */
  const getIconProps = (nome, tamanho = 'medium', cor = null) => {
    const colors = getColors();
    return {
      name: nome,
      size: getIconSize(tamanho),
      color: cor ? adaptarCor(cor) : colors.textSecondary,
    };
  };

  /**
   * Retorna estilo da StatusBar
   */
  const getStatusBarStyle = () => ({
    barStyle: baixaVisao ? 'light-content' : 'dark-content',
    backgroundColor: baixaVisao ? '#000000' : '#F6F6F8',
  });

  /**
   * Verifica se está em modo de acessibilidade
   */
  const isModoAcessivel = baixaVisao || daltonismo;

  /**
   * Retorna estilo de sombra padronizado
   */
  const getShadowStyle = (nivel = 'small') => {
    const colors = getColors();
    const shadows = {
      small: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      medium: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      large: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      },
    };
    return shadows[nivel] || shadows.small;
  };

  /**
   * Retorna estilo de espaçamento vertical
   */
  const getVerticalSpacing = (tamanho = 'medium') => ({
    marginVertical: getSpacing(tamanho),
  });

  /**
   * Retorna estilo de espaçamento horizontal
   */
  const getHorizontalSpacing = (tamanho = 'medium') => ({
    marginHorizontal: getSpacing(tamanho),
  });

  /**
   * Aplica adaptação de cor em um array de estilos
   */
  const adaptarEstilos = (estilos) => {
    if (!daltonismo) return estilos;
    if (Array.isArray(estilos)) {
      return estilos.map(e => adaptarEstilos(e));
    }
    if (typeof estilos !== 'object' || estilos === null) return estilos;
    
    const novoEstilo = {};
    for (const key in estilos) {
      if (key === 'color' || key === 'backgroundColor' || key === 'borderColor') {
        novoEstilo[key] = adaptarCor(estilos[key]);
      } else {
        novoEstilo[key] = estilos[key];
      }
    }
    return novoEstilo;
  };

  // ==========================================================
  // RETORNO DO HOOK
  // ==========================================================
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
    getModalStyle,
    getTabBarStyle,
    getBadgeStyle,
    
    // Utilitários
    getIconProps,
    getStatusBarStyle,
    getShadowStyle,
    getVerticalSpacing,
    getHorizontalSpacing,
    adaptarEstilos,
  };
};

export default useAccessibilityStyles;