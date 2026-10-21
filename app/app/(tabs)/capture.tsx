import { useCallback, useState } from 'react';
import { Alert, AppState, FlatList, Platform, Pressable, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';

import { Text, View } from '@/components/Themed';
import * as Collector from '@/modules/notification-collector';
import type { CaptureRecord } from '@/modules/notification-collector';

const KNOWN_APPS: Record<string, string> = {
  'com.bcp.innovacxion.yapeapp': 'Yape',
  'pe.com.plin': 'Plin',
  'com.google.android.apps.walletnfcrel': 'Google Wallet',
  'com.bcp.bank': 'BCP',
  'com.bbva.pe': 'BBVA',
  'pe.com.interbank.mobilebanking': 'Interbank',
  'com.mercadopago.wallet': 'Mercado Pago',
};

function appLabel(pkg: string): string {
  return KNOWN_APPS[pkg] ?? pkg;
}

// El export solo incluye paquetes bancarios conocidos (lista cerrada): el
// corpus puede tener notificaciones personales (WhatsApp, SMS) que no deben
// compartirse. Si aparece un banco con paquete desconocido, se agrega a
// KNOWN_APPS — la lista de la pantalla muestra todas las capturas.
function isBankPackage(pkg: string): boolean {
  return pkg in KNOWN_APPS;
}

export default function CaptureScreen() {
  const [granted, setGranted] = useState(false);
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const list = await Collector.listCaptures();
    setCaptures(list.reverse());
    setGranted(Collector.isGranted());
  }, []);

  // Carga inicial + relectura al volver de los ajustes de Android:
  // el tab sigue con foco de navegación, así que también escuchamos
  // el retorno de la app a primer plano (AppState → active).
  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => sub.remove();
    }, [refresh]),
  );

  if (!Collector.isSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Captura de notificaciones</Text>
        <Text style={styles.muted}>
          El colector solo está disponible en un build nativo de Android
          (dev client). En {Platform.OS === 'ios' ? 'iOS' : 'esta plataforma'} no
          hay API para leer notificaciones de otras apps.
        </Text>
      </View>
    );
  }

  const onExport = async () => {
    // Releer en el momento: pueden haber llegado notificaciones con la pantalla abierta.
    const corpus = (await Collector.listCaptures()).filter((c) =>
      isBankPackage(c.packageName),
    );
    if (corpus.length === 0) {
      Alert.alert(
        'Sin capturas bancarias',
        'Todavía no hay notificaciones de Yape/Plin/bancos/wallets para exportar.',
      );
      return;
    }
    // Se exporta un archivo filtrado, no el JSONL crudo con notificaciones personales.
    const out = new File(Paths.cache, 'corpus-notificaciones.jsonl');
    if (out.exists) out.delete();
    out.create();
    await out.write(corpus.map((c) => JSON.stringify(c)).join('\n') + '\n');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(out.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar corpus de notificaciones',
      });
    }
  };

  const onClear = async () => {
    await Collector.clearCaptures();
    await refresh();
  };

  const onOpenSettings = async () => {
    setLoading(true);
    Collector.openListenerSettings();
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          Acceso a notificaciones: {granted ? 'concedido' : 'pendiente'}
        </Text>
        {!granted && (
          <Pressable style={styles.button} onPress={onOpenSettings} disabled={loading}>
            <Text style={styles.buttonText}>Abrir ajustes</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.button} onPress={onExport}>
          <Text style={styles.buttonText}>Exportar JSONL</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onClear}>
          <Text style={styles.buttonText}>Limpiar</Text>
        </Pressable>
      </View>

      <Text style={styles.muted}>
        {captures.length} notificaciones capturadas
      </Text>

      <FlatList
        data={captures}
        keyExtractor={(item, i) =>
          `${item.packageName}-${item.postTime}-${item.receivedAt}-${i}`
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardApp}>
              {appLabel(item.packageName)}
              <Text style={styles.muted}>
                {' '}
                · {new Date(item.postTime).toLocaleString()}
              </Text>
            </Text>
            {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
            {item.bigText || item.text ? (
              <Text style={styles.cardBody}>{item.bigText ?? item.text}</Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.muted}>
            Sin capturas. Pide un Yape/Plin de prueba o genera notificaciones de
            bancos y vuelve a esta pantalla.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  muted: {
    opacity: 0.6,
    fontSize: 13,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonSecondary: {
    backgroundColor: '#8a8a8e',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#999',
  },
  cardApp: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  cardBody: {
    fontSize: 13,
    marginTop: 2,
  },
});
