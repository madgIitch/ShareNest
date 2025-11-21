import React, { useEffect, useState } from 'react';  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  Alert,  
  ActivityIndicator,  
} from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import { useExpenseStore } from '../store/expenseStore';  
import { useAuthStore } from '../store/authStore';  
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../theme';  
  
type Props = NativeStackScreenProps<RootStackParamList, 'Expenses'>;  
  
export default function ExpensesScreen({ navigation }: Props) {  
  const { user } = useAuthStore();  
  const { expenses, loading, fetchExpenses, getMonthlyTotal } = useExpenseStore();  
  const [refreshing, setRefreshing] = useState(false);  
  const [monthlyTotal, setMonthlyTotal] = useState(0);  
  
  useEffect(() => {  
    if (user?.flatId) {  
      loadExpenses();  
      loadMonthlyTotal();  
    }  
  }, [user?.flatId]);  
  
  const loadExpenses = async () => {  
    if (!user?.flatId) return;  
    try {  
      const now = new Date();  
      await fetchExpenses(user.flatId, now.getMonth(), now.getFullYear());  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    }  
  };  
  
  const loadMonthlyTotal = async () => {  
    if (!user?.flatId || !user?.uid) return;  
    try {  
      const now = new Date();  
      const total = await getMonthlyTotal(user.flatId, user.uid, now.getMonth(), now.getFullYear());  
      setMonthlyTotal(total);  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    }  
  };  
  
  const renderExpense = ({ item }: { item: any }) => {  
    const isPaidByMe = item.paidBy === user?.uid;  
    const categoryEmoji = {  
      papel: '🧻',  
      limpieza: '🧹',  
      comida: '🍕',  
      otro: '📦',  
    }[item.category] || '📦';  
  
    return (  
      <View style={styles.expenseCard}>  
        <View style={styles.expenseHeader}>  
          <Text style={styles.categoryEmoji}>{categoryEmoji}</Text>  
          <View style={styles.expenseInfo}>  
            <Text style={styles.expenseTitle}>{item.title}</Text>  
            <Text style={styles.expenseCategory}>{item.category}</Text>  
          </View>  
          <View style={styles.expenseAmounts}>  
            <Text style={styles.totalAmount}>€{item.amount.toFixed(2)}</Text>  
            <Text style={styles.perPersonAmount}>  
              €{item.amountPerPerson.toFixed(2)}/persona  
            </Text>  
          </View>  
        </View>  
  
        <View style={styles.expenseFooter}>  
          <Text style={styles.expenseDate}>  
            {item.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}  
          </Text>  
          <Text style={[styles.paidByText, isPaidByMe && styles.paidByMeText]}>  
            {isPaidByMe ? 'Pagado por ti' : 'Pagado por otro'}  
          </Text>  
        </View>  
      </View>  
    );  
  };  
  
  if (loading && expenses.length === 0) {  
    return (  
      <View style={styles.centerContainer}>  
        <ActivityIndicator size="large" color={colors.primary} />  
      </View>  
    );  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <View style={styles.summaryCard}>  
          <Text style={styles.summaryLabel}>Tu parte este mes</Text>  
          <Text style={styles.summaryAmount}>€{monthlyTotal.toFixed(2)}</Text>  
        </View>  
        <TouchableOpacity  
          style={styles.addButton}  
          onPress={() => navigation.navigate('CreateExpense')}  
        >  
          <Text style={styles.addButtonText}>+ Nuevo Gasto</Text>  
        </TouchableOpacity>  
      </View>  
  
      <FlatList  
        data={expenses}  
        renderItem={renderExpense}  
        keyExtractor={(item) => item.id}  
        contentContainerStyle={styles.listContainer}  
        refreshing={refreshing}  
        onRefresh={async () => {  
          setRefreshing(true);  
          await loadExpenses();  
          await loadMonthlyTotal();  
          setRefreshing(false);  
        }}  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Text style={styles.emptyText}>No hay gastos registrados este mes</Text>  
          </View>  
        }  
      />  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: colors.background, // Transparente para mostrar gradiente  
  },  
  centerContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: colors.background,  
  },  
  header: {  
    padding: spacing.lg,  
    backgroundColor: colors.backgroundGlass, // Glass transparente  
    borderBottomWidth: 1,  
    borderBottomColor: colors.border,  
  },  
  summaryCard: {  
    backgroundColor: colors.backgroundCard, // Glass más opaco  
    borderRadius: borderRadius.xxl,  
    borderWidth: 1,  
    borderColor: colors.border,  
    padding: spacing.lg,  
    marginBottom: spacing.md,  
    alignItems: 'center',  
    ...shadows.glass,  
  },  
  summaryLabel: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre glass  
    marginBottom: spacing.xs,  
  },  
  summaryAmount: {  
    ...typography.h1,  
    color: colors.textOnGradient, // Blanco sobre glass  
    fontWeight: 'bold',  
  },  
  addButton: {  
    height: 50,  
    backgroundColor: colors.primary, // Turquesa  
    borderRadius: borderRadius.lg,  
    justifyContent: 'center',  
    alignItems: 'center',  
    ...shadows.base,  
  },  
  addButtonText: {  
    color: colors.textInverse, // Blanco sobre turquesa  
    fontSize: typography.fontSize.base,  
    fontWeight: typography.fontWeight.semibold,  
  },  
  listContainer: {  
    padding: spacing.md,  
  },  
  expenseCard: {  
    backgroundColor: colors.backgroundCard, // Glass más opaco  
    borderRadius: borderRadius.xxl,  
    borderWidth: 1,  
    borderColor: colors.border,  
    padding: spacing.base,  
    marginBottom: spacing.md,  
    ...shadows.glass,  
  },  
  expenseHeader: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    marginBottom: spacing.sm,  
  },  
  categoryEmoji: {  
    fontSize: 32,  
    marginRight: spacing.md,  
  },  
  expenseInfo: {  
    flex: 1,  
  },  
  expenseTitle: {  
    ...typography.h3,  
    color: colors.textOnGradient, // Blanco sobre glass  
    marginBottom: spacing.xs,  
  },  
  expenseCategory: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre glass  
    textTransform: 'capitalize',  
    opacity: 0.8,  
  },  
  expenseAmounts: {  
    alignItems: 'flex-end',  
  },  
  totalAmount: {  
    ...typography.h3,  
    color: colors.primary, // Turquesa para destacar  
    marginBottom: spacing.xs,  
  },  
  perPersonAmount: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre glass  
    opacity: 0.8,  
  },  
  expenseFooter: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingTop: spacing.sm,  
    borderTopWidth: 1,  
    borderTopColor: colors.border,  
  },  
  expenseDate: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre glass  
    opacity: 0.8,  
  },  
  paidByText: {  
    ...typography.caption,  
    color: colors.textOnGradient, // Blanco sobre glass  
    opacity: 0.8,  
  },  
  paidByMeText: {  
    color: colors.secondary, // Verde lima para destacar  
    fontWeight: '600',  
    opacity: 1,  
  },  
  emptyContainer: {  
    padding: spacing.xl,  
    alignItems: 'center',  
  },  
  emptyText: {  
    ...typography.body,  
    color: colors.textOnGradient, // Blanco sobre gradiente  
    opacity: 0.8,  
  },  
});