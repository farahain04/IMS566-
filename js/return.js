requireAuth(['admin','user']);

function loadBooks() { return JSON.parse(localStorage.getItem('books')||'[]'); }
function saveBooks(arr){ localStorage.setItem('books',JSON.stringify(arr)); }
function loadBorrows() { return JSON.parse(localStorage.getItem('borrows')||'[]'); }
function saveBorrows(arr) { localStorage.setItem('borrows',JSON.stringify(arr)); }
function loadReturns() { return JSON.parse(localStorage.getItem('returns')||'[]'); }
function saveReturns(arr) { localStorage.setItem('returns',JSON.stringify(arr)); }

// Strict manual calculation to bypass system locale issues
function generateStrictDMYDate(dateObj) {
  let d = String(dateObj.getDate()).padStart(2, '0');
  let m = String(dateObj.getMonth() + 1).padStart(2, '0');
  let y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDateObject(dateStr) {
  if (!dateStr) return new Date();
  let cleanStr = dateStr.replace(/-/g, '/');
  let parts = cleanStr.split('/');
  if (parts.length === 3) {
    let d = parseInt(parts[0].length === 4 ? parts[2] : parts[0]);
    let m = parseInt(parts[1]);
    let y = parseInt(parts[0].length === 4 ? parts[0] : parts[2]);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

function renderReturns() {
  let tbody = document.querySelector("#returnTable tbody");
  if (!tbody) return;
  
  let returns = loadReturns();
  const isAdmin = getCurrentUser().role === 'admin';
  tbody.innerHTML = '';
  
  if(!returns.length) {
    let cols = isAdmin ? 7 : 6;
    tbody.innerHTML = `<tr><td colspan="${cols}"><i>No completed returns found in ledger history.</i></td></tr>`;
    return;
  }
  
  returns.forEach((ret, idx) => {
    let displayFine = parseFloat(ret.fine || 0) > 0 
      ? `<span style="color:#ef4444; font-weight:600;">RM ${parseFloat(ret.fine).toFixed(2)}</span>` 
      : `<span style="color:#10b981;">RM 0.00</span>`;

    let rowHTML = `
      <tr>
        <td>${ret.returnDate}</td>
        <td><strong>${ret.bookTitle}</strong><br><small class="text-muted">${ret.bookAuthor}</small></td>
        <td>${ret.studentName}</td>
        <td><code>${ret.studentReg}</code></td>
        <td>${ret.dueDate || 'N/A'}</td>
        <td>${displayFine}</td>
    `;

    if (isAdmin) {
      rowHTML += `
        <td>
          <div class="action-btns">
            <button class="del" onclick="delReturnRecord(${idx})"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </td>
      `;
    }

    rowHTML += `</tr>`;
    tbody.innerHTML += rowHTML;
  });

  let actionDiv = document.getElementById('returnActionContainer');
  if(actionDiv) actionDiv.style.display = 'block';
}

function delReturnRecord(idx) {
  if (confirm("Delete this return record permanently from ledger?")) {
    let returns = loadReturns();
    returns.splice(idx, 1);
    saveReturns(returns);
    renderReturns();
    notify("Return record deleted.", "info");
  }
}

function populateReturnForm() {
  let sel = document.getElementById('returnBorrow');
  let borrows = loadBorrows();
  sel.innerHTML = `<option value="">-- Select borrowing to return --</option>`;
  
  borrows.forEach((b, i) => {
    if(!b.returned && b.status !== "returned") {
      sel.innerHTML += `<option value="${i}">${b.bookTitle} - Student: ${b.studentName} [${b.studentReg}]</option>`;
    }
  });
}

function openReturnModal() {
  populateReturnForm();
  document.getElementById('returnModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeReturnModal() {
  document.getElementById('returnModal').classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => { document.getElementById('returnForm').reset(); }, 151);
}

document.getElementById('returnForm').onsubmit = function(e){
  e.preventDefault();
  let idx = document.getElementById('returnBorrow').value;
  if(idx === '') {
    notify("Choose an outstanding borrowing entry!", "error"); 
    return;
  }
  
  let borrows = loadBorrows();
  let ret = borrows[idx];
  
  if(ret.returned || ret.status === "returned") {
    notify("Transaction entry already marked settled.", "error"); 
    return;
  }

  let today = new Date();
  let dueDateObj = parseDateObject(ret.dueDate);
  
  today.setHours(0,0,0,0);
  dueDateObj.setHours(0,0,0,0);
  
  let timeDifference = today.getTime() - dueDateObj.getTime();
  let daysLate = Math.ceil(timeDifference / (1000 * 3600 * 24));
  let fineAmount = 0;

  if (daysLate > 0) {
    fineAmount = (daysLate * 0.20).toFixed(2);
    alert(`Book check-in is LATE by ${daysLate} days.\nFine Generated: RM ${fineAmount}`);
  } else {
    alert("Book check-in verified on time. No fines applied.");
  }

  let exactReturnDateStr = generateStrictDMYDate(new Date()); // Forces consistent formatting

  ret.returned = true;
  ret.status = "returned";
  ret.returnDate = exactReturnDateStr;
  ret.fine = fineAmount;
  saveBorrows(borrows);

  let returns = loadReturns();
  returns.push({
    id: "RT-" + Date.now(),
    bookTitle: ret.bookTitle,
    bookAuthor: ret.bookAuthor,
    studentName: ret.studentName,
    studentReg: ret.studentReg,
    borrowDate: ret.date || ret.borrowDate,
    dueDate: ret.dueDate,
    returnDate: exactReturnDateStr,
    fine: fineAmount
  });
  saveReturns(returns);

  let books = loadBooks();
  let bidx = books.findIndex(b => b.title === ret.bookTitle && b.author === ret.bookAuthor && b.borrowedBy === ret.studentReg);
  if(bidx !== -1) {
    books[bidx].borrowed = false;
    books[bidx].borrowedBy = null;
    books[bidx].borrowedByName = null;
    saveBooks(books);
  }

  notify("Book returned successfully!");
  closeReturnModal();
  renderReturns();
}

window.onload = function() {
  if(localStorage.getItem('returns') === null) {
    localStorage.setItem('returns', JSON.stringify([
      { id: "RT001", returnDate: "17/01/2026", bookTitle: "Academic Writing and Research", bookAuthor: "John Swales", studentName: "Farah Adriana Binti Hisham", studentReg: "2024552198", dueDate: "19/01/2026", fine: "0.00" },
      { id: "RT002", returnDate: "26/01/2026", bookTitle: "Introduction to Computer Science", bookAuthor: "Thomas H. Cormen", studentName: "Nurul Shuhada Binti Mohd Zaki", studentReg: "2024987654", dueDate: "26/01/2026", fine: "0.00" },
      { id: "RT003", returnDate: "15/02/2026", bookTitle: "Practical Data Science with R", bookAuthor: "Nina Zumel", studentName: "Anis Maisarah Binti Zulkifli", studentReg: "2024228743", dueDate: "16/02/2026", fine: "0.00" },
      { id: "RT004", returnDate: "04/03/2026", bookTitle: "Records and Information Management", bookAuthor: "Patricia C. Franks", studentName: "Daniel Asyraf Bin Shahrul", studentReg: "2023774156", dueDate: "01/03/2026", fine: "1.50" },
      { id: "RT005", returnDate: "18/03/2026", bookTitle: "Cybersecurity Essentials", bookAuthor: "Charles J. Brooks", studentName: "Arif Daniel Bin Kamaruddin", studentReg: "2024667123", dueDate: "18/03/2026", fine: "0.00" },
      { id: "RT006", returnDate: "01/04/2026", bookTitle: "Introduction to Python for Data Analytics", bookAuthor: "Daniel Y. Chen", studentName: "Adam Harith Bin Norizan", studentReg: "2025993412", dueDate: "03/04/2026", fine: "0.00" },
      { id: "RT007", returnDate: "20/04/2026", bookTitle: "Systems Analysis and Design", bookAuthor: "Kenneth E. Kendall", studentName: "Siti Nuraisyah Binti Abdullah", studentReg: "2025881234", dueDate: "22/04/2026", fine: "0.00" },
      { id: "RT008", returnDate: "02/05/2026", bookTitle: "Strategic Management in Information Services", bookAuthor: "David Baker", studentName: "Khairul Amrin Bin Mohd Azmi", studentReg: "2023114562", dueDate: "29/04/2026", fine: "1.50" }
    ]));
  }
  renderReturns();
};

function notify(msg, type = 'success') {
  let n = document.getElementById('notification');
  if(!n) return;
  let toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'danger' : type);
  toast.innerHTML = msg;
  n.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2400);
}