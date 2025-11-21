import React, { useState } from 'react';  
import {   
  View,   
  Text,   
  TextInput,   
  TouchableOpacity,   
  StyleSheet,   
  Alert,   
  ActivityIndicator   
} from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { useAuthStore } from '../store/authStore';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';  
  
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
        placeholderTextColor={colors.textSecondary}  
        value={email}  
        onChangeText={setEmail}  
        keyboardType="email-address"  
        autoCapitalize="none"  
        editable={!loading}  
      />  
  
      <TextInput  
        style={styles.input}  
        placeholder="Contraseña"  
        placeholderTextColor={colors.textSecondary}  
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
    backgroundColor: colors.background, // Transparente para mostrar gradiente  
  },  
  title: {  
    fontSize: typography.fontSize.display,  
    fontWeight: typography.fontWeight.bold,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.sm,  
  },  
  subtitle: {  
    fontSize: typography.fontSize.xxl,  
    fontWeight: typography.fontWeight.semibold,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.xxl,  
    opacity: 0.9,  
  },  
  input: {  
    height: 50,  
    width: '100%',  
    borderWidth: 1,  
    borderColor: colors.border, // Borde glass blanco semitransparente  
    borderRadius: borderRadius.lg,  
    paddingHorizontal: spacing.base,  
    fontSize: typography.fontSize.base,  
    backgroundColor: colors.backgroundGlass, // Glass transparente  
    color: colors.textPrimary, // Texto oscuro en input  
    marginBottom: spacing.base,  
  },  
  button: {  
    height: 50,  
    width: '100%',  
    backgroundColor: colors.primary, // Turquesa  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center',  
    alignItems: 'center',  
    marginTop: spacing.sm,  
    ...shadows.base,  
  },  
  buttonDisabled: {  
    opacity: 0.6,  
  },  
  buttonText: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
  linkButton: {  
    marginTop: spacing.lg,  
  },  
  linkText: {  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    fontSize: typography.fontSize.sm,  
    textDecorationLine: 'underline',  
  },  
});