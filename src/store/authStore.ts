import { create } from 'zustand';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface User {
  uid: string;
  email: string;
  flatId?: string;
  isAdmin?: boolean;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,

  signUp: async (email, password) => {
    set({ loading: true });
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      // Crear documento de usuario en Firestore
      await firestore().collection('users').doc(uid).set({
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      set({ user: { uid, email }, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signIn: async (email, password) => {  
  set({ loading: true });  
  try {  
    const userCredential = await auth().signInWithEmailAndPassword(email, password);  
    const uid = userCredential.user.uid;  
  
    // Obtener datos del usuario desde Firestore  
    const userDoc = await firestore().collection('users').doc(uid).get();  
    const userData = userDoc.data();  
  
    // Obtener y guardar FCM token  
    try {  
      const fcmToken = await messaging().getToken();  
      await firestore().collection('users').doc(uid).update({  
        fcmToken,  
        fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),  
      });  
    } catch (error) {  
      console.error('Error guardando FCM token:', error);  
    }  
  
    set({  
      user: {  
        uid,  
        email,  
        flatId: userData?.flatId,  
        isAdmin: userData?.isAdmin  
      },  
      loading: false  
    });  
  } catch (error) {  
    set({ loading: false });  
    throw error;  
    }  
  },

  signOut: async () => {
    await auth().signOut();
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));