document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const totalExpensesEl = document.getElementById('total-expenses');
    const currentBalanceInput = document.getElementById('current-balance');
    const displayCurrentBalance = document.getElementById('display-current-balance');

    let expenses = [];
    let currentBalance = parseFloat(currentBalanceInput.value) || 0;

    function renderExpenses() {
        expenseList.innerHTML = '';
        let totalCredits = 0;
        let totalDebits = 0;

        expenses.forEach((expense, index) => {
            if (expense.type === 'credit') {
                totalCredits += expense.amount;
            } else if (expense.type === 'debit') {
                totalDebits += expense.amount;
            }
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${expense.description}</strong> - $${expense.amount.toFixed(2)} (${expense.type}) 
                    <span>(${expense.date})</span>
                </div>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
            expenseList.appendChild(li);
        });

        displayCurrentBalance.textContent = currentBalance.toFixed(2);
        const totalBalance = currentBalance + totalCredits - totalDebits;
        totalExpensesEl.textContent = totalBalance.toFixed(2);
    }

    currentBalanceInput.addEventListener('change', () => {
        const value = parseFloat(currentBalanceInput.value);
        if (!isNaN(value) && value >= 0) {
            currentBalance = value;
            renderExpenses();
        } else {
            currentBalanceInput.value = currentBalance.toFixed(2);
        }
    });

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const type = document.getElementById('transaction-type').value;

        if (description && !isNaN(amount) && amount > 0 && date && (type === 'credit' || type === 'debit')) {
            expenses.push({ description, amount, date, type });
            renderExpenses();
            expenseForm.reset();
        }
    });

    expenseList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.getAttribute('data-index');
            expenses.splice(index, 1);
            renderExpenses();
        }
    });

    renderExpenses();
});
