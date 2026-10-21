import { requireOptionalNativeModule } from 'expo';
import type { NotificationCollectorSpec } from './NotificationCollector.types';

// null en plataformas sin el módulo nativo (iOS, web, Expo Go).
export default requireOptionalNativeModule<NotificationCollectorSpec>(
  'NotificationCollector',
);
