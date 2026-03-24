let addExpenseRequested = false;

export function requestHouseholdAddExpense() {
  addExpenseRequested = true;
}

export function consumeHouseholdAddExpenseRequest() {
  if (!addExpenseRequested) return false;
  addExpenseRequested = false;
  return true;
}

