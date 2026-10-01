import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'https://2ube699efh.execute-api.sa-east-1.amazonaws.com';

export async function logout(userType: 'patient' | 'clinician') {
  try {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      await fetch(`${API_URL}/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, userType, pushToken: null }),
      });
    }
  } catch (err) {
    console.error('logout: falha ao remover push token:', err);
  }
  await AsyncStorage.clear();
}

export async function registerForPushNotificationsAsync(userType: 'patient' | 'clinician') {
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
      projectId: 'bd8a2f36-05ac-400e-8d89-7c2b5173a5e4',
    });

    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return;

    await fetch(`${API_URL}/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: user.id, userType, pushToken: expoPushToken }),
    });
  } catch (err) {
    console.error('registerForPushNotificationsAsync erro:', err);
  }
}
