import React from 'react';  
import { StatusBar, useColorScheme } from 'react-native';  
import { SafeAreaProvider } from 'react-native-safe-area-context';  
import { NavigationContainer } from '@react-navigation/native';  
import { createNativeStackNavigator } from '@react-navigation/native-stack';  
  
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';  
import LoginScreen from './src/screens/LoginScreen';  
  
export type RootStackParamList = {  
  Login: undefined;  
  Home: undefined;  
  Profile: undefined;  
};  
  
const Stack = createNativeStackNavigator<RootStackParamList>();  
  
function App() {  
  const isDarkMode = useColorScheme() === 'dark';  
  
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
            name="Home"   
            component={HomeScreen}  
            options={{ title: 'Inicio' }}  
          />  
          <Stack.Screen   
            name="Profile"   
            component={ProfileScreen}  
            options={{ title: 'Perfil' }}  
          />  
        </Stack.Navigator>  
      </NavigationContainer>  
    </SafeAreaProvider>  
  );  
}  
  
export default App;