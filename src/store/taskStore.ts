import { create } from 'zustand';  
import firestore from '@react-native-firebase/firestore';  
  
interface Task {  
  id: string;  
  name: string;  
  type: 'predefined' | 'custom';  
  category: string;  
  assignedTo: string;  
  status: 'pending' | 'completed' | 'overdue';  
  dueDate: Date;  
  completedAt?: Date;  
  points: number;  
}  
  
interface TaskStore {  
  tasks: Task[];  
  loading: boolean;  
  fetchTasks: (flatId: string) => Promise<void>;  
  createTask: (flatId: string, task: Omit<Task, 'id'>) => Promise<void>;  
  completeTask: (flatId: string, taskId: string, userId: string) => Promise<void>;  
  checkRotations: (flatId: string) => Promise<void>;  
}  
  
export const useTaskStore = create<TaskStore>((set, get) => ({  
  tasks: [],  
  loading: false,  
  
  fetchTasks: async (flatId) => {  
    set({ loading: true });  
    try {  
      const tasksSnapshot = await firestore()  
        .collection('flats')  
        .doc(flatId)  
        .collection('tasks')  
        .where('status', '!=', 'completed')  
        .orderBy('status')  
        .orderBy('dueDate')  
        .get();  
  
      const tasks = tasksSnapshot.docs.map(doc => ({  
        id: doc.id,  
        ...doc.data(),  
        dueDate: doc.data().dueDate.toDate(),  
      })) as Task[];  
  
      set({ tasks, loading: false });  
    } catch (error) {  
      set({ loading: false });  
      throw error;  
    }  
  },  
  
  createTask: async (flatId, taskData) => {  
    try {  
      await firestore()  
        .collection('flats')  
        .doc(flatId)  
        .collection('tasks')  
        .add({  
          ...taskData,  
          dueDate: firestore.Timestamp.fromDate(taskData.dueDate),  
          createdAt: firestore.FieldValue.serverTimestamp(),  
        });  
  
      // Refrescar lista  
      await get().fetchTasks(flatId);  
    } catch (error) {  
      throw error;  
    }  
  },  
  
  completeTask: async (flatId, taskId, userId) => {  
    try {  
      const taskRef = firestore()  
        .collection('flats')  
        .doc(flatId)  
        .collection('tasks')  
        .doc(taskId);  
  
      const taskDoc = await taskRef.get();  
      const taskData = taskDoc.data();  
  
      // Actualizar tarea  
      await taskRef.update({  
        status: 'completed',  
        completedAt: firestore.FieldValue.serverTimestamp(),  
      });  
  
      // Sumar puntos al usuario  
      await firestore()  
        .collection('users')  
        .doc(userId)  
        .update({  
          points: firestore.FieldValue.increment(taskData?.points || 10),  
        });  
  
      // Refrescar lista  
      await get().fetchTasks(flatId);  
    } catch (error) {  
      throw error;  
    }  
  },  
  
  checkRotations: async (flatId) => {  
    try {  
      const rotationsSnapshot = await firestore()  
        .collection('flats')  
        .doc(flatId)  
        .collection('rotations')  
        .where('nextRotation', '<=', firestore.Timestamp.now())  
        .get();  
  
      for (const rotationDoc of rotationsSnapshot.docs) {  
        const rotation = rotationDoc.data();  
        const nextIndex = (rotation.currentIndex + 1) % rotation.members.length;  
        const nextUserId = rotation.members[nextIndex];  
  
        // Crear nueva tarea para el siguiente usuario  
        await firestore()  
          .collection('flats')  
          .doc(flatId)  
          .collection('tasks')  
          .add({  
            name: rotation.taskType,  
            type: 'predefined',  
            category: rotation.category || 'other',  
            assignedTo: nextUserId,  
            status: 'pending',  
            dueDate: firestore.Timestamp.fromDate(  
              new Date(Date.now() + rotation.rotationDays * 24 * 60 * 60 * 1000)  
            ),  
            points: 10,  
            createdAt: firestore.FieldValue.serverTimestamp(),  
          });  
  
        // Actualizar rotación  
        await rotationDoc.ref.update({  
          currentIndex: nextIndex,  
          lastRotation: firestore.FieldValue.serverTimestamp(),  
          nextRotation: firestore.Timestamp.fromDate(  
            new Date(Date.now() + rotation.rotationDays * 24 * 60 * 60 * 1000)  
          ),  
        });  
      }  
  
      // Refrescar lista  
      await get().fetchTasks(flatId);  
    } catch (error) {  
      throw error;  
    }  
  },  
}));