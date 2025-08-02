// --- DATABASE (using browser's localStorage to mimic the "account.dat" file) ---
function loadAccounts() {
    const accounts = localStorage.getItem('bankAccounts');
    return accounts ? JSON.parse(accounts) : [];
}

function saveAccounts(accounts) {
    localStorage.setItem('bankAccounts', JSON.stringify(accounts));
}

// --- UI NAVIGATION & MESSAGING ---
const messageArea = document.getElementById('message-area');
let messageTimeout;

function showView(viewId, clickedButton) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
    // Show the selected view
    document.getElementById(viewId).classList.add('active-view');

    // Update active state on menu buttons
    document.querySelectorAll('.menu-button').forEach(button => button.classList.remove('active'));
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    clearMessage();
    
    // Hide modify form and enquiry details when switching views
    document.getElementById('modifyAccountForm').classList.add('hidden');
    document.getElementById('accountDetails').classList.add('hidden');
}

function showMessage(text, isError = false) {
    clearTimeout(messageTimeout);
    messageArea.textContent = text;
    messageArea.style.color = isError ? 'var(--danger-color)' : '#155724';
    messageArea.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageArea.style.border = `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`;
    messageArea.classList.add('visible');
    
    messageTimeout = setTimeout(clearMessage, 5000);
}

function clearMessage() {
    messageArea.classList.remove('visible');
}

// Initialize the app by showing the welcome view and setting the first button as active
document.addEventListener('DOMContentLoaded', () => {
    // No view is shown by default, user has to click
    const firstMenuButton = document.querySelector('.menu-button');
    showView('welcome-view', null); // Show welcome view without highlighting a button
});


// --- CORE BANKING FUNCTIONS (mirroring your Java logic) ---

// 01. NEW ACCOUNT
document.getElementById('createAccountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const acno = parseInt(document.getElementById('acno').value);
    const name = document.getElementById('name').value;
    const type = document.getElementById('type').value.toUpperCase();
    const deposit = parseInt(document.getElementById('deposit').value);

    if ((type === 'S' && deposit < 500) || (type === 'C' && deposit < 1000)) {
        showMessage('Initial deposit minimum is 500 for Savings (S) and 1000 for Current (C).', true);
        return;
    }

    let accounts = loadAccounts();
    if (accounts.find(acc => acc.acno === acno)) {
        showMessage(`Account number ${acno} already exists.`, true);
        return;
    }

    accounts.push({ acno, name, type, deposit });
    saveAccounts(accounts);
    showMessage('Account Created Successfully!');
    e.target.reset();
});

// 05. ALL ACCOUNT HOLDER LIST
function displayAllAccounts() {
    const accounts = loadAccounts();
    const tableBody = document.getElementById('accountsTable').querySelector('tbody');
    tableBody.innerHTML = '';
    if (accounts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No accounts found. Create one!</td></tr>';
        return;
    }
    accounts.forEach(acc => {
        const row = `<tr>
            <td>${acc.acno}</td>
            <td>${acc.name}</td>
            <td>${acc.type}</td>
            <td>${acc.deposit.toLocaleString('en-IN')}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// 02 & 03. DEPOSIT & WITHDRAW
function performTransaction(transactionType) {
    const acno = parseInt(document.getElementById('trans-acno').value);
    const amount = parseInt(document.getElementById('trans-amount').value);

    let accounts = loadAccounts();
    const accountIndex = accounts.findIndex(acc => acc.acno === acno);

    if (accountIndex === -1) {
        showMessage('Record Not Found.', true);
        return;
    }

    const account = accounts[accountIndex];
    if (transactionType === 'deposit') {
        account.deposit += amount;
    } else if (transactionType === 'withdraw') {
        const futureBalance = account.deposit - amount;
        if ((account.type === 'S' && futureBalance < 500) || (account.type === 'C' && futureBalance < 1000)) {
            showMessage('Insufficient Balance for this withdrawal.', true);
            return;
        }
        account.deposit -= amount;
    }

    saveAccounts(accounts);
    showMessage(`Record Updated! New Balance: ₹${account.deposit.toLocaleString('en-IN')}`);
    document.getElementById('transactionForm').reset();
}

// 04. BALANCE ENQUIRY
document.getElementById('enquiryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const acno = parseInt(document.getElementById('enquiry-acno').value);
    const account = loadAccounts().find(acc => acc.acno === acno);
    const detailsDiv = document.getElementById('accountDetails');

    if (account) {
        detailsDiv.innerHTML = `
            <h4>Balance Details</h4>
            <p><strong>Account No:</strong> ${account.acno}</p>
            <p><strong>Holder Name:</strong> ${account.name}</p>
            <p><strong>Account Type:</strong> ${account.type}</p>
            <p><strong>Balance:</strong> ₹${account.deposit.toLocaleString('en-IN')}</p>
        `;
    } else {
        detailsDiv.innerHTML = `<p style="color:red;">Account number does not exist.</p>`;
    }

    // Add this line to make the results visible
    detailsDiv.classList.remove('hidden');
});

// 06. CLOSE AN ACCOUNT
document.getElementById('deleteAccountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const acno = parseInt(document.getElementById('delete-acno').value);

    if (!confirm(`Are you sure you want to delete account no. ${acno}?`)) return;

    let accounts = loadAccounts();
    const initialLength = accounts.length;
    accounts = accounts.filter(acc => acc.acno !== acno);

    if (accounts.length === initialLength) {
        showMessage('Record Not Found.', true);
    } else {
        saveAccounts(accounts);
        showMessage('Record Deleted Successfully!');
    }
    e.target.reset();
});

// 07. MODIFY AN ACCOUNT
document.getElementById('findModifyAccountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const acno = parseInt(document.getElementById('modify-search-acno').value);
    const account = loadAccounts().find(acc => acc.acno === acno);
    const modifyForm = document.getElementById('modifyAccountForm');

    if (account) {
        document.getElementById('editing-acno').textContent = account.acno;
        document.getElementById('modify-name').value = account.name;
        document.getElementById('modify-type').value = account.type;
        document.getElementById('modify-deposit').value = account.deposit;
        modifyForm.classList.remove('hidden');
    } else {
        showMessage('Record Not Found.', true);
        modifyForm.classList.add('hidden');
    }
});

document.getElementById('modifyAccountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const acno = parseInt(document.getElementById('editing-acno').textContent);
    const updatedName = document.getElementById('modify-name').value;
    const updatedType = document.getElementById('modify-type').value.toUpperCase();
    const updatedDeposit = parseInt(document.getElementById('modify-deposit').value);

    let accounts = loadAccounts();
    const accountIndex = accounts.findIndex(acc => acc.acno === acno);

    if (accountIndex !== -1) {
        accounts[accountIndex] = { acno, name: updatedName, type: updatedType, deposit: updatedDeposit };
        saveAccounts(accounts);
        showMessage('Record Updated Successfully!');
        e.target.classList.add('hidden');
        document.getElementById('findModifyAccountForm').reset();
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    showView('welcome-view');
});