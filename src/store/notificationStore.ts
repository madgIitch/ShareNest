// src/store/notificationStore.ts
import { create } from 'zustand';
import messaging from '@react-native-firebase/messaging';

interface NotificationStore {
  fcmToken: string | null;
  requestPermission: () => Promise<void>;
  getToken: () => Promise<void>;
}