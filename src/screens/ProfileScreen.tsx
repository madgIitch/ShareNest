import React from 'react';  
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';  
  
type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;  
  
export default function ProfileScreen({ navigation }: Props) {  
  const handleLogout = () => {  
    Alert.alert(  
      'Cerrar Sesión',  
      '¿Estás seguro que deseas salir?',  
      [  
        { text: 'Cancelar', style: 'cancel' },  
        {  
          text: 'Salir',  
          style: 'destructive',  
          onPress: () => navigation.replace('Login')  
        },  
      ]  
    );  
  };  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.content}>  
        <View style={styles.header}>  
          <View style={styles.avatar}>  
            <Text style={styles.avatarText}>U</Text>  
          </View>  
          <Text style={styles.name}>Usuario</Text>  
          <Text style={styles.email}>usuario@ejemplo.com</Text>  
        </View>  
  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información</Text>  
  
          <TouchableOpacity style={styles.menuItem}>  
            <Text style={styles.menuText}>Editar Perfil</Text>  
            <Text style={styles.menuArrow}>›</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity style={styles.menuItem}>  
            <Text style={styles.menuText}>Configuración</Text>  
            <Text style={styles.menuArrow}>›</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity style={styles.menuItem}>  
            <Text style={styles.menuText}>Privacidad</Text>  
            <Text style={styles.menuArrow}>›</Text>  
          </TouchableOpacity>  
        </View>  
  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Soporte</Text>  
  
          <TouchableOpacity style={styles.menuItem}>  
            <Text style={styles.menuText}>Ayuda</Text>  
            <Text style={styles.menuArrow}>›</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity style={styles.menuItem}>  
            <Text style={styles.menuText}>Acerca de</Text>  
            <Text style={styles.menuArrow}>›</Text>  
          </TouchableOpacity>  
        </View>  
  
        <TouchableOpacity  
          style={styles.logoutButton}  
          onPress={handleLogout}  
        >  
          <Text style={styles.logoutText}>Cerrar Sesión</Text>  
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
  header: {  
    alignItems: 'center',  
    marginBottom: spacing.xl,  
    paddingVertical: spacing.lg,  
  },  
  avatar: {  
    width: 80,  
    height: 80,  
    borderRadius: 40,  
    backgroundColor: colors.primary, // Turquesa  
    justifyContent: 'center',  
    alignItems: 'center',  
    marginBottom: spacing.md,  
    ...shadows.base,  
  },  
  avatarText: {  
    fontSize: typography.fontSize.display,  
    fontWeight: typography.fontWeight.bold,  
    color: colors.textInverse, // Blanco sobre turquesa  
  },  
  name: {  
    fontSize: typography.fontSize.xxl,  
    fontWeight: typography.fontWeight.semibold,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.xs,  
  },  
  email: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    opacity: 0.9,  
  },  
  section: {  
    backgroundColor: colors.backgroundCard, // Glass más opaco  
    borderRadius: borderRadius.xxl,  
    borderWidth: 1,  
    borderColor: colors.border,  
    marginBottom: spacing.lg,  
    overflow: 'hidden',  
    ...shadows.glass,  
  },  
  sectionTitle: {  
    ...typography.body,  
    fontWeight: '600',  
    color: colors.textOnGradient, // Blanco sobre glass  
    padding: spacing.md,  
    backgroundColor: colors.backgroundGlassLight, // Glass más opaco para header  
  },  
  menuItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    padding: spacing.md,  
    borderBottomWidth: 1,  
    borderBottomColor: colors.border,  
  },  
  menuText: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre glass  
  },  
  menuArrow: {  
    fontSize: 24,  
    color: colors.textOnGradient, // Blanco sobre glass  
    opacity: 0.7,  
  },  
  logoutButton: {  
    backgroundColor: colors.backgroundGlass, // Glass transparente  
    borderRadius: borderRadius.lg,  
    padding: spacing.md,  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: colors.error, // Borde rojo  
  },  
  logoutText: {  
    ...typography.body,  
    color: colors.error, // Texto rojo  
    fontWeight: '600',  
  },  
});