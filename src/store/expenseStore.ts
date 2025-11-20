import { create } from 'zustand';    
import firestore from '@react-native-firebase/firestore';    
  
interface Expense {    
  id: string;    
  title: string;    
  amount: number;    
  paidBy: string;    
  category: 'papel' | 'limpieza' | 'comida' | 'otro';    
  date: Date;    
  splitBetween: string[];    
  amountPerPerson: number;    
  createdAt: Date;    
  createdBy: string;    
}    
  
interface ExpenseStore {    
  expenses: Expense[];    
  loading: boolean;    
  fetchExpenses: (flatId: string, month?: number, year?: number) => Promise<void>;    
  createExpense: (flatId: string, expense: Omit<Expense, 'id' | 'createdAt' | 'amountPerPerson'>) => Promise<void>;    
  getMonthlyTotal: (flatId: string, userId: string, month: number, year: number) => Promise<number>;    
}    
  
export const useExpenseStore = create<ExpenseStore>((set, get) => ({    
  expenses: [],    
  loading: false,    
  
  fetchExpenses: async (flatId, month, year) => {    
    set({ loading: true });    
    try {    
      let query = firestore()    
        .collection('flats')    
        .doc(flatId)    
        .collection('expenses')    
        .orderBy('date', 'desc');    
  
      // Filtrar por mes si se proporciona    
      if (month !== undefined && year !== undefined) {    
        const startDate = new Date(year, month, 1);    
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);    
          
        query = query    
          .where('date', '>=', firestore.Timestamp.fromDate(startDate))    
          .where('date', '<=', firestore.Timestamp.fromDate(endDate));    
      }    
  
      const expensesSnapshot = await query.get();    
  
      const expenses = expensesSnapshot.docs.map(doc => ({    
        id: doc.id,    
        ...doc.data(),    
        date: doc.data().date.toDate(),    
        createdAt: doc.data().createdAt.toDate(),    
      })) as Expense[];    
  
      set({ expenses, loading: false });    
    } catch (error) {    
      set({ loading: false });    
      throw error;    
    }    
  },    
  
  createExpense: async (flatId, expenseData) => {    
    try {    
      // Calcular el monto por persona    
      const amountPerPerson = expenseData.amount / expenseData.splitBetween.length;    
  
      await firestore()    
        .collection('flats')    
        .doc(flatId)    
        .collection('expenses')    
        .add({    
          ...expenseData,    
          amountPerPerson,    
          date: firestore.Timestamp.fromDate(expenseData.date),    
          createdAt: firestore.FieldValue.serverTimestamp(),    
        });    
  
      // Refrescar lista    
      const now = new Date();    
      await get().fetchExpenses(flatId, now.getMonth(), now.getFullYear());    
    } catch (error) {    
      throw error;    
    }    
  },    
  
  getMonthlyTotal: async (flatId, userId, month, year) => {    
    try {    
      const startDate = new Date(year, month, 1);    
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);    
  
      const expensesSnapshot = await firestore()    
        .collection('flats')    
        .doc(flatId)    
        .collection('expenses')    
        .where('date', '>=', firestore.Timestamp.fromDate(startDate))    
        .where('date', '<=', firestore.Timestamp.fromDate(endDate))    
        .where('splitBetween', 'array-contains', userId)    
        .get();    
  
      let total = 0;    
      expensesSnapshot.docs.forEach(doc => {    
        const data = doc.data();    
        total += data.amountPerPerson;    
      });    
  
      return total;    
    } catch (error) {    
      throw error;    
    }    
  },    
}));