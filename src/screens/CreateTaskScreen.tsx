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
  
type Props = NativeStackScreenProps<RootStackParamList, 'CreateTask'>;  
  
// Categorías predefinidas de tareas  
const TASK_CATEGORIES = [  
  { id: 'cleaning', label: 'Limpieza', icon: '🧹' },  
  { id: 'trash', label: 'Basura', icon: '🗑️' },  
  { id: 'bathroom', label: 'Baños', icon: '🚽' },  
  { id: 'shopping', label: 'Compras', icon: '🛒' },  
  { id: 'other', label: 'Otro', icon: '📝' },  
];  
  
export default function CreateTaskScreen({ navigation }: Props) {  
  const [taskName, setTaskName] = useState('');  
  const [selectedCategory, setSelectedCategory] = useState('cleaning');  
  const [rotationDays, setRotationDays] = useState('3');  
  const [points, setPoints] = useState('10');  
  const [loading, setLoading] = useState(false);  
  const { user } = useAuthStore();  
  
  const handleCreateTask = async () => {  
    // Validaciones  
    if (!taskName.trim()) {  
      Alert.alert('Error', 'Por favor ingresa un nombre para la tarea');  
      return;  
    }  
  
    const daysNum = parseInt(rotationDays);  
    if (isNaN(daysNum) || daysNum < 1) {  
      Alert.alert('Error', 'Los días de rotación deben ser al menos 1');  
      return;  
    }  
  
    const pointsNum = parseInt(points);  
    if (isNaN(pointsNum) || pointsNum < 1) {  
      Alert.alert('Error', 'Los puntos deben ser al menos 1');  
      return;  
    }  
  
    if (!user?.flatId) {  
      Alert.alert('Error', 'No estás asociado a ningún piso');  
      return;  
    }  
  
    setLoading(true);  
    try {  
      // Obtener información del piso para asignar la tarea al primer miembro  
      const flatDoc = await firestore()  
        .collection('flats')  
        .doc(user.flatId)  
        .get();  
  
      const flatData = flatDoc.data();  
      if (!flatData || !flatData.members || flatData.members.length === 0) {  
        Alert.alert('Error', 'No hay miembros en el piso');  
        setLoading(false);  
        return;  
      }  
  
      // Crear la tarea en la subcolección tasks  
      const taskRef = await firestore()  
        .collection('flats')  
        .doc(user.flatId)  
        .collection('tasks')  
        .add({  
          name: taskName.trim(),  
          category: selectedCategory,  
          assignedTo: flatData.members[0], // Asignar al primer miembro  
          status: 'pending',  
          dueDate: firestore.Timestamp.fromDate(  
            new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000)  
          ),  
          points: pointsNum,  
          createdAt: firestore.FieldValue.serverTimestamp(),  
          createdBy: user.uid,  
        });  
  
      // Crear la configuración de rotación  
      await firestore()  
        .collection('flats')  
        .doc(user.flatId)  
        .collection('rotations')  
        .doc(taskRef.id)  
        .set({  
          taskId: taskRef.id,  
          taskName: taskName.trim(),  
          rotationDays: daysNum,  
          members: flatData.members,  
          currentIndex: 0,  
          lastRotation: firestore.FieldValue.serverTimestamp(),  
          active: true,  
        });  
  
      Alert.alert(  
        'Tarea Creada',  
        `La tarea "${taskName}" ha sido creada exitosamente`,  
        [{ text: 'OK', onPress: () => navigation.goBack() }]  
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
        <Text style={styles.title}>Crear Nueva Tarea</Text>  
        <Text style={styles.description}>  
          Define una tarea que rotará entre los miembros del piso  
        </Text>  
  
        <Text style={styles.label}>Nombre de la Tarea *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: Lavar los platos"  
          value={taskName}  
          onChangeText={setTaskName}  
          editable={!loading}  
        />  
  
        <Text style={styles.label}>Categoría *</Text>  
        <View style={styles.categoryContainer}>  
          {TASK_CATEGORIES.map((category) => (  
            <TouchableOpacity  
              key={category.id}  
              style={[  
                styles.categoryButton,  
                selectedCategory === category.id && styles.categoryButtonSelected,  
              ]}  
              onPress={() => setSelectedCategory(category.id)}  
              disabled={loading}  
            >  
              <Text style={styles.categoryIcon}>{category.icon}</Text>  
              <Text  
                style={[  
                  styles.categoryLabel,  
                  selectedCategory === category.id && styles.categoryLabelSelected,  
                ]}  
              >  
                {category.label}  
              </Text>  
            </TouchableOpacity>  
          ))}  
        </View>  
  
        <Text style={styles.label}>Días de Rotación *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: 3"  
          value={rotationDays}  
          onChangeText={setRotationDays}  
          keyboardType="number-pad"  
          editable={!loading}  
        />  
        <Text style={styles.hint}>  
          Cada cuántos días rotará la tarea entre los miembros  
        </Text>  
  
        <Text style={styles.label}>Puntos por Completar *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: 10"  
          value={points}  
          onChangeText={setPoints}  
          keyboardType="number-pad"  
          editable={!loading}  
        />  
        <Text style={styles.hint}>  
          Puntos que ganará el usuario al completar la tarea  
        </Text>  
  
        <TouchableOpacity  
          style={[styles.button, loading && styles.buttonDisabled]}  
          onPress={handleCreateTask}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator color="#fff" />  
          ) : (  
            <Text style={styles.buttonText}>Crear Tarea</Text>  
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
    marginBottom: 5,  
    fontSize: 16,  
    backgroundColor: '#fff',  
  },  
  hint: {  
    fontSize: 12,  
    color: '#999',  
    marginBottom: 15,  
    fontStyle: 'italic',  
  },  
  categoryContainer: {  
    flexDirection: 'row',  
    flexWrap: 'wrap',  
    gap: 10,  
    marginBottom: 15,  
  },  
  categoryButton: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingVertical: 10,  
    paddingHorizontal: 15,  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: '#ddd',  
    backgroundColor: '#fff',  
  },  
  categoryButtonSelected: {  
    backgroundColor: '#007AFF',  
    borderColor: '#007AFF',  
  },  
  categoryIcon: {  
    fontSize: 20,  
    marginRight: 8,  
  },  
  categoryLabel: {  
    fontSize: 14,  
    color: '#333',  
  },  
  categoryLabelSelected: {  
    color: '#fff',  
    fontWeight: '600',  
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