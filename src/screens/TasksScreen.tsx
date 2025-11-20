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
import { colors, typography, spacing, commonStyles } from '../theme';  
  
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
    backgroundColor: colors.background,    
  },    
  centerContainer: {    
    flex: 1,    
    justifyContent: 'center',    
    alignItems: 'center',    
  },    
  header: {    
    flexDirection: 'row',    
    justifyContent: 'space-between',    
    alignItems: 'center',    
    padding: spacing.lg,    
    backgroundColor: colors.surface,    
    borderBottomWidth: 1,    
    borderBottomColor: colors.border,    
  },    
  title: {    
    ...typography.h2,    
    color: colors.text,    
  },    
  addButton: {    
    backgroundColor: colors.primary,    
    paddingHorizontal: spacing.md,    
    paddingVertical: spacing.sm,    
    borderRadius: 8,    
  },    
  addButtonText: {    
    color: colors.surface,    
    fontSize: 14,    
    fontWeight: '600',    
  },    
  listContainer: {    
    padding: spacing.md,    
  },    
  taskCard: {    
    ...commonStyles.card,    
    marginBottom: spacing.md,    
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
    color: colors.text,    
    flex: 1,    
  },    
  taskPoints: {    
    fontSize: 14,    
    fontWeight: '600',    
    color: colors.success,    
  },    
  taskCategory: {    
    ...typography.body,    
    color: colors.textSecondary,    
    marginBottom: 4,    
    textTransform: 'capitalize',    
  },    
  taskDueDate: {    
    ...typography.caption,    
    color: colors.textTertiary,    
    marginBottom: spacing.sm,    
  },    
  completeButton: {    
    backgroundColor: colors.success,    
    borderRadius: 8,    
    padding: spacing.sm,    
    alignItems: 'center',    
  },    
  completeButtonText: {    
    color: colors.surface,    
    fontSize: 14,    
    fontWeight: '600',    
  },    
  assignedText: {    
    ...typography.caption,    
    color: colors.textTertiary,    
    fontStyle: 'italic',    
  },    
  emptyContainer: {    
    padding: spacing.xl,    
    alignItems: 'center',    
  },    
  emptyText: {    
    ...typography.body,    
    color: colors.textTertiary,    
  },    
});