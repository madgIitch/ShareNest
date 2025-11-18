import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import firestore from '@react-native-firebase/firestore';
import { useAuthStore } from '../store/authStore';

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
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <Text style={styles.label}>Dirección (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Calle Mayor 123"
          value={address}
          onChangeText={setAddress}
          editable={!loading}
        />

        <Text style={styles.label}>Número de Roommates *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 4"
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
            <ActivityIndicator color="#fff" />
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
      color: '#666',
        marginBottom: 30,
      },
      label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 10,
      },
      input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
      },
      button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
      },
      buttonDisabled: {
        opacity: 0.6,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
    });
