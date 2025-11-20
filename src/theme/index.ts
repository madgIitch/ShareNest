// src/theme/index.ts    
    
export const colors = {    
  // Colores primarios - Teal desaturado  
  primary: '#80CBC4',      // Teal 200 - Acento principal neutro y suave  
  primaryDark: '#00796B',  // Teal 700 - Variante oscura para estados activos  
  primaryLight: '#B2DFDB', // Teal 100 - Variante clara para hover/selecciones  
      
  // Colores de estado    
  success: '#4CAF50',      // Verde 500 - Éxito/confirmación estándar  
  warning: '#FFC107',      // Ámbar 500 - Advertencia brillante  
  error: '#CF6679',        // Rojo rosado desaturado - Mensajes de error  
  info: '#2196F3',         // Azul 500 - Información general  
      
  // Colores de fondo    
  background: '#121212',     // Gris carbón - Fondo principal muy oscuro  
  backgroundCard: '#1E1E1E', // Gris oscuro - Superficies elevadas (+8% luminosidad)  
      
  // Colores de texto    
  textPrimary: '#E0E0E0',   // Gris claro 87% - Texto principal sin deslumbrar  
  textSecondary: '#B0B0B0', // Gris 70% - Texto secundario menos prominente  
  textTertiary: '#888888',  // Gris 53% - Texto terciario/hint/disabled  
  textInverse: '#121212',   // Negro puro - Texto sobre fondos claros  
      
  // Colores de borde    
  border: '#444444',      // Gris oscuro 26% - Bordes estándar  
  borderLight: '#333333', // Gris casi negro - Separadores sutiles  
      
  // Colores de categorías (para tareas)    
  categoryBlue: '#42A5F5',   // Azul 400 - Tonalidad viva y fría moderada  
  categoryGreen: '#66BB6A',  // Verde 400 - Verde equilibrado positivo  
  categoryOrange: '#FFA726', // Naranja 400 - Naranja cálido tono medio  
  categoryRed: '#EF5350',    // Rojo 400 - Rojo intenso para urgencia  
  categoryPurple: '#9575CD', // Púrpura 300 - Violeta suavizado  
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