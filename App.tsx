import React, { useEffect, useState } from 'react';          
import { StatusBar, useColorScheme, Alert, Platform, ActivityIndicator, View } from 'react-native';          
import { SafeAreaProvider } from 'react-native-safe-area-context';          
import { NavigationContainer } from '@react-navigation/native';          
import { createNativeStackNavigator } from '@react-navigation/native-stack';          
import messaging from '@react-native-firebase/messaging';        
import auth from '@react-native-firebase/auth';  // NUEVO  
import firestore from '@react-native-firebase/firestore';        
import { PermissionsAndroid } from 'react-native';        
        
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
  const isDarkMode = useColorScheme() === 'dark';        
  const { user, setUser } = useAuthStore();  // MODIFICADO: agregado setUser  
  const [initializing, setInitializing] = useState(true);  // NUEVO  
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');  // NUEVO  
        
  // NUEVO: Listener de autenticación para persistencia de sesión  
  useEffect(() => {  
    const unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {  
      if (firebaseUser) {  
        // Usuario autenticado - cargar datos desde Firestore  
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
  
          // Determinar ruta inicial según si tiene flatId  
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
        // No hay usuario autenticado  
        setUser(null);  
        setInitialRoute('Login');  
      }  
        
      setInitializing(false);  
    });  
  
    return unsubscribeAuth;  
  }, []);  
  
  useEffect(() => {        
    // Solicitar permisos de notificaciones        
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
        
    // Obtener y guardar el FCM token        
    const getFCMToken = async () => {        
      try {        
        const token = await messaging().getToken();        
        console.log('FCM Token:', token);        
                
        // Guardar token en Firestore si hay usuario autenticado        
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
        
    // Listener para cuando el token se actualiza        
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
        
    // Listener para notificaciones en primer plano        
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {        
      console.log('Notificación recibida en primer plano:', remoteMessage);        
      Alert.alert(        
        remoteMessage.notification?.title || 'Notificación',        
        remoteMessage.notification?.body || ''        
      );        
    });        
        
    // Inicializar permisos y token        
    if (user?.uid) {  
      requestNotificationPermission();        
    }  
        
    // Cleanup        
    return () => {        
      unsubscribeTokenRefresh();        
      unsubscribeForeground();        
    };        
  }, [user?.uid]);        
  
  // NUEVO: Mostrar loading mientras se verifica la sesión  
  if (initializing) {  
    return (  
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>  
        <ActivityIndicator size="large" color="#007AFF" />  
      </View>  
    );  
  }  
        
  return (      
  <SafeAreaProvider>      
    <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />      
    {initializing ? (  
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>  
        <ActivityIndicator size="large" color="#007AFF" />  
      </View>  
    ) : (  
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
    )}  
  </SafeAreaProvider>      
);        
}        
        
export default App;