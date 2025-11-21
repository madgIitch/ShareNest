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
  
type Props = NativeStackScreenProps<RootStackParamList, 'JoinFlat'>;  
  
export default function JoinFlatScreen({ navigation }: Props) {  
  const [inviteCode, setInviteCode] = useState('');  
  const [loading, setLoading] = useState(false);  
  const { user } = useAuthStore();  
  
  const handleJoinFlat = async () => {  
    if (!inviteCode) {  
      Alert.alert('Error', 'Por favor ingresa el código de invitación');  
      return;  
    }  
  
    setLoading(true);  
    try {  
      // Buscar piso por código de invitación  
      const flatsSnapshot = await firestore()  
        .collection('flats')  
        .where('inviteCode', '==', inviteCode.toUpperCase())  
        .get();  
  
      if (flatsSnapshot.empty) {  
        Alert.alert('Error', 'Código de invitación inválido');  
        setLoading(false);  
        return;  
      }  
  
      const flatDoc = flatsSnapshot.docs[0];  
      const flatData = flatDoc.data();  
  
      // Verificar si el piso está lleno  
      if (flatData.members.length >= flatData.maxRoommates) {  
        Alert.alert('Error', 'Este piso ya está completo');  
        setLoading(false);  
        return;  
      }  
  
      // Verificar si el usuario ya es miembro  
      if (flatData.members.includes(user?.uid)) {  
        Alert.alert('Error', 'Ya eres miembro de este piso');  
        setLoading(false);  
        return;  
      }  
  
      // Agregar usuario al piso  
      await firestore().collection('flats').doc(flatDoc.id).update({  
        members: firestore.FieldValue.arrayUnion(user?.uid),  
      });  
  
      // Actualizar usuario con flatId  
      await firestore().collection('users').doc(user?.uid).update({  
        flatId: flatDoc.id,  
        isAdmin: false,  
      });  
  
      Alert.alert(  
        'Éxito',  
        `Te has unido a ${flatData.name}`,  
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
        <Text style={styles.title}>Unirse a un Piso</Text>  
        <Text style={styles.description}>  
          Ingresa el código de invitación que te compartió tu roommate  
        </Text>  
  
        <Text style={styles.label}>Código de Invitación *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: ABC123"  
          placeholderTextColor={colors.textSecondary}  
          value={inviteCode}  
          onChangeText={setInviteCode}  
          autoCapitalize="characters"  
          editable={!loading}  
        />  
  
        <TouchableOpacity  
          style={[styles.button, loading && styles.buttonDisabled]}  
          onPress={handleJoinFlat}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator color={colors.textInverse} />  
          ) : (  
            <Text style={styles.buttonText}>Unirse al Piso</Text>  
          )}  
        </TouchableOpacity>  
  
        <View style={styles.infoBox}>  
          <Text style={styles.infoText}>  
            💡 El código de invitación es proporcionado por el administrador del piso  
          </Text>  
        </View>  
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
    marginBottom: spacing.xs,  
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
  infoBox: {  
    backgroundColor: colors.backgroundGlassLight, // Glass más opaco  
    borderRadius: borderRadius.lg,  
    borderWidth: 1,  
    borderColor: colors.border,  
    padding: spacing.md,  
    marginTop: spacing.xl,  
  },  
  infoText: {  
    fontSize: 14,  
    color: colors.textOnGradient, // Blanco sobre glass  
    lineHeight: 20,  
  },  
});