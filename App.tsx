import React, { useEffect } from 'react';      
import { StatusBar, useColorScheme, Alert, Platform } from 'react-native';      
import { SafeAreaProvider } from 'react-native-safe-area-context';      
import { NavigationContainer } from '@react-navigation/native';      
import { createNativeStackNavigator } from '@react-navigation/native-stack';      
import messaging from '@react-native-firebase/messaging';    
import { PermissionsAndroid } from 'react-native';    
    
import HomeScreen from './src/screens/HomeScreen';    
import ProfileScreen from './src/screens/ProfileScreen';    
import LoginScreen from './src/screens/LoginScreen';    
import OnboardingScreen from './src/screens/OnboardingScreen';    
import CreateFlatScreen from './src/screens/CreateFlatScreen';    
import JoinFlatScreen from './src/screens/JoinFlatScreen';    
import TasksScreen from './src/screens/TasksScreen';  // NUEVO  
import CreateTaskScreen from './src/screens/CreateTaskScreen';  // NUEVO  
import { useAuthStore } from './src/store/authStore';    
import firestore from '@react-native-firebase/firestore';    
    
export type RootStackParamList = {    
  Login: undefined;    
  Onboarding: undefined;    
  CreateFlat: undefined;    
  JoinFlat: undefined;    
  Home: undefined;    
  Profile: undefined;    
  Tasks: undefined;  // NUEVO  
  CreateTask: undefined;  // NUEVO  
};    
    
const Stack = createNativeStackNavigator<RootStackParamList>();    
    
function App() {    
  const isDarkMode = useColorScheme() === 'dark';    
  const { user } = useAuthStore();    
    
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
    requestNotificationPermission();    
    
    // Cleanup    
    return () => {    
      unsubscribeTokenRefresh();    
      unsubscribeForeground();    
    };    
  }, [user?.uid]);    
    
  return (    
    <SafeAreaProvider>    
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />    
      <NavigationContainer>    
        <Stack.Navigator initialRouteName="Login">    
          <Stack.Screen    
            name="Login"    
            component={LoginScreen}    
            options={{ headerShown: false }}    
          />    
          <Stack.Screen    
            name="Onboarding"    
            component={OnboardingScreen}    
            options={{ headerShown: false }}    
          />    
          <Stack.Screen    
            name="CreateFlat"    
            component={CreateFlatScreen}    
            options={{ title: 'Crear Piso' }}    
          />    
          <Stack.Screen    
            name="JoinFlat"    
            component={JoinFlatScreen}    
            options={{ title: 'Unirse a Piso' }}    
          />    
          <Stack.Screen     
            name="Home"     
            component={HomeScreen}    
            options={{ title: 'Inicio' }}    
          />    
          <Stack.Screen     
            name="Profile"     
            component={ProfileScreen}    
            options={{ title: 'Perfil' }}    
          />    
          <Stack.Screen     
            name="Tasks"     
            component={TasksScreen}    
            options={{ title: 'Tareas' }}    
          />    
          <Stack.Screen     
            name="CreateTask"     
            component={CreateTaskScreen}    
            options={{ title: 'Crear Tarea' }}    
          />    
        </Stack.Navigator>    
      </NavigationContainer>    
    </SafeAreaProvider>    
  );    
}    
    
export default App;