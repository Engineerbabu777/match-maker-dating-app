import { Stack } from 'expo-router';
import Index from './index';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown:false}} >
      <Stack.Screen component={Index} />
    </Stack>
  );
}
