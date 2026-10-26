import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { DEFAULT_CATEGORIES } from '@/src/categorization/seed';
import { getTransactions, initStore, subscribe } from '@/src/data/store';
import type { Transaction } from '@/src/data/schema';
import {
  monthKey,
  monthLabel,
  monthTotals,
  shiftMonth,
  totalsByCategory,
} from '@/src/data/summary';
import { formatMoney } from '@/src/ui/format';

export default function BalanceScreen() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [all, setAll] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      void initStore().then(() => setAll(getTransactions()));
      const unsub = subscribe(() => setAll(getTransactions()));
      return unsub;
    }, []),
  );

  const rows = useMemo(
    () => totalsByCategory(all, month, DEFAULT_CATEGORIES),
    [all, month],
  );
  const totals = useMemo(() => monthTotals(all, month), [all, month]);
  const balance = totals.income - totals.expenses;

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

      <View style={styles.balanceBox}>
        <Text style={styles.totalLabel}>Balance del mes</Text>
        <Text
          style={[
            styles.balanceValue,
            balance >= 0 ? styles.incomeColor : styles.expenseColor,
          ]}>
          {formatMoney(balance, 'PEN')}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.categoryId}
        renderItem={({ item }) => {
          const pct =
            totals.expenses > 0 ? Math.round((item.total / totals.expenses) * 100) : 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.muted}>
                  {item.count} {item.count === 1 ? 'operación' : 'operaciones'} · {pct}%
                </Text>
              </View>
              <Text style={styles.cardAmount}>{formatMoney(item.total, 'PEN')}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.muted}>Sin gastos categorizados este mes.</Text>
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
  balanceBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  balanceValue: {
    fontSize: 24,
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
    marginVertical: 4,
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
});
