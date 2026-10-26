import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import { DEFAULT_CATEGORIES } from '@/src/categorization/seed';
import { addExpense, suggestCategory } from '@/src/data/store';
import { parseAmount } from '@/src/parsing/amount';

const CURRENCIES = ['PEN', 'USD'];

export default function AddExpenseScreen() {
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [direction, setDirection] = useState<'out' | 'in'>('out');
  const [counterparty, setCounterparty] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  /** true solo si el usuario tocó un chip; la autosugerencia no marca esto. */
  const [userPicked, setUserPicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputColor = useThemeColor({}, 'text');

  const onCounterpartyChange = (text: string) => {
    setCounterparty(text);
    // Si la categoría era autosugerida, se invalida con el nuevo comercio.
    if (!userPicked) setCategoryId(undefined);
  };

  const onCounterpartyEnd = () => {
    if (userPicked || categoryId) return;
    const suggested = suggestCategory(counterparty);
    if (suggested) setCategoryId(suggested);
  };

  const onPickCategory = (id: string) => {
    setUserPicked(true);
    setCategoryId(categoryId === id ? undefined : id);
  };

  const onSave = async () => {
    const amount = parseAmount(amountText);
    if (amount == null || amount <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero, p. ej. 25.90');
      return;
    }
    const name = counterparty.trim() || 'Gasto manual';
    setSaving(true);
    try {
      await addExpense({
        amount,
        currency,
        direction,
        occurredAt: Date.now(),
        counterparty: name,
        categoryId,
        categoryConfirmed: userPicked,
      });
      router.back();
    } catch {
      Alert.alert('No se pudo guardar', 'El gasto no quedó registrado. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Monto</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={[styles.amountInput, { color: inputColor }]}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            autoFocus
          />
          <View style={styles.segment}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.segmentItem, currency === c && styles.segmentActive]}
                onPress={() => setCurrency(c)}>
                <Text style={[styles.segmentText, currency === c && styles.segmentTextActive]}>
                  {c === 'PEN' ? 'S/' : '$'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentItem, direction === 'out' && styles.segmentActive]}
            onPress={() => setDirection('out')}>
            <Text style={[styles.segmentText, direction === 'out' && styles.segmentTextActive]}>
              Gasto
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentItem, direction === 'in' && styles.segmentActive]}
            onPress={() => setDirection('in')}>
            <Text style={[styles.segmentText, direction === 'in' && styles.segmentTextActive]}>
              Ingreso
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Comercio / persona</Text>
        <TextInput
          style={[styles.input, { color: inputColor }]}
          value={counterparty}
          onChangeText={onCounterpartyChange}
          onEndEditing={onCounterpartyEnd}
          placeholder="p. ej. Plaza Vea, María, Uber"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chips}>
          {DEFAULT_CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => onPickCategory(c.id)}>
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.saveDisabled]}
          onPress={onSave}
          disabled={saving}>
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#999',
    paddingVertical: 6,
  },
  input: {
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#2f95dc',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  chipText: {
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2f95dc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
