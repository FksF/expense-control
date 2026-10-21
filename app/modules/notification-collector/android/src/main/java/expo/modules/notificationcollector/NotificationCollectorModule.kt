package expo.modules.notificationcollector

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationCollectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NotificationCollector")

    // ¿El usuario habilitó el acceso a notificaciones para esta app?
    Function("isGranted") {
      val ctx = appContext.reactContext ?: return@Function false
      val flat = Settings.Secure.getString(
        ctx.contentResolver,
        "enabled_notification_listeners",
      ) ?: return@Function false
      val self = ComponentName(ctx, ExpenseNotificationListenerService::class.java)
      flat.split(':').map { ComponentName.unflattenFromString(it) }.any { it == self }
    }

    // Abre los ajustes del sistema donde se concede el permiso.
    Function("openListenerSettings") {
      val ctx = appContext.reactContext ?: return@Function
      ctx.startActivity(
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }

    // Contenido crudo del JSONL de capturas (lo parsea la capa JS).
    AsyncFunction("readCaptures") {
      val ctx = appContext.reactContext ?: return@AsyncFunction ""
      val f = CaptureStore.file(ctx)
      if (f.exists()) f.readText() else ""
    }

    AsyncFunction("clearCaptures") {
      val ctx = appContext.reactContext ?: return@AsyncFunction
      CaptureStore.file(ctx).delete()
    }

    Function("captureFilePath") {
      val ctx = appContext.reactContext ?: return@Function ""
      CaptureStore.file(ctx).absolutePath
    }
  }
}
