import React, { useEffect, useState } from 'react';  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  Alert,  
  ActivityIndicator,  
} from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { useTaskStore } from '../store/taskStore';  
import { useAuthStore } from '../store/authStore';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';
  
type Props = NativeStackScreenProps<RootStackParamList, 'Tasks'>;  
  
export default function TasksScreen({ navigation }: Props) {  
  const { user } = useAuthStore();  
  const { tasks, loading, fetchTasks, completeTask, checkRotations } = useTaskStore();  
  const [refreshing, setRefreshing] = useState(false);  
  
  useEffect(() => {  
    if (user?.flatId) {  
      loadTasks();  
      checkRotations(user.flatId);  
    }  
  }, [user?.flatId]);  
  
  const loadTasks = async () => {  
    if (!user?.flatId) return;  
    try {  
      await fetchTasks(user.flatId);  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    }  
  };  
  
  const handleCompleteTask = async (taskId: string) => {  
    if (!user?.flatId || !user?.uid) return;  
          
    try {  
      await completeTask(user.flatId, taskId, user.uid);  
      Alert.alert('¡Bien hecho!', 'Has completado la tarea y ganado puntos');  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    }  
  };  
  
  const renderTask = ({ item }: { item: any }) => {  
    const isMyTask = item.assignedTo === user?.uid;  
    const isOverdue = item.status === 'overdue';  
      
    return (  
      <View style={[styles.taskCard, isOverdue && styles.overdueCard]}>  
        <View style={styles.taskHeader}>  
          <Text style={styles.taskName}>{item.name}</Text>  
          <Text style={styles.taskPoints}>+{item.points} pts</Text>  
        </View>  
              
        <Text style={styles.taskCategory}>{item.category}</Text>  
        <Text style={styles.taskDueDate}>  
          Vence: {item.dueDate.toLocaleDateString()}  
        </Text>  
  
        {isMyTask && (  
          <TouchableOpacity  
            style={styles.completeButton}  
            onPress={() => handleCompleteTask(item.id)}  
          >  
            <Text style={styles.completeButtonText}>Marcar como hecha</Text>  
          </TouchableOpacity>  
        )}  
  
        {!isMyTask && (  
          <Text style={styles.assignedText}>  
            Asignada a otro miembro  
          </Text>  
        )}  
      </View>  
    );  
  };  
  
  if (loading && tasks.length === 0) {  
    return (  
      <View style={styles.centerContainer}>  
        <ActivityIndicator size="large" color={colors.primary} />  
      </View>  
    );  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.title}>Tareas del Piso</Text>  
        <TouchableOpacity  
          style={styles.addButton}  
          onPress={() => navigation.navigate('CreateTask')}  
        >  
          <Text style={styles.addButtonText}>+ Nueva Tarea</Text>  
        </TouchableOpacity>  
      </View>  
  
      <FlatList  
        data={tasks}  
        renderItem={renderTask}  
        keyExtractor={(item) => item.id}  
        contentContainerStyle={styles.listContainer}  
        refreshing={refreshing}  
        onRefresh={async () => {  
          setRefreshing(true);  
          await loadTasks();  
          setRefreshing(false);  
        }}  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Text style={styles.emptyText}>No hay tareas pendientes</Text>  
          </View>  
        }  
      />  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: colors.background, // Transparente para mostrar gradiente  
  },  
  centerContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: colors.background,  
  },  
  header: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    padding: spacing.lg,  
    backgroundColor: colors.backgroundGlass, // Glass transparente  
    borderBottomWidth: 1,  
    borderBottomColor: colors.border,  
  },  
  title: {  
    fontSize: typography.fontSize.xxl,  
    fontWeight: typography.fontWeight.semibold,  
    color: colors.textOnGradient, // Blanco sobre glass  
  },  
  addButton: {  
    backgroundColor: colors.primary, // Turquesa  
    paddingHorizontal: spacing.md,  
    paddingVertical: spacing.sm,  
    borderRadius: borderRadius.lg,  
    ...shadows.base,  
  },  
  addButtonText: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontSize: 14,  
    fontWeight: '600',  
  },  
  listContainer: {  
    padding: spacing.md,  
  },  
  taskCard: {  
    backgroundColor: colors.backgroundCard, // Glass más opaco  
    borderRadius: borderRadius.xxl,  
    borderWidth: 1,  
    borderColor: colors.border,  
    padding: spacing.base,  
    marginBottom: spacing.md,  
    ...shadows.glass,  
  },  
  overdueCard: {  
    borderLeftWidth: 4,  
    borderLeftColor: colors.error,  
  },  
  taskHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: spacing.sm,  
  },  
  taskName: {  
    fontSize: 18,  
    fontWeight: '600',  
    color: colors.textOnGradient, // Blanco sobre glass  
    flex: 1,  
  },  
  taskPoints: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: colors.secondary, // Verde lima para destacar  
  },  
  taskCategory: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre glass  
    marginBottom: 4,  
    textTransform: 'capitalize',  
    opacity: 0.9,  
  },  
  taskDueDate: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre glass  
    marginBottom: spacing.sm,  
    opacity: 0.8,  
  },  
  completeButton: {  
    backgroundColor: colors.secondary, // Verde lima  
    borderRadius: borderRadius.lg,  
    padding: spacing.sm,  
    alignItems: 'center',  
    ...shadows.base,  
  },  
  completeButtonText: {  
    color: colors.textPrimary, // Texto oscuro sobre verde lima  
    fontSize: 14,  
    fontWeight: '600',  
  },  
  assignedText: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre glass  
    fontStyle: 'italic',  
    opacity: 0.8,  
  },  
  emptyContainer: {  
    padding: spacing.xl,  
    alignItems: 'center',  
  },  
  emptyText: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    opacity: 0.8,  
  },  
});