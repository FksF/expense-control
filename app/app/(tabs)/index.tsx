import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { DEFAULT_CATEGORIES } from '@/src/categorization/seed';
import {
  getTransactions,
  initStore,
  removeExpense,
  subscribe,
} from '@/src/data/store';
import type { Transaction } from '@/src/data/schema';
import { monthKey, monthLabel, monthTotals, shiftMonth } from '@/src/data/summary';
import { formatMoney } from '@/src/ui/format';

const CATEGORY_NAMES = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c.name]));

export default function ExpensesScreen() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [all, setAll] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      void initStore().then(() => setAll(getTransactions()));
      const unsub = subscribe(() => setAll(getTransactions()));
      return unsub;
    }, []),
  );

  const txs = useMemo(
    () =>
      all
        .filter(
          (t) =>
            t.status !== 'dismissed' &&
            monthKey(new Date(t.occurredAt)) === month,
        )
        .sort((a, b) => b.occurredAt - a.occurredAt),
    [all, month],
  );

  const totals = useMemo(() => monthTotals(all, month), [all, month]);

  const onDelete = (tx: Transaction) => {
    Alert.alert('Eliminar gasto', `¿Eliminar "${tx.counterparty}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void removeExpense(tx.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))} style={styles.monthNav}>
          <Text style={styles.monthNavText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel(month)}</Text>
        <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))} style={styles.monthNav}>
          <Text style={styles.monthNavText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Gastos</Text>
          <Text style={[styles.totalValue, styles.expenseColor]}>
            {formatMoney(totals.expenses, 'PEN')}
          </Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Ingresos</Text>
          <Text style={[styles.totalValue, styles.incomeColor]}>
            {formatMoney(totals.income, 'PEN')}
          </Text>
        </View>
      </View>

      <FlatList
        data={txs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onLongPress={() => onDelete(item)}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.counterparty}</Text>
              <Text style={styles.muted}>
                {CATEGORY_NAMES.get(item.categoryId ?? '') ?? 'Sin categoría'} ·{' '}
                {new Date(item.occurredAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={[
                styles.cardAmount,
                item.direction === 'in' ? styles.incomeColor : styles.expenseColor,
              ]}>
              {item.direction === 'in' ? '+' : '-'}
              {formatMoney(item.amount, item.currency)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.muted}>
            Sin gastos este mes. Pulsa + para registrar uno manual.
          </Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push('/add-expense')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthNav: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  monthNavText: {
    fontSize: 24,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  totalBox: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 10,
    padding: 12,
  },
  totalLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  expenseColor: {
    color: '#d64545',
  },
  incomeColor: {
    color: '#2e9e5b',
  },
  muted: {
    opacity: 0.6,
    fontSize: 13,
    marginVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#999',
  },
  cardMain: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f95dc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
  },
});
