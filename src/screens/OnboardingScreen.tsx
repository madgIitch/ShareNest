import React from 'react';  
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';  
  
type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;  
  
export default function OnboardingScreen({ navigation }: Props) {  
  return (  
    <View style={styles.container}>  
      <Text style={styles.title}>¡Bienvenido a ShareNest!</Text>  
      <Text style={styles.description}>  
        Gestiona tu piso compartido de forma sencilla  
      </Text>  
  
      <View style={styles.optionsContainer}>  
        <TouchableOpacity  
          style={styles.primaryButton}  
          onPress={() => navigation.navigate('CreateFlat')}  
        >  
          <Text style={styles.primaryButtonText}>Crear un Piso</Text>  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={styles.secondaryButton}  
          onPress={() => navigation.navigate('JoinFlat')}  
        >  
          <Text style={styles.secondaryButtonText}>Unirse a un Piso</Text>  
        </TouchableOpacity>  
      </View>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    padding: spacing.lg,  
    backgroundColor: colors.background, // Transparente para mostrar gradiente  
  },  
  title: {  
    fontSize: typography.fontSize.display,  
    fontWeight: typography.fontWeight.bold,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.md,  
    textAlign: 'center',  
  },  
  description: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.xl * 2.5, // 50px  
    textAlign: 'center',  
    opacity: 0.9,  
  },  
  optionsContainer: {  
    width: '100%',  
  },  
  primaryButton: {  
    height: 50,  
    width: '100%',  
    backgroundColor: colors.primary, // Turquesa  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center',  
    alignItems: 'center',  
    marginBottom: spacing.md,  
    ...shadows.base,  
  },  
  primaryButtonText: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
  secondaryButton: {  
    width: '100%',  
    height: 50,  
    backgroundColor: colors.backgroundGlass, // Glass transparente  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center',  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: colors.border, // Borde glass blanco  
  },  
  secondaryButtonText: {  
    color: colors.textOnGradient, // Blanco sobre glass  
    fontSize: 16,  
    fontWeight: '600',  
  },  
});