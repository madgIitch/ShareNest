import React, { useState } from 'react';  
import {   
  View,   
  Text,   
  TextInput,   
  TouchableOpacity,   
  StyleSheet,   
  Alert,   
  ActivityIndicator,   
  ScrollView   
} from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import firestore from '@react-native-firebase/firestore';  
import { useAuthStore } from '../store/authStore';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';
  
type Props = NativeStackScreenProps<RootStackParamList, 'CreateFlat'>;  
  
export default function CreateFlatScreen({ navigation }: Props) {  
  const [name, setName] = useState('');  
  const [address, setAddress] = useState('');  
  const [roommates, setRoommates] = useState('');  
  const [loading, setLoading] = useState(false);  
  const { user } = useAuthStore();  
  
  const generateInviteCode = () => {  
    return Math.random().toString(36).substring(2, 8).toUpperCase();  
  };  
  
  const handleCreateFlat = async () => {  
    if (!name || !roommates) {  
      Alert.alert('Error', 'Por favor completa los campos obligatorios');  
      return;  
    }  
  
    const roommatesNum = parseInt(roommates);  
    if (isNaN(roommatesNum) || roommatesNum < 2) {  
      Alert.alert('Error', 'El número de roommates debe ser al menos 2');  
      return;  
    }  
  
    setLoading(true);  
    try {  
      const inviteCode = generateInviteCode();  
  
      // Crear documento del piso  
      const flatRef = await firestore().collection('flats').add({  
        name,  
        address: address || null,  
        maxRoommates: roommatesNum,  
        inviteCode,  
        adminId: user?.uid,  
        members: [user?.uid],  
        createdAt: firestore.FieldValue.serverTimestamp(),  
      });  
  
      // Actualizar usuario con flatId y rol de admin  
      await firestore().collection('users').doc(user?.uid).update({  
        flatId: flatRef.id,  
        isAdmin: true,  
      });  
  
      Alert.alert(  
        'Piso Creado',  
        `Código de invitación: ${inviteCode}\nComparte este código con tus roommates`,  
        [{ text: 'OK', onPress: () => navigation.replace('Home') }]  
      );  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.content}>  
        <Text style={styles.title}>Crear Piso</Text>  
        <Text style={styles.description}>  
          Configura tu piso compartido  
        </Text>  
  
        <Text style={styles.label}>Nombre del Piso *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: Piso Centro"  
          placeholderTextColor={colors.textSecondary}  
          value={name}  
          onChangeText={setName}  
          editable={!loading}  
        />  
  
        <Text style={styles.label}>Dirección (opcional)</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: Calle Mayor 123"  
          placeholderTextColor={colors.textSecondary}  
          value={address}  
          onChangeText={setAddress}  
          editable={!loading}  
        />  
  
        <Text style={styles.label}>Número de Roommates *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: 4"  
          placeholderTextColor={colors.textSecondary}  
          value={roommates}  
          onChangeText={setRoommates}  
          keyboardType="number-pad"  
          editable={!loading}  
        />  
  
        <TouchableOpacity  
          style={[styles.button, loading && styles.buttonDisabled]}  
          onPress={handleCreateFlat}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator color={colors.textInverse} />  
          ) : (  
            <Text style={styles.buttonText}>Crear Piso</Text>  
          )}  
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
  label: {  
    ...typography.label,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.xs,  
    marginTop: spacing.sm,  
  },  
  input: {  
    height: 50,  
    borderWidth: 1,  
    borderColor: colors.border, // Borde glass blanco semitransparente  
    borderRadius: borderRadius.lg,  
    paddingHorizontal: spacing.base,  
    fontSize: typography.fontSize.base,  
    backgroundColor: colors.backgroundGlass, // Glass transparente  
    color: colors.textPrimary, // Texto oscuro en input  
    marginBottom: spacing.md,  
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
  buttonDisabled: {  
    opacity: 0.6,  
  },  
  buttonText: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
});