import React from 'react';  
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';  
  
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;  
  
export default function HomeScreen({ navigation }: Props) {  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.content}>  
        <Text style={styles.title}>Bienvenido a ShareNest</Text>  
        <Text style={styles.description}>  
          Tu espacio para compartir y conectar  
        </Text>  
  
        <View style={styles.card}>  
          <Text style={styles.cardTitle}>Inicio</Text>  
          <Text style={styles.cardText}>  
            Aquí verás las publicaciones de tu comunidad  
          </Text>  
        </View>  
  
        <View style={styles.card}>  
          <Text style={styles.cardTitle}>Próximamente</Text>  
          <Text style={styles.cardText}>  
            • Feed de publicaciones{'\n'}  
            • Notificaciones push{'\n'}  
            • Integración con Firebase  
          </Text>  
        </View>  
  
        <TouchableOpacity  
          style={styles.button}  
          onPress={() => navigation.navigate('Profile')}  
        >  
          <Text style={styles.buttonText}>Ver Perfil</Text>  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={styles.button}  
          onPress={() => navigation.navigate('Tasks')}  
        >  
          <Text style={styles.buttonText}>Ver Tareas</Text>  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={styles.button}  
          onPress={() => navigation.navigate('Expenses')}  
        >  
          <Text style={styles.buttonText}>Ver Gastos</Text>  
        </TouchableOpacity>  
      </View>  
    </ScrollView>  
  );  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: colors.background, // Transparente para mostrar gradiente  
  },  
  content: {  
    padding: spacing.lg,  
  },  
  title: {  
    ...typography.h1,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.sm,  
  },  
  description: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.xl,  
    opacity: 0.9,  
  },  
  card: {  
    backgroundColor: colors.backgroundCard, // Glass más opaco  
    borderRadius: borderRadius.xxl,  
    borderWidth: 1,  
    borderColor: colors.border,  
    padding: spacing.base,  
    marginBottom: spacing.md,  
    ...shadows.glass,  
  },  
  cardTitle: {  
    ...typography.h3,  
    color: colors.textOnGradient, // Blanco sobre glass  
    marginBottom: spacing.sm,  
  },  
  cardText: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre glass  
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,  
    opacity: 0.9,  
  },  
  button: {  
    height: 50,  
    backgroundColor: colors.primary, // Turquesa  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center',  
    alignItems: 'center',  
    marginTop: spacing.lg,  
    ...shadows.base,  
  },  
  buttonText: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
});