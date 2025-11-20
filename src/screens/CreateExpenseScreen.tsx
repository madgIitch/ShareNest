import React, { useState } from 'react';  
import {  
  View,  
  Text,  
  TextInput,  
  TouchableOpacity,  
  StyleSheet,  
  Alert,  
  ActivityIndicator,  
  ScrollView,  
} from 'react-native';  
import { NativeStackScreenProps } from '@react-navigation/native-stack';  
import { RootStackParamList } from '../../App';  
import firestore from '@react-native-firebase/firestore';  
import { useAuthStore } from '../store/authStore';  
import { colors, typography, spacing, commonStyles } from '../theme';  
  
type Props = NativeStackScreenProps<RootStackParamList, 'CreateExpense'>;  
  
// Categorías predefinidas de gastos  
const EXPENSE_CATEGORIES = [  
  { id: 'cleaning', label: 'Limpieza', icon: '🧹' },  
  { id: 'paper', label: 'Papel', icon: '🧻' },  
  { id: 'food', label: 'Comida', icon: '🍕' },  
  { id: 'utilities', label: 'Servicios', icon: '💡' },  
  { id: 'other', label: 'Otro', icon: '📝' },  
];  
  
export default function CreateExpenseScreen({ navigation }: Props) {  
  const [title, setTitle] = useState('');  
  const [amount, setAmount] = useState('');  
  const [selectedCategory, setSelectedCategory] = useState('cleaning');  
  const [loading, setLoading] = useState(false);  
  const { user } = useAuthStore();  
  
  const handleCreateExpense = async () => {  
    // Validaciones  
    if (!title.trim()) {  
      Alert.alert('Error', 'Por favor ingresa un título para el gasto');  
      return;  
    }  
  
    const amountNum = parseFloat(amount);  
    if (isNaN(amountNum) || amountNum <= 0) {  
      Alert.alert('Error', 'El monto debe ser mayor a 0');  
      return;  
    }  
  
    if (!user?.flatId) {  
      Alert.alert('Error', 'No estás asociado a ningún piso');  
      return;  
    }  
  
    setLoading(true);  
    try {  
      // Obtener información del piso para calcular el reparto  
      const flatDoc = await firestore()  
        .collection('flats')  
        .doc(user.flatId)  
        .get();  
  
      const flatData = flatDoc.data();  
      if (!flatData || !flatData.members || flatData.members.length === 0) {  
        Alert.alert('Error', 'No hay miembros en el piso');  
        setLoading(false);  
        return;  
      }  
  
      // Calcular el monto por persona (reparto equitativo)  
      const amountPerPerson = amountNum / flatData.members.length;  
  
      // Crear el gasto en la subcolección expenses  
      await firestore()  
        .collection('flats')  
        .doc(user.flatId)  
        .collection('expenses')  
        .add({  
          title: title.trim(),  
          amount: amountNum,  
          category: selectedCategory,  
          paidBy: user.uid,  
          splitBetween: flatData.members,  
          amountPerPerson: amountPerPerson,  
          createdAt: firestore.FieldValue.serverTimestamp(),  
          month: new Date().getMonth() + 1, // 1-12  
          year: new Date().getFullYear(),  
        });  
  
      Alert.alert(  
        'Gasto Registrado',  
        `El gasto "${title}" ha sido registrado exitosamente.\nMonto por persona: €${amountPerPerson.toFixed(2)}`,  
        [{ text: 'OK', onPress: () => navigation.goBack() }]  
      );  
    } catch (error: any) {  
      Alert.alert('Error', error.message);  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.content}>  
        <Text style={styles.title}>Añadir Nuevo Gasto</Text>  
        <Text style={styles.description}>  
          Registra un gasto compartido del piso  
        </Text>  
  
        <Text style={styles.label}>Título del Gasto *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: Compra del supermercado"  
          value={title}  
          onChangeText={setTitle}  
          editable={!loading}  
        />  
  
        <Text style={styles.label}>Monto (€) *</Text>  
        <TextInput  
          style={styles.input}  
          placeholder="Ej: 45.50"  
          value={amount}  
          onChangeText={setAmount}  
          keyboardType="decimal-pad"  
          editable={!loading}  
        />  
  
        <Text style={styles.label}>Categoría *</Text>  
        <View style={styles.categoryContainer}>  
          {EXPENSE_CATEGORIES.map((category) => (  
            <TouchableOpacity  
              key={category.id}  
              style={[  
                styles.categoryButton,  
                selectedCategory === category.id && styles.categoryButtonSelected,  
              ]}  
              onPress={() => setSelectedCategory(category.id)}  
              disabled={loading}  
            >  
              <Text style={styles.categoryIcon}>{category.icon}</Text>  
              <Text  
                style={[  
                  styles.categoryLabel,  
                  selectedCategory === category.id && styles.categoryLabelSelected,  
                ]}  
              >  
                {category.label}  
              </Text>  
            </TouchableOpacity>  
          ))}  
        </View>  
  
        <View style={styles.infoBox}>  
          <Text style={styles.infoText}>  
            💡 El gasto se dividirá automáticamente entre todos los miembros del piso de forma equitativa.  
          </Text>  
        </View>  
  
        <TouchableOpacity  
          style={[styles.button, loading && styles.buttonDisabled]}  
          onPress={handleCreateExpense}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator color="#fff" />  
          ) : (  
            <Text style={styles.buttonText}>Registrar Gasto</Text>  
          )}  
        </TouchableOpacity>  
      </View>  
    </ScrollView>  
  );  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: colors.background,  
  },  
  content: {  
    padding: spacing.lg,  
  },  
  title: {  
    ...typography.h1,  
    marginBottom: spacing.sm,  
  },  
  description: {  
    ...typography.body,  
    color: colors.textSecondary,  
    marginBottom: spacing.xl,  
  },  
  label: {  
    ...typography.label,  
    marginBottom: spacing.xs,  
    marginTop: spacing.sm,  
  },  
  input: {  
    ...commonStyles.input,  
    marginBottom: spacing.sm,  
  },  
  categoryContainer: {  
    flexDirection: 'row',  
    flexWrap: 'wrap',  
    gap: spacing.sm,  
    marginBottom: spacing.md,  
  },  
  categoryButton: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingVertical: spacing.sm,  
    paddingHorizontal: spacing.md,  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: colors.border,  
    backgroundColor: colors.surface,  
  },  
  categoryButtonSelected: {  
    backgroundColor: colors.primary,  
    borderColor: colors.primary,  
  },  
  categoryIcon: {  
    fontSize: 20,  
    marginRight: spacing.xs,  
  },  
  categoryLabel: {  
    ...typography.body,  
    color: colors.text,  
  },  
  categoryLabelSelected: {  
    color: colors.surface,  
    fontWeight: '600',  
  },  
  infoBox: {  
    backgroundColor: colors.info + '20', // 20% opacity  
    borderRadius: 8,  
    padding: spacing.md,  
    marginTop: spacing.lg,  
    marginBottom: spacing.md,  
  },  
  infoText: {  
    ...typography.caption,  
    color: colors.info,  
    lineHeight: 20,  
  },  
  button: {  
    ...commonStyles.button,  
    marginTop: spacing.lg,  
  },  
  buttonDisabled: {  
    opacity: 0.6,  
  },  
  buttonText: {  
    ...commonStyles.buttonText,  
  },  
});