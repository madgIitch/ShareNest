// src/theme/index.ts  
  
/**  
 * Sistema de tema centralizado para ShareNest  
 * Paleta oscura minimalista basada en Material Design 3  
 *   
 * Principios de diseño:  
 * - Fondo #121212 (recomendación oficial de Google)  
 * - Contraste mínimo 4.5:1 (WCAG AA)  
 * - Tonos desaturados para evitar fatiga visual  
 * - Elevación mediante claridad en lugar de sombras duras  
 */  
  
export const colors = {  
  // Colores primarios - Teal desaturado (Material Design Teal 200/700/100)  
  primary: '#00796B',      // Teal 700 - Mejor contraste en oscuro  
  primaryDark: '#004D40',  // Teal 900 - Estados presionados  
  primaryLight: '#80CBC4', // Teal 200 - Acentos sutiles  
     
      
  // Colores de estado semántico  
  success: '#4CAF50',  // Verde 500 - Éxito/confirmación estándar  
  warning: '#FFC107',  // Ámbar 500 - Advertencia (requiere texto negro encima)  
  error: '#CF6679',    // Rojo rosado desaturado - Mensajes de error (WCAG AA)  
  info: '#2196F3',     // Azul 500 - Información general  
      
  // Colores de fondo (elevación mediante claridad)  
  background: '#0D0D0D',     // Más oscuro que #121212  
  backgroundCard: '#1E1E1E', // Mantener, ahora contrasta más  
      
  // Colores de texto (jerarquía tipográfica)  
  textPrimary: '#FFFFFF',    // Blanco puro para máximo contraste  
  textSecondary: '#B0B0B0',  // Mantener para textos secundarios  
  textTertiary: '#808080',   // Más claro que #888888   
  textInverse: '#121212',   // Negro puro - Texto sobre fondos claros  
      
  // Colores de borde (separación discreta)  
  border: '#444444',      // Gris oscuro 26% - Bordes estándar  
  borderLight: '#333333', // Gris casi negro - Separadores sutiles  
      
  // Colores de categorías (Material Design 300-400)  
  categoryBlue: '#42A5F5',   // Azul 400 - Tonalidad viva y fría moderada  
  categoryGreen: '#66BB6A',  // Verde 400 - Verde equilibrado positivo  
  categoryOrange: '#FFA726', // Naranja 400 - Naranja cálido tono medio  
  categoryRed: '#EF5350',    // Rojo 400 - Rojo intenso para urgencia  
  categoryPurple: '#9575CD', // Púrpura 300 - Violeta suavizado  
};  
  
export const typography = {  
  // Familias de fuentes (sans-serif limpias recomendadas para modo oscuro)  
  fontFamily: {  
    regular: 'System',  
    medium: 'System',  
    bold: 'System',  
    // Para fuentes personalizadas (Roboto, Inter):  
    // regular: 'Roboto-Regular',  
    // medium: 'Roboto-Medium',  
    // bold: 'Roboto-Bold',  
  },  
      
  // Tamaños de fuente (escala modular)  
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
      
  // Pesos de fuente (evitar texto muy fino en modo oscuro)  
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
      
  // Estilos de texto predefinidos (jerarquía tipográfica)  
  h1: {  
    fontSize: 28,  
    fontWeight: '700' as const,  
    lineHeight: 1.2,  
    color: colors.textPrimary,  
  },  
  h2: {  
    fontSize: 24,  
    fontWeight: '600' as const,  
    lineHeight: 1.3,  
    color: colors.textPrimary,  
  },  
  h3: {  
    fontSize: 20,  
    fontWeight: '600' as const,  
    lineHeight: 1.4,  
    color: colors.textPrimary,  
  },  
  body: {  
    fontSize: 16,  
    fontWeight: '400' as const,  
    lineHeight: 1.5,  
    color: colors.textPrimary,  
  },  
  caption: {  
    fontSize: 14,  
    fontWeight: '400' as const,  
    lineHeight: 1.4,  
    color: colors.textSecondary,  
  },  
  label: {  
    fontSize: 14,  
    fontWeight: '600' as const,  
    color: colors.textPrimary,  
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
  
/**  
 * Sombras minimalistas para modo oscuro  
 * Nota: En modo oscuro se prefiere elevación mediante claridad  
 * en lugar de sombras proyectadas duras  
 */  
export const shadows = {  
  none: {  
    shadowColor: 'transparent',  
    shadowOffset: { width: 0, height: 0 },  
    shadowOpacity: 0,  
    shadowRadius: 0,  
    elevation: 0,  
  },  
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
    shadowOpacity: 0.08,  
    shadowRadius: 4,  
    elevation: 2,  
  },  
  lg: {  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 4 },  
    shadowOpacity: 0.12,  
    shadowRadius: 8,  
    elevation: 4,  
  },  
};  
  
/**  
 * Estilos comunes reutilizables  
 * Siguen principios de Material Design 3 para modo oscuro  
 */  
export const commonStyles = {  
  // Contenedor principal  
  container: {  
    flex: 1,  
    backgroundColor: colors.background,  
  },  
      
  // Tarjeta elevada (usa claridad + borde sutil en lugar de sombra dura)  
  card: {  
    backgroundColor: colors.backgroundCard,  
    borderRadius: borderRadius.lg,  
    padding: spacing.base,  
    ...shadows.lg,  // Sombra más pronunciada  
    // Agregar borde sutil para mayor definición  
    borderWidth: 1,  
    borderColor: '#2A2A2A',  
  },  
      
  // Input de texto  
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
      
  // Botón primario  
  button: {  
    height: 50,  
    backgroundColor: colors.primary,  // Ahora usa Teal 700  
    borderRadius: borderRadius.base,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
    // Agregar elevación  
    ...shadows.base,  
  },  
      
  // Texto de botón (usa textInverse para contraste sobre primary)  
  buttonText: {  
    color: '#FFFFFF',  // Blanco puro en lugar de textInverse  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
      
  // Título principal  
  title: {  
    ...typography.h1,  
  },  
      
  // Subtítulo  
  subtitle: {  
    ...typography.h2,  
  },  
      
  // Label de formulario  
  label: {  
    ...typography.label,  
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