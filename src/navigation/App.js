import LoginSignedUp from '../screens/loginSignedUp';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="LoginSignedUp">
      <Stack.Screen 
        name="LoginSignedUp" 
        component={LoginSignedUp}
        options={{ headerShown: false }}
      />
      {/* Outras telas comentadas por enquanto */}
    </Stack.Navigator>
  );
}