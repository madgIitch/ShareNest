import React, { useEffect, useState } from 'react';            
import { StatusBar, Alert, Platform, ActivityIndicator, View, StyleSheet } from 'react-native';            
import { SafeAreaProvider } from 'react-native-safe-area-context';            
import { NavigationContainer } from '@react-navigation/native';            
import { createNativeStackNavigator } from '@react-navigation/native-stack';            
import { LinearGradient } from 'expo-linear-gradient';
import messaging from '@react-native-firebase/messaging';          
import auth from '@react-native-firebase/auth';            
import firestore from '@react-native-firebase/firestore';          
import { PermissionsAndroid } from 'react-native';          
import { colors } from './src/theme';          
          
import HomeScreen from './src/screens/HomeScreen';          
import ProfileScreen from './src/screens/ProfileScreen';          
import LoginScreen from './src/screens/LoginScreen';          
import OnboardingScreen from './src/screens/OnboardingScreen';          
import CreateFlatScreen from './src/screens/CreateFlatScreen';          
import JoinFlatScreen from './src/screens/JoinFlatScreen';          
import TasksScreen from './src/screens/TasksScreen';      
import CreateTaskScreen from './src/screens/CreateTaskScreen';      
import ExpensesScreen from './src/screens/ExpensesScreen';      
import CreateExpenseScreen from './src/screens/CreateExpenseScreen';      
import { useAuthStore } from './src/store/authStore';          
          
export type RootStackParamList = {          
  Login: undefined;          
  Onboarding: undefined;          
  CreateFlat: undefined;          
  JoinFlat: undefined;          
  Home: undefined;          
  Profile: undefined;          
  Tasks: undefined;      
  CreateTask: undefined;      
  Expenses: undefined;      
  CreateExpense: undefined;      
};          
          
const Stack = createNativeStackNavigator<RootStackParamList>();          
          
function App() {          
  const { user, setUser } = useAuthStore();            
  const [initializing, setInitializing] = useState(true);            
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');            
          
  useEffect(() => {    
    const unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {    
      if (firebaseUser) {    
        try {    
          const userDoc = await firestore()    
            .collection('users')    
            .doc(firebaseUser.uid)    
            .get();    
              
          const userData = userDoc.data();    
              
          setUser({    
            uid: firebaseUser.uid,    
            email: firebaseUser.email || '',    
            flatId: userData?.flatId,    
            isAdmin: userData?.isAdmin,    
          });    
    
          if (userData?.flatId) {    
            setInitialRoute('Home');    
          } else {    
            setInitialRoute('Onboarding');    
          }    
        } catch (error) {    
          console.error('Error cargando datos del usuario:', error);    
          setInitialRoute('Login');    
        }    
      } else {    
        setUser(null);    
        setInitialRoute('Login');    
      }    
          
      setInitializing(false);    
    });    
    
    return unsubscribeAuth;    
  }, [setUser]);  // Added setUser to dependencies  
    
  useEffect(() => {          
    const requestNotificationPermission = async () => {          
      if (Platform.OS === 'android' && Platform.Version >= 33) {          
        const granted = await PermissionsAndroid.request(          
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS          
        );          
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {          
          console.log('Permiso de notificaciones denegado');          
          return;          
        }          
      }          
          
      const authStatus = await messaging().requestPermission();          
      const enabled =          
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||          
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;          
          
      if (enabled) {          
        console.log('Permisos de notificaciones concedidos');          
        await getFCMToken();          
      }          
    };          
          
    const getFCMToken = async () => {          
      try {          
        const token = await messaging().getToken();          
        console.log('FCM Token:', token);          
                  
        if (user?.uid && token) {          
          await firestore()          
            .collection('users')          
            .doc(user.uid)          
            .set({          
              fcmToken: token,          
              fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),          
            }, { merge: true });          
          console.log('Token FCM guardado en Firestore');          
        }          
      } catch (error) {          
        console.error('Error obteniendo FCM token:', error);          
      }          
    };          
          
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {          
      console.log('Token FCM actualizado:', token);          
      if (user?.uid) {          
        await firestore()          
          .collection('users')          
          .doc(user.uid)          
          .set({          
            fcmToken: token,          
            fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),          
          }, { merge: true });          
      }          
    });          
          
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {          
      console.log('Notificación recibida en primer plano:', remoteMessage);          
      Alert.alert(          
        remoteMessage.notification?.title || 'Notificación',          
        remoteMessage.notification?.body || ''          
      );          
    });          
          
    if (user?.uid) {    
      requestNotificationPermission();          
    }    
          
    return () => {          
      unsubscribeTokenRefresh();          
      unsubscribeForeground();          
    };          
  }, [user?.uid]);          
    
  if (initializing) {    
    return (    
      <LinearGradient  
        colors={[colors.gradientStart, colors.gradientEnd]}  
        start={{ x: 0, y: 0 }}  
        end={{ x: 1, y: 1 }}  
        style={styles.container}  
      >  
        <View style={styles.loadingContainer}>    
          <ActivityIndicator size="large" color="#007AFF" />    
        </View>    
      </LinearGradient>  
    );    
  }          
          
  return (        
    <SafeAreaProvider>        
      <StatusBar barStyle="light-content" />        
      <LinearGradient  
        colors={[colors.gradientStart, colors.gradientEnd]}  
        start={{ x: 0, y: 0 }}  
        end={{ x: 1, y: 1 }}  
        style={styles.container}  
      >  
        <NavigationContainer>        
          <Stack.Navigator initialRouteName={initialRoute}>    
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />    
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />    
            <Stack.Screen name="CreateFlat" component={CreateFlatScreen} options={{ title: 'Crear Piso' }} />    
            <Stack.Screen name="JoinFlat" component={JoinFlatScreen} options={{ title: 'Unirse a Piso' }} />    
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />    
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />    
            <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Tareas' }} />    
            <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Crear Tarea' }} />    
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Gastos' }} />    
            <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} options={{ title: 'Añadir Gasto' }} />    
          </Stack.Navigator>        
        </NavigationContainer>  
      </LinearGradient>  
    </SafeAreaProvider>        
);          
}          
          
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
  },  
  loadingContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
});  
          
export default App;