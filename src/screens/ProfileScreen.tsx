import React from 'react';  
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { colors, typography, spacing, commonStyles } from '../theme';  
  
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
    ...commonStyles.container,  
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
  },  
  avatarText: {  
    ...typography.h1,  
    color: colors.white,  
  },  
  name: {  
    ...typography.h2,  
    marginBottom: spacing.xs,  
  },  
  email: {  
    ...typography.caption,  
    color: colors.textSecondary,  
  },  
  section: {  
    ...commonStyles.card,  
    marginBottom: spacing.lg,  
    overflow: 'hidden',  
  },  
  sectionTitle: {  
    ...typography.body,  
    fontWeight: '600',  
    color: colors.text,  
    padding: spacing.md,  
    backgroundColor: colors.backgroundLight,  
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
    color: colors.text,  
  },  
  menuArrow: {  
    fontSize: 24,  
    color: colors.textSecondary,  
  },  
  logoutButton: {  
    backgroundColor: colors.white,  
    borderRadius: 8,  
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