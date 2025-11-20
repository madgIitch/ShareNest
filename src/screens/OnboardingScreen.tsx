import React from 'react';  
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { colors, typography, spacing, commonStyles } from '../theme';  
  
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
    backgroundColor: colors.background,  
  },  
  title: {  
    ...typography.h1,  
    marginBottom: spacing.md,  
    textAlign: 'center',  
  },  
  description: {  
    ...typography.body,  
    color: colors.textSecondary,  
    marginBottom: spacing.xl * 2.5, // 50px  
    textAlign: 'center',  
  },  
  optionsContainer: {  
    width: '100%',  
  },  
  primaryButton: {  
    ...commonStyles.button,  
    marginBottom: spacing.md,  
  },  
  primaryButtonText: {  
    ...commonStyles.buttonText,  
  },  
  secondaryButton: {  
    width: '100%',  
    height: 50,  
    backgroundColor: colors.background,  
    borderRadius: 8,  
    justifyContent: 'center',  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: colors.primary,  
  },  
  secondaryButtonText: {  
    color: colors.primary,  
    fontSize: 16,  
    fontWeight: '600',  
  },  
});