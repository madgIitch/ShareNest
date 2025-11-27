// src/theme/index.ts  
  
/**  
 * ShareNest Theme System  
 * Glassmorphism design with vibrant gradients  
 *   
 * Design Principles:  
 * - Turquoise (#52D5E6) to Lime Green (#B0EE87) gradient  
 * - Glassmorphism effects with transparency and blur  
 * - WCAG AA contrast ratio (minimum 4.5:1)  
 * - Elevation through transparency and soft shadows  
 */  
  
export const colors = {  
  // Gradient Colors  
  gradientStart: '#52D5E6',    // Turquoise - gradient start  
  gradientEnd: '#B0EE87',      // Lime green - gradient end  
    
  // Brand Colors  
  primary: '#52D5E6',          // Turquoise - primary brand  
  primaryDark: '#3BAFC4',      // Dark turquoise - pressed states  
  primaryLight: '#7FE0ED',     // Light turquoise - accents  
    
  secondary: '#B0EE87',        // Lime green - secondary brand  
  secondaryDark: '#8FD96A',    // Dark lime green - pressed states  
  secondaryLight: '#C8F5A3',   // Light lime green - accents  
    
  // Semantic Colors  
  success: '#4CAF50',          // Green 500 - success states  
  warning: '#FF9800',          // Orange 500 - warnings  
  error: '#F44336',            // Red 500 - error states  
  info: '#2196F3',             // Blue 500 - information  
    
  // Background Colors (Glassmorphism)  
  background: 'transparent',                    // Transparent for gradient  
  backgroundGlass: 'rgba(255, 255, 255, 0.1)', // Main glass effect  
  backgroundGlassLight: 'rgba(255, 255, 255, 0.15)', // Lighter glass  
  backgroundGlassDark: 'rgba(255, 255, 255, 0.05)',  // Darker glass  
  backgroundCard: 'rgba(255, 255, 255, 0.25)',  // Cards with more opacity  
  backgroundOverlay: 'rgba(0, 0, 0, 0.3)',      // Dark overlay  
    
  // Text Colors (Hierarchy for light/gradient backgrounds)  
  textPrimary: '#1A1A1A',      // Near black - primary text  
  textSecondary: '#4A4A4A',    // Dark gray - secondary text  
  textTertiary: '#6A6A6A',     // Medium gray - tertiary text  
  textInverse: '#FFFFFF',      // White - text on dark backgrounds  
  textOnGradient: '#FFFFFF',   // White - text on gradient (use sparingly)  
    
  // Border Colors (Glassmorphism)  
  border: 'rgba(255, 255, 255, 0.3)',      // Standard glass border  
  borderLight: 'rgba(255, 255, 255, 0.2)', // Subtle glass border  
  borderDark: 'rgba(255, 255, 255, 0.4)',  // Pronounced glass border  
    
  // Category Colors  
  categoryBlue: '#42A5F5',     // Blue 400  
  categoryGreen: '#66BB6A',    // Green 400  
  categoryOrange: '#FFA726',   // Orange 400  
  categoryRed: '#EF5350',      // Red 400  
  categoryPurple: '#AB47BC',   // Purple 400  
  categoryTeal: '#26A69A',     // Teal 400  
    
  // Utility Colors  
  white: '#FFFFFF',  
  black: '#000000',  
  surface: '#FFFFFF',  
};  
  
export const typography = {  
  // Font Families  
  fontFamily: {  
    regular: 'System',  
    medium: 'System',  
    bold: 'System',  
  },  
    
  // Font Sizes (Modular Scale)  
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
    
  // Font Weights  
  fontWeight: {  
    regular: '400' as const,  
    medium: '500' as const,  
    semibold: '600' as const,  
    bold: '700' as const,  
  },  
    
  // Line Heights  
  lineHeight: {  
    tight: 1.2,  
    normal: 1.5,  
    relaxed: 1.75,  
  },  
    
  // Typography Presets  
  h1: {  
  fontSize: 28,  
  fontWeight: '700' as const,  
  lineHeight: 1.2,  
  color: colors.textPrimary, // Cambiado de textOnGradient  
  },  
  h2: {  
    fontSize: 24,  
    fontWeight: '600' as const,  
    lineHeight: 1.3,  
    color: colors.textPrimary, // Cambiado de textOnGradient  
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
 * Shadows for Glassmorphism  
 * Soft shadows that complement glass effects  
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
 * Common Reusable Styles  
 * Implements glassmorphism and gradients  
 */  
export const commonStyles = {  
  // Main container with gradient background  
  container: {  
    flex: 1,  
    backgroundColor: colors.background,  
  },  
    
  // Card with glassmorphism effect  
  card: {  
    backgroundColor: colors.backgroundCard,  
    borderRadius: borderRadius.xxl,  
    padding: spacing.base,  
    borderWidth: 1,  
    borderColor: colors.border,  
    ...shadows.glass,  
  },  
    
  // Lighter glass card  
  cardLight: {  
    backgroundColor: colors.backgroundGlass,  
    borderRadius: borderRadius.xl,  
    padding: spacing.base,  
    borderWidth: 1,  
    borderColor: colors.borderLight,  
    ...shadows.base,  
  },  
    
  // Text input with glass effect  
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
    
  // Primary button (turquoise)  
  button: {  
    height: 50,  
    backgroundColor: colors.primary,  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
    ...shadows.base,  
  },  
    
  // Secondary button (lime green)  
  buttonSecondary: {  
    height: 50,  
    backgroundColor: colors.secondary,  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
    ...shadows.base,  
  },  
    
  // Glass button (transparent)  
  buttonGlass: {  
    height: 50,  
    backgroundColor: colors.backgroundGlass,  
    borderRadius: borderRadius.lg,  
    borderWidth: 1,  
    borderColor: colors.border,  
    justifyContent: 'center' as const,  
    alignItems: 'center' as const,  
  },  
    
  // Button text  
  buttonText: {  
    color: colors.textInverse,  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
    
  // Glass button text  
  buttonTextGlass: {  
    color: colors.textPrimary,  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
    
  // Title  
  title: {  
    ...typography.h1,  
  },  
    
  // Subtitle  
  subtitle: {  
    ...typography.h2,  
  },  
    
  // Form label  
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