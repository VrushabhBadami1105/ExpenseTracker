document.addEventListener('DOMContentLoaded', () => {
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const transactionForm = document.getElementById('transaction-form');
    const currentBalanceInput = document.getElementById('current-balance-input');
    const authButtonsContainer = document.getElementById('auth-buttons');
    const transactionContainer = document.getElementById('grouped-transactions-container');

    const loggedInUser = localStorage.getItem('loggedInUser');
    let transactions = loggedInUser ? JSON.parse(localStorage.getItem(`transactions_${loggedInUser}`)) || [] : [];

    let initialBalance = parseFloat(currentBalanceInput.textContent) || 0;
    let remainingAmount = initialBalance;
    let editIndex = null;

    function renderAuthButtons() {
        authButtonsContainer.innerHTML = '';
        if (loggedInUser) {
            const signOutBtn = document.createElement('button');
            signOutBtn.textContent = 'Sign Out';
            signOutBtn.id = 'sign-out-btn';
            signOutBtn.addEventListener('click', () => {
                localStorage.removeItem('loggedInUser');
                window.location.href = 'login.html';
            });
            authButtonsContainer.appendChild(signOutBtn);
        } else {
            const loginSignupBtn = document.createElement('button');
            loginSignupBtn.textContent = 'Login/Signup';
            loginSignupBtn.id = 'login-signup-btn';
            loginSignupBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
            authButtonsContainer.appendChild(loginSignupBtn);
        }
    }

    renderAuthButtons();

    function renderTransactions(filteredTransactions = null) {
        transactionContainer.innerHTML = '';
        const txs = filteredTransactions || transactions;
        const sortedTxs = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));

        let cumulativeRemaining = initialBalance;
        const txsWithRemaining = sortedTxs.map(tx => {
            if (tx.type === 'credit') cumulativeRemaining += tx.amount;
            else if (tx.type === 'debit') cumulativeRemaining -= tx.amount;
            return { ...tx, remaining: cumulativeRemaining };
        });

        const grouped = {};
        txsWithRemaining.forEach(tx => {
            const dateKey = tx.date ? tx.date.split('T')[0] : 'Unknown Date';
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(tx);
        });

        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateKey => {
            const group = grouped[dateKey];

            const dateHeading = document.createElement('h3');
            dateHeading.textContent = new Date(dateKey).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            dateHeading.style.marginTop = '20px';
            dateHeading.style.fontWeight = 'bold';
            transactionContainer.appendChild(dateHeading);

            const table = document.createElement('table');
            table.classList.add('transactions-table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '20px';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Description</th>
                    <th>Credit/Debit</th>
                    <th>Amount (₹)</th>
                    <th>Remaining Amount (₹)</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            group.forEach(tx => {
                const txIndex = transactions.findIndex(t =>
                    t.description === tx.description &&
                    t.amount === tx.amount &&
                    t.type === tx.type &&
                    t.date === tx.date
                );

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${tx.description}</td>
                    <td>${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
                    <td>₹${tx.amount.toFixed(2)}</td>
                    <td>₹${tx.remaining.toFixed(2)}</td>
                    <td>
                        <button class="edit-btn" data-index="${txIndex}">Edit</button>
                        <button class="delete-btn" data-index="${txIndex}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            transactionContainer.appendChild(table);
        });

        remainingAmount = cumulativeRemaining;
        currentBalanceInput.textContent = remainingAmount.toFixed(2);
    }

    currentBalanceInput.addEventListener('blur', () => {
        const value = parseFloat(currentBalanceInput.textContent);
        if (!isNaN(value) && value >= 0) {
            initialBalance = value;
            remainingAmount = value;
            renderTransactions();
        } else {
            currentBalanceInput.textContent = initialBalance.toFixed(2);
        }
    });

    currentBalanceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            currentBalanceInput.blur();
        }
    });

    addTransactionBtn.addEventListener('click', () => {
        if (!loggedInUser) {
            alert('Please login first to add transactions.');
            return;
        }
        transactionModal.classList.remove('hidden');
        currentBalanceInput.contentEditable = "false";
    });

    closeModalBtn.addEventListener('click', () => {
        transactionModal.classList.add('hidden');
        transactionForm.reset();
        if (transactions.length === 0) {
            currentBalanceInput.contentEditable = "true";
        }
        editIndex = null;
        transactionForm.querySelector('button[type="submit"]').textContent = 'Add';
    });

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const description = document.getElementById('transaction-description').value.trim();
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const dateInput = document.getElementById('transaction-date').value;
        const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

        if (description && (type === 'credit' || type === 'debit') && !isNaN(amount) && amount > 0 && dateInput) {
            if (editIndex !== null) {
                transactions[editIndex] = { description, type, amount, date };
                editIndex = null;
                transactionForm.querySelector('button[type="submit"]').textContent = 'Add';
            } else {
                transactions.push({ description, type, amount, date });
            }
            localStorage.setItem(`transactions_${loggedInUser}`, JSON.stringify(transactions));
            renderTransactions();
            transactionForm.reset();
            transactionModal.classList.add('hidden');
            currentBalanceInput.contentEditable = "false";
        }
    });

    transactionContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.matches('button')) return;

        const index = parseInt(target.getAttribute('data-index'));
        if (isNaN(index)) return;

        if (target.classList.contains('delete-btn')) {
            transactions.splice(index, 1);
            localStorage.setItem(`transactions_${loggedInUser}`, JSON.stringify(transactions));
            renderTransactions();
            if (transactions.length === 0) {
                currentBalanceInput.contentEditable = "true";
            }
        } else if (target.classList.contains('edit-btn')) {
            const tx = transactions[index];
            if (!tx) return;
            editIndex = index;
            document.getElementById('transaction-description').value = tx.description;
            document.getElementById('transaction-type').value = tx.type;
            document.getElementById('transaction-amount').value = tx.amount;
            document.getElementById('transaction-date').value = tx.date.split('T')[0];
            transactionForm.querySelector('button[type="submit"]').textContent = 'Update';
            transactionModal.classList.remove('hidden');
            currentBalanceInput.contentEditable = "false";
        }
    });

    renderTransactions();
});
