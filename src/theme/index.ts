// src/theme/index.ts  
  
export const colors = {  
  // Colores primarios  
  primary: '#007AFF',  
  primaryDark: '#0051D5',  
  primaryLight: '#4DA2FF',  
    
  // Colores de estado  
  success: '#34C759',  
  warning: '#FF9500',  
  error: '#FF3B30',  
  info: '#5AC8FA',  
    
  // Colores de fondo  
  background: '#F5F5F5',  
  backgroundCard: '#FFFFFF',  
    
  // Colores de texto  
  textPrimary: '#333333',  
  textSecondary: '#666666',  
  textTertiary: '#999999',  
  textInverse: '#FFFFFF',  
    
  // Colores de borde  
  border: '#DDDDDD',  
  borderLight: '#EEEEEE',  
    
  // Colores de categorías (para tareas)  
  categoryBlue: '#007AFF',  
  categoryGreen: '#34C759',  
  categoryOrange: '#FF9500',  
  categoryRed: '#FF3B30',  
  categoryPurple: '#AF52DE',  
};  
  
export const typography = {  
  // Familias de fuentes  
  fontFamily: {  
    regular: 'System',  
    medium: 'System',  
    bold: 'System',  
    // Si quieres usar fuentes personalizadas:  
    // regular: 'Roboto-Regular',  
    // medium: 'Roboto-Medium',  
    // bold: 'Roboto-Bold',  
  },  
    
  // Tamaños de fuente  
  fontSize: {  
    xs: 12,  
    sm: 14,  
    base: 16,  
    lg: 18,  
    xl: 20,  
    xxl: 24,  
    xxxl: 28,  
    display: 32,  
  },  
    
  // Pesos de fuente  
  fontWeight: {  
    regular: '400' as const,  
    medium: '500' as const,  
    semibold: '600' as const,  
    bold: '700' as const,  
  },  
    
  // Alturas de línea  
  lineHeight: {  
    tight: 1.2,  
    normal: 1.5,  
    relaxed: 1.75,  
  },  
};  
  
export const spacing = {  
  xs: 4,  
  sm: 8,  
  md: 12,  
  base: 16,  
  lg: 20,  
  xl: 24,  
  xxl: 32,  
  xxxl: 40,  
};  
  
export const borderRadius = {  
  sm: 4,  
  base: 8,  
  lg: 12,  
  xl: 16,  
  full: 9999,  
};  
  
export const shadows = {  
  sm: {  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.05,  
    shadowRadius: 2,  
    elevation: 1,  
  },  
  base: {  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  lg: {  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 4 },  
    shadowOpacity: 0.15,  
    shadowRadius: 8,  
    elevation: 5,  
  },  
};  
  
// Estilos comunes reutilizables  
export const commonStyles = {  
  container: {  
    flex: 1,  
    backgroundColor: colors.background,  
  },  
    
  card: {  
    backgroundColor: colors.backgroundCard,  
    borderRadius: borderRadius.lg,  
    padding: spacing.base,  
    ...shadows.base,  
  },  
    
  input: {  
    height: 50,  
    borderWidth: 1,  
    borderColor: colors.border,  
    borderRadius: borderRadius.base,  
    paddingHorizontal: spacing.base,  
    fontSize: typography.fontSize.base,  
    backgroundColor: colors.backgroundCard,  
    color: colors.textPrimary,  
  },  
    
  button: {  
    height: 50,  
    backgroundColor: colors.primary,  
    borderRadius: borderRadius.base,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
  },  
    
  buttonText: {  
    color: colors.textInverse,  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
    
  title: {  
    fontSize: typography.fontSize.xxxl,  
    fontWeight: typography.fontWeight.bold,  
    color: colors.textPrimary,  
  },  
    
  subtitle: {  
    fontSize: typography.fontSize.lg,  
    color: colors.textSecondary,  
  },  
    
  label: {  
    fontSize: typography.fontSize.sm,  
    fontWeight: typography.fontWeight.semibold,  
    color: colors.textPrimary,  
    marginBottom: spacing.sm,  
  },  
};  
  
export default {  
  colors,  
  typography,  
  spacing,  
  borderRadius,  
  shadows,  
  commonStyles,  
};