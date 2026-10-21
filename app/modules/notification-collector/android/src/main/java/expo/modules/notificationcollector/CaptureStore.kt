package expo.modules.notificationcollector

import android.app.Notification
import android.content.Context
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Persistencia del colector: cada notificación se serializa como una línea JSON
 * en filesDir/notification-captures.jsonl. Sobrevive aunque la app JS no esté
 * corriendo; el buffer lo lee el módulo a demanda.
 */
object CaptureStore {
  const val FILE_NAME = "notification-captures.jsonl"
  // Tope de seguridad para no crecer sin límite en el teléfono del usuario.
  const val MAX_LINES = 5000
  // El trim (lectura completa del archivo) solo corre cada N notificaciones,
  // no en cada callback del listener.
  private const val TRIM_CHECK_INTERVAL = 100
  private var linesSinceCheck = 0

  fun file(context: Context): File = File(context.filesDir, FILE_NAME)

  @Synchronized
  fun record(context: Context, sbn: StatusBarNotification) {
    val extras = sbn.notification?.extras
    val record = JSONObject()
    record.put("packageName", sbn.packageName)
    record.put("postTime", sbn.postTime)
    record.put("receivedAt", System.currentTimeMillis())
    record.put("key", sbn.key)
    record.put("groupKey", sbn.groupKey)
    record.put("isOngoing", sbn.isOngoing)
    record.put("isClearable", sbn.isClearable)
    if (extras != null) {
      record.put("title", extras.getCharSequence(Notification.EXTRA_TITLE)?.toString())
      record.put("text", extras.getCharSequence(Notification.EXTRA_TEXT)?.toString())
      record.put("bigText", extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString())
      record.put("subText", extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString())
      record.put("infoText", extras.getCharSequence(Notification.EXTRA_INFO_TEXT)?.toString())
      record.put("summaryText", extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)?.toString())
      record.put("titleBig", extras.getCharSequence(Notification.EXTRA_TITLE_BIG)?.toString())
      extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.let { lines ->
        val arr = JSONArray()
        lines.forEach { arr.put(it?.toString()) }
        record.put("textLines", arr)
      }
    }
    val f = file(context)
    f.appendText(record.toString() + "\n")
    if (++linesSinceCheck >= TRIM_CHECK_INTERVAL) {
      linesSinceCheck = 0
      trimIfNeeded(f)
    }
  }

  @Synchronized
  fun read(context: Context): String {
    val f = file(context)
    return if (f.exists()) f.readText() else ""
  }

  @Synchronized
  fun clear(context: Context) {
    file(context).delete()
    linesSinceCheck = 0
  }

  private fun trimIfNeeded(f: File) {
    val lines = f.readLines()
    if (lines.size > MAX_LINES) {
      f.writeText(lines.takeLast(MAX_LINES).joinToString("\n") + "\n")
    }
  }
}
