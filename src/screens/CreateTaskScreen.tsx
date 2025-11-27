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
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
  
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
  
  const daysNum = parseInt(rotationDays, 10);  
    if (isNaN(daysNum) || daysNum < 1) {  
      Alert.alert('Error', 'Los días de rotación deben ser al menos 1');  
      return;  
    }  
  
    const pointsNum = parseInt(points, 10);  
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
          assignedTo: flatData.members[0],  
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
          placeholderTextColor={colors.textSecondary}  
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
          placeholderTextColor={colors.textSecondary}  
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
          placeholderTextColor={colors.textSecondary}  
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
            <ActivityIndicator color={colors.textInverse} />  
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
    marginBottom: spacing.xs,  
  },  
  hint: {  
    fontSize: 12,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    marginBottom: spacing.md,  
    fontStyle: 'italic',  
    opacity: 0.8,  
  },  
  categoryContainer: {  
    flexDirection: 'row',  
    flexWrap: 'wrap',  
    gap: spacing.sm,  
    marginBottom: spacing.md,  
  },  
  categoryButton: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingVertical: spacing.sm,  
    paddingHorizontal: spacing.md,  
    borderRadius: borderRadius.lg,  
    borderWidth: 1,  
    borderColor: colors.border, // Borde glass  
    backgroundColor: colors.backgroundGlass, // Fondo glass transparente  
  },  
  categoryButtonSelected: {  
    backgroundColor: colors.primary, // Turquesa sólido  
    borderColor: colors.primary,  
    ...shadows.base, // Sombra para destacar  
  },  
  categoryIcon: {  
    fontSize: 20,  
    marginRight: spacing.xs,  
  },  
  categoryLabel: {  
    fontSize: 14,  
    color: colors.textOnGradient, // Blanco sobre glass  
  },  
  categoryLabelSelected: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontWeight: '600',  
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