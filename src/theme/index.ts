// src/theme/index.ts  
  
/**  
 * Sistema de tema centralizado para ShareNest  
 * Paleta clara con glassmorphism basada en gradientes vibrantes  
 *   
 * Principios de diseño:  
 * - Gradiente turquesa (#52D5E6) a verde lima (#B0EE87)  
 * - Efecto glassmorphism con transparencias y blur  
 * - Contraste mínimo 4.5:1 (WCAG AA)  
 * - Elevación mediante transparencias y sombras suaves  
 */  
  
export const colors = {  
  // Colores de gradiente principal  
  gradientStart: '#52D5E6',    // Turquesa brillante - Inicio del gradiente  
  gradientEnd: '#B0EE87',      // Verde lima - Final del gradiente  
    
  // Colores primarios derivados del gradiente  
  primary: '#52D5E6',          // Turquesa - Color principal de marca  
  primaryDark: '#3BAFC4',      // Turquesa oscuro - Estados presionados  
  primaryLight: '#7FE0ED',     // Turquesa claro - Acentos sutiles  
    
  // Colores secundarios (verde lima)  
  secondary: '#B0EE87',        // Verde lima - Color secundario  
  secondaryDark: '#8FD96A',    // Verde lima oscuro - Estados presionados  
  secondaryLight: '#C8F5A3',   // Verde lima claro - Acentos  
    
  // Colores de estado semántico (ajustados para fondo claro)  
  success: '#4CAF50',          // Verde 500 - Éxito/confirmación  
  warning: '#FF9800',          // Naranja 500 - Advertencia  
  error: '#F44336',            // Rojo 500 - Mensajes de error  
  info: '#2196F3',             // Azul 500 - Información general  
    
  // Colores de fondo (glassmorphism)  
  background: 'transparent',                    // Fondo transparente para gradiente  
  backgroundGlass: 'rgba(255, 255, 255, 0.1)', // Fondo glass principal  
  backgroundGlassLight: 'rgba(255, 255, 255, 0.15)', // Glass más opaco  
  backgroundGlassDark: 'rgba(255, 255, 255, 0.05)',  // Glass más transparente  
  backgroundCard: 'rgba(255, 255, 255, 0.2)',   // Tarjetas con más opacidad  
  backgroundOverlay: 'rgba(0, 0, 0, 0.3)',      // Overlay oscuro  
    
  // Colores de texto (jerarquía para fondos claros/gradientes)  
  textPrimary: '#1A1A1A',      // Negro casi puro - Texto principal  
  textSecondary: '#4A4A4A',    // Gris oscuro - Texto secundario  
  textTertiary: '#6A6A6A',     // Gris medio - Texto terciario  
  textInverse: '#FFFFFF',      // Blanco - Texto sobre fondos oscuros  
  textOnGradient: '#FFFFFF',   // Blanco - Texto sobre gradiente  
    
  // Colores de borde (glassmorphism)  
  border: 'rgba(255, 255, 255, 0.3)',      // Borde glass estándar  
  borderLight: 'rgba(255, 255, 255, 0.2)', // Borde glass sutil  
  borderDark: 'rgba(255, 255, 255, 0.4)',  // Borde glass pronunciado  
    
  // Colores de categorías (vibrantes para combinar con gradiente)  
  categoryBlue: '#42A5F5',     // Azul 400  
  categoryGreen: '#66BB6A',    // Verde 400  
  categoryOrange: '#FFA726',   // Naranja 400  
  categoryRed: '#EF5350',      // Rojo 400  
  categoryPurple: '#AB47BC',   // Púrpura 400  
  categoryTeal: '#26A69A',     // Teal 400  
    
  // Colores adicionales para UI  
  white: '#FFFFFF',  
  black: '#000000',  
  surface: '#FFFFFF',  
};  
  
export const typography = {  
  // Familias de fuentes  
  fontFamily: {  
    regular: 'System',  
    medium: 'System',  
    bold: 'System',  
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
    
  // Estilos de texto predefinidos  
  h1: {  
    fontSize: 28,  
    fontWeight: '700' as const,  
    lineHeight: 1.2,  
    color: colors.textOnGradient,  
  },  
  h2: {  
    fontSize: 24,  
    fontWeight: '600' as const,  
    lineHeight: 1.3,  
    color: colors.textOnGradient,  
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
  xxl: 24,  
  full: 9999,  
};  
  
/**  
 * Sombras para glassmorphism  
 * Sombras suaves que complementan el efecto glass  
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
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 2,  
  },  
  base: {  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 4 },  
    shadowOpacity: 0.15,  
    shadowRadius: 8,  
    elevation: 4,  
  },  
  lg: {  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 8 },  
    shadowOpacity: 0.2,  
    shadowRadius: 16,  
    elevation: 8,  
  },  
  glass: {  
    shadowColor: 'rgba(0, 0, 0, 0.1)',  
    shadowOffset: { width: 0, height: 8 },  
    shadowOpacity: 0.3,  
    shadowRadius: 20,  
    elevation: 6,  
  },  
};  
  
/**  
 * Estilos comunes reutilizables  
 * Implementan glassmorphism y gradientes  
 */  
export const commonStyles = {  
  // Contenedor principal con gradiente  
  container: {  
    flex: 1,  
    backgroundColor: colors.background,  
  },  
    
  // Tarjeta con efecto glassmorphism  
  card: {  
    backgroundColor: colors.backgroundCard,  
    borderRadius: borderRadius.xxl,  
    padding: spacing.base,  
    borderWidth: 1,  
    borderColor: colors.border,  
    ...shadows.glass,  
  },  
    
  // Tarjeta glass más sutil  
  cardLight: {  
    backgroundColor: colors.backgroundGlass,  
    borderRadius: borderRadius.xl,  
    padding: spacing.base,  
    borderWidth: 1,  
    borderColor: colors.borderLight,  
    ...shadows.base,  
  },  
    
  // Input de texto con efecto glass  
  input: {  
    height: 50,  
    borderWidth: 1,  
    borderColor: colors.border,  
    borderRadius: borderRadius.lg,  
    paddingHorizontal: spacing.base,  
    fontSize: typography.fontSize.base,  
    backgroundColor: colors.backgroundGlass,  
    color: colors.textPrimary,  
  },  
    
  // Botón primario (turquesa)  
  button: {  
    height: 50,  
    backgroundColor: colors.primary,  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
    ...shadows.base,  
  },  
    
  // Botón secundario (verde lima)  
  buttonSecondary: {  
    height: 50,  
    backgroundColor: colors.secondary,  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
    ...shadows.base,  
  },  
    
  // Botón glass (transparente)  
  buttonGlass: {  
    height: 50,  
    backgroundColor: colors.backgroundGlass,  
    borderRadius: borderRadius.lg,  
    borderWidth: 1,  
    borderColor: colors.border,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
  },  
    
  // Texto de botón  
  buttonText: {  
    color: colors.textInverse,  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
    
  // Texto de botón glass  
  buttonTextGlass: {  
    color: colors.textPrimary,  
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
  borderRadius,  // ← Debe estar aquí también  
  shadows,  
  commonStyles,  
};