import React from 'react';  
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { colors, typography, spacing, borderRadius, shadows } from '../theme';  
  
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
    backgroundColor: colors.background,  
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
    backgroundColor: colors.primary,  
    justifyContent: 'center',  
    alignItems: 'center',  
    marginBottom: spacing.md,  
    ...shadows.base,  
  },  
  avatarText: {  
    fontSize: typography.fontSize.display,  
    fontWeight: typography.fontWeight.bold,  
    color: colors.textInverse,  
  },  
  name: {  
    fontSize: typography.fontSize.xxl,  
    fontWeight: typography.fontWeight.semibold,  
    color: colors.textPrimary,  
    marginBottom: spacing.xs,  
    textShadowColor: 'rgba(0, 0, 0, 0.3)',  
    textShadowOffset: { width: 0, height: 1 },  
    textShadowRadius: 2,  
  },  
  email: {  
    ...typography.caption,  
    color: colors.textSecondary,  
    opacity: 0.9,  
  },  
  section: {  
    backgroundColor: 'rgba(255, 255, 255, 0.3)',  
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
    color: colors.textPrimary,  
    padding: spacing.md,  
    backgroundColor: 'rgba(255, 255, 255, 0.4)',  
    borderBottomWidth: 1,  
    borderBottomColor: colors.border,  
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
    color: colors.textPrimary,  
  },  
  menuArrow: {  
    fontSize: 24,  
    color: colors.textSecondary,  
    opacity: 0.7,  
  },  
  logoutButton: {  
    backgroundColor: 'rgba(255, 255, 255, 0.2)',  
    borderRadius: borderRadius.lg,  
    padding: spacing.md,  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: colors.error,  
  },  
  logoutText: {  
    ...typography.body,  
    color: colors.error,  
    fontWeight: '600',  
  },  
});