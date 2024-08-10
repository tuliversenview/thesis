// App.tsx

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import IndexScreen from './IndexScreen';
import DetailsScreen from './DetailsScreen';
import LoginScreen from './LoginScreen';
import Home from './Home'
import Map from './Map'
import GlobalProvider from '@/context/globalcontext';
 
const Stack = createStackNavigator();

function App() {
  return (
    <GlobalProvider>
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="Map" component={Map} options={{ title: 'Map', headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'Home', headerShown: false }} />
        <Stack.Screen name="Index" component={IndexScreen} options={{ title: 'Index', headerShown: true }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Details', headerShown: true  }} />
      </Stack.Navigator>
    </NavigationContainer>
    </GlobalProvider>

    
  );
}

export default App;
