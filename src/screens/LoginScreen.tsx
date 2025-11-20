import React, { useState } from 'react';  
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { useAuthStore } from '../store/authStore';  
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';  
  
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;  
  
export default function LoginScreen({ navigation }: Props) {  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [isSignUp, setIsSignUp] = useState(false);  
  const { signIn, signUp, loading } = useAuthStore();  
  
  const handleAuth = async () => {  
    if (!email || !password) {  
      Alert.alert('Error', 'Por favor completa todos los campos');  
      return;  
    }  
  
    try {  
      if (isSignUp) {  
        await signUp(email, password);  
        Alert.alert('Éxito', 'Cuenta creada correctamente');  
      } else {  
        await signIn(email, password);  
      }  
      navigation.replace('Onboarding');  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    }  
  };  
  
  return (  
    <View style={styles.container}>  
      <Text style={styles.title}>ShareNest</Text>  
      <Text style={styles.subtitle}>  
        {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}  
      </Text>  
  
      <TextInput  
        style={styles.input}  
        placeholder="Email"  
        value={email}  
        onChangeText={setEmail}  
        keyboardType="email-address"  
        autoCapitalize="none"  
        editable={!loading}  
      />  
  
      <TextInput  
        style={styles.input}  
        placeholder="Contraseña"  
        value={password}  
        onChangeText={setPassword}  
        secureTextEntry  
        editable={!loading}  
      />  
  
      <TouchableOpacity  
        style={[styles.button, loading && styles.buttonDisabled]}  
        onPress={handleAuth}  
        disabled={loading}  
      >  
        {loading ? (  
          <ActivityIndicator color={colors.textInverse} />  
        ) : (  
          <Text style={styles.buttonText}>  
            {isSignUp ? 'Registrarse' : 'Entrar'}  
          </Text>  
        )}  
      </TouchableOpacity>  
  
      <TouchableOpacity  
        style={styles.linkButton}  
        onPress={() => setIsSignUp(!isSignUp)}  
        disabled={loading}  
      >  
        <Text style={styles.linkText}>  
          {isSignUp  
            ? '¿Ya tienes cuenta? Inicia sesión'  
            : '¿No tienes cuenta? Regístrate'}  
        </Text>  
      </TouchableOpacity>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    padding: spacing.lg,  
    backgroundColor: colors.backgroundCard,  
  },  
  title: {  
    ...commonStyles.title,  
    marginBottom: spacing.sm,  
  },  
  subtitle: {  
    ...commonStyles.subtitle,  
    marginBottom: spacing.xxl,  
  },  
  input: {  
    ...commonStyles.input,  
    width: '100%',  
    marginBottom: spacing.base,  
  },  
  button: {  
    ...commonStyles.button,  
    width: '100%',  
    marginTop: spacing.sm,  
  },  
  buttonDisabled: {  
    opacity: 0.6,  
  },  
  buttonText: {  
    ...commonStyles.buttonText,  
  },  
  linkButton: {  
    marginTop: spacing.lg,  
  },  
  linkText: {  
    color: colors.primary,  
    fontSize: typography.fontSize.sm,  
  },  
});