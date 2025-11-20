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
        <ActivityIndicator size="large" color="#007AFF" />  
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
    backgroundColor: '#f5f5f5',  
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
    padding: 20,  
    backgroundColor: '#fff',  
    borderBottomWidth: 1,  
    borderBottomColor: '#ddd',  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  addButton: {  
    backgroundColor: '#007AFF',  
    paddingHorizontal: 15,  
    paddingVertical: 8,  
    borderRadius: 8,  
  },  
  addButtonText: {  
    color: '#fff',  
    fontSize: 14,  
    fontWeight: '600',  
  },  
  listContainer: {  
    padding: 15,  
  },  
  taskCard: {  
    backgroundColor: '#fff',  
    borderRadius: 12,  
    padding: 15,  
    marginBottom: 15,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  overdueCard: {  
    borderLeftWidth: 4,  
    borderLeftColor: '#FF3B30',  
  },  
  taskHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: 8,  
  },  
  taskName: {  
    fontSize: 18,  
    fontWeight: '600',  
    color: '#333',  
    flex: 1,  
  },  
  taskPoints: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: '#34C759',  
  },  
  taskCategory: {  
    fontSize: 14,  
    color: '#666',  
    marginBottom: 4,  
    textTransform: 'capitalize',  
  },  
  taskDueDate: {  
    fontSize: 12,  
    color: '#999',  
    marginBottom: 12,  
  },  
  completeButton: {  
    backgroundColor: '#34C759',  
    borderRadius: 8,  
    padding: 12,  
    alignItems: 'center',  
  },  
  completeButtonText: {  
    color: '#fff',  
    fontSize: 14,  
    fontWeight: '600',  
  },  
  assignedText: {  
    fontSize: 12,  
    color: '#999',  
    fontStyle: 'italic',  
  },  
  emptyContainer: {  
    padding: 40,  
    alignItems: 'center',  
  },  
  emptyText: {  
    fontSize: 16,  
    color: '#999',  
  },  
});