import { Stack } from 'expo-router';
import index from './index';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown:false}} >
      <Stack.Screen name="bio" />
    </Stack>
  );
}
