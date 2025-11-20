// src/theme/index.ts    
    
export const colors = {    
  // Colores primarios - Azul petróleo oscuro  
  primary: '#2D5A88',      // Azul petróleo oscuro, clean y profesional  
  primaryDark: '#1E3F5E',  // Fondo o botones presionados  
  primaryLight: '#4C7CA8', // Para estados hover o acentos  
      
  // Colores de estado - Tonos oscuros moderados  
  success: '#2F8F52',      // Verde oscuro, sin neón  
  warning: '#D98A1F',      // Mostaza oscuro, cálido  
  error: '#C4463A',        // Rojo quemado, ideal para dark UI  
  info: '#3A8CA8',         // Cyan oscuro suave  
      
  // Fondos - Neutros profundos pero no totalmente negros  
  background: '#1A1C1E',      // Ideal para contenido  
  backgroundCard: '#242629',  // Sutil contraste con fondo  
      
  // Texto - Material dark mode con 100% / 70% / 50%  
  textPrimary: '#F2F2F2',     // Texto principal  
  textSecondary: '#C4C4C4',   // Texto secundario  
  textTertiary: '#8E8E8E',    // Texto terciario  
  textInverse: '#000000',     // Usado en botones o chips claros  
      
  // Bordes - Líneas discretas pero visibles en modo oscuro  
  border: '#3A3D40',       // Bordes principales  
  borderLight: '#2C2E31',  // Bordes sutiles  
      
  // Categorías - Tonos oscuros armónicos  
  categoryBlue: '#2D5A88',    // Sync con primary  
  categoryGreen: '#2F8F52',   // Igual que success  
  categoryOrange: '#D98A1F',  // Cálido sin saturar  
  categoryRed: '#C4463A',     // Coherente con error  
  categoryPurple: '#6A4FA3',  // Morado profundo elegante  
};    
    
export const typography = {    
  fontSize: {    
    xs: 10,    
    sm: 12,    
    base: 14,    
    md: 16,    
    lg: 18,    
    xl: 20,    
    xxl: 24,    
    xxxl: 32,    
  },    
  fontWeight: {    
    regular: '400' as const,    
    medium: '500' as const,    
    semibold: '600' as const,    
    bold: '700' as const,    
  },    
  h1: {    
    fontSize: 32,    
    fontWeight: '700' as const,    
    color: colors.textPrimary,    
  },    
  h2: {    
    fontSize: 24,    
    fontWeight: '700' as const,    
    color: colors.textPrimary,    
  },    
  h3: {    
    fontSize: 20,    
    fontWeight: '600' as const,    
    color: colors.textPrimary,    
  },    
  body: {    
    fontSize: 14,    
    fontWeight: '400' as const,    
    color: colors.textPrimary,    
  },    
  caption: {    
    fontSize: 12,    
    fontWeight: '400' as const,    
    color: colors.textSecondary,    
  },    
};    
    
export const spacing = {    
  xs: 4,    
  sm: 8,    
  md: 12,    
  lg: 16,    
  xl: 24,    
  xxl: 32,    
};    
    
export const borderRadius = {    
  sm: 4,    
  md: 8,    
  lg: 12,    
  xl: 16,    
  full: 9999,    
};    
    
export const shadows = {    
  sm: {    
    shadowColor: '#000',    
    shadowOffset: { width: 0, height: 1 },    
    shadowOpacity: 0.18,    
    shadowRadius: 1.0,    
    elevation: 1,    
  },    
  md: {    
    shadowColor: '#000',    
    shadowOffset: { width: 0, height: 2 },    
    shadowOpacity: 0.23,    
    shadowRadius: 2.62,    
    elevation: 4,    
  },    
  lg: {    
    shadowColor: '#000',    
    shadowOffset: { width: 0, height: 4 },    
    shadowOpacity: 0.30,    
    shadowRadius: 4.65,    
    elevation: 8,    
  },    
};    
    
export const commonStyles = {    
  card: {    
    backgroundColor: colors.backgroundCard,    
    borderRadius: borderRadius.lg,    
    padding: spacing.lg,    
    ...shadows.md,    
  },    
      
  input: {    
    width: '100%' as const,    
    height: 50,    
    borderWidth: 1,    
    borderColor: colors.border,    
    borderRadius: borderRadius.md,    
    paddingHorizontal: spacing.md,    
    fontSize: typography.fontSize.base,    
    backgroundColor: colors.backgroundCard,    
    color: colors.textPrimary,    
  },    
      
  button: {    
    width: '100%' as const,    
    height: 50,    
    backgroundColor: colors.primary,    
    borderRadius: borderRadius.md,    
    justifyContent: 'center' as const,    
    alignItems: 'center' as const,    
  },    
      
  buttonText: {    
    color: colors.textPrimary,    
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