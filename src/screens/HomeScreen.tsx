import React from 'react';    
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';    
import { NativeStackScreenProps } from '@react-navigation/native-stack';    
import { RootStackParamList } from '../../App';    
import { colors, typography, spacing, commonStyles } from '../theme';    
    
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
    backgroundColor: colors.background,    
  },    
  content: {    
    padding: spacing.lg,    
  },    
  title: {    
    ...typography.h1,    
    marginBottom: spacing.sm,    
  },    
  description: {    
    ...typography.body,    
    color: colors.textSecondary,    
    marginBottom: spacing.xl,    
  },    
  card: {    
    ...commonStyles.card,    
    marginBottom: spacing.md,    
  },    
  cardTitle: {    
    ...typography.h3,    
    marginBottom: spacing.sm,    
  },    
  cardText: {    
    ...typography.body,    
    color: colors.textSecondary,    
    lineHeight: 20,    
  },    
  button: {    
    ...commonStyles.button,    
    marginTop: spacing.lg,    
  },    
  buttonText: {    
    ...commonStyles.buttonText,    
  },    
});