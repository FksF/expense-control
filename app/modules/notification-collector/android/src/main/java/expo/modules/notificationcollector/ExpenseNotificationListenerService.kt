package expo.modules.notificationcollector

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Fase 0 (corpus): captura TODA notificación del teléfono en un JSONL local.
 * En fases posteriores el servicio solo capturará los paquetes configurados
 * (Yape, Plin, bancos, wallets) y alimentará el pipeline de parsing.
 */
class ExpenseNotificationListenerService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    runCatching { CaptureStore.record(this, sbn) }
  }
}
