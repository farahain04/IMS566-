requireAuth(['admin','user']);

function loadBooks() { return JSON.parse(localStorage.getItem('books')||'[]'); }
function saveBooks(arr){ localStorage.setItem('books',JSON.stringify(arr)); }
function loadStudents() { return JSON.parse(localStorage.getItem('students')||'[]'); }
function loadBorrows() { return JSON.parse(localStorage.getItem('borrows')||'[]'); }
function saveBorrows(arr) { localStorage.setItem('borrows',JSON.stringify(arr)); }

// Strict manual calculation to bypass system locale issues
function generateStrictDMYDate(dateObj) {
  let d = String(dateObj.getDate()).padStart(2, '0');
  let m = String(dateObj.getMonth() + 1).padStart(2, '0');
  let y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

function syncDashboard() {
  if (typeof statUpdate === 'function') statUpdate();
  if (typeof initDashboardChart === 'function') initDashboardChart();
}

function populateBorrowForm() {
  let bookSel = document.getElementById('borrowBook');
  let stuSel = document.getElementById('borrowStudent');
  let books = loadBooks();
  let students = loadStudents();
  
  bookSel.innerHTML = `<option value="">-- Select Available Book --</option>`;
  stuSel.innerHTML = `<option value="">-- Select Student --</option>`;
  
  books.forEach((b, i) => {
    if (!b.borrowed) {
      bookSel.innerHTML += `<option value="${i}">${b.title} (${b.author})</option>`;
    }
  });
  students.forEach((s) => {
    stuSel.innerHTML += `<option value="${s.regNo}">${s.name} [${s.regNo}]</option>`;
  });
}

function renderBorrows() {
  let tbody = document.querySelector("#borrowTable tbody");
  if (!tbody) return;

  let borrows = loadBorrows();
  const isAdmin = getCurrentUser().role === 'admin';
  tbody.innerHTML = '';
  
  if(!borrows.length) {
    let cols = isAdmin ? 6 : 5;
    tbody.innerHTML = `<tr><td colspan="${cols}"><i>No active library loans found in ledger.</i></td></tr>`;
    return;
  }
  
  borrows.forEach((b, idx) => {
    let rowHTML = `
      <tr>
        <td>${b.date}</td>
        <td>${b.dueDate}</td>
        <td><strong>${b.bookTitle}</strong><br><small style="color:#666;">${b.bookAuthor}</small></td>
        <td>${b.studentName}</td>
        <td><code class="reg-badge">${b.studentReg}</code></td>
    `;
    
    if (isAdmin) {
      rowHTML += `
        <td>
          <div class="action-btns">
            <button class="del" onclick="delBorrow(${idx})"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </td>
      `;
    }
    
    rowHTML += `</tr>`;
    tbody.innerHTML += rowHTML;
  });
}

function openBorrowModal() {
  populateBorrowForm();
  document.getElementById('borrowModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeBorrowModal() {
  document.getElementById('borrowModal').classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => { document.getElementById('borrowForm').reset(); }, 151);
}

document.getElementById('borrowForm').onsubmit = function(e) {
  e.preventDefault();
  let bookIdx = document.getElementById('borrowBook').value;
  let studentReg = document.getElementById('borrowStudent').value;
  
  if (bookIdx === '' || studentReg === '') {
    notify("All selection fields are critical!", "error");
    return;
  }
  
  let books = loadBooks();
  let students = loadStudents();
  let borrows = loadBorrows();

  if (books[bookIdx].borrowed) {
    notify("Target book item copy allocation is active elsewhere.", "error"); 
    return;
  }

  let activeStudentBorrows = borrows.filter(b => b.studentReg === studentReg && (!b.returned || b.status === "borrowed")).length;
  if (activeStudentBorrows >= 20) {
    notify("Borrow limit reached! Student cannot borrow more than 20 books.", "error");
    return;
  }

  let borrowDate = new Date();
  let dueDate = new Date();
  dueDate.setDate(borrowDate.getDate() + 14);

  let stu = students.find(s => s.regNo === studentReg);

  let newBorrow = {
    id: "BRW-" + Date.now(),
    bookTitle: books[bookIdx].title,
    bookAuthor: books[bookIdx].author,
    studentName: stu.name,
    studentReg: studentReg,
    date: generateStrictDMYDate(borrowDate),   // Hard-coded DD/MM/YYYY formatting
    dueDate: generateStrictDMYDate(dueDate),     // Hard-coded DD/MM/YYYY formatting
    returnDate: null,
    status: "borrowed",
    returned: false,
    fine: "0.00"
  };

  borrows.push(newBorrow);
  saveBorrows(borrows);

  books[bookIdx].borrowed = true;
  books[bookIdx].borrowedBy = studentReg;
  books[bookIdx].borrowedByName = stu.name;
  saveBooks(books);

  syncDashboard();

  notify(`Issued. Due on: ${generateStrictDMYDate(dueDate)}`);
  closeBorrowModal();
  renderBorrows();
};

function delBorrow(idx) {
  if (confirm("Delete this borrow record permanently from ledger?")) {
    let borrows = loadBorrows(), books = loadBooks();
    let b = borrows[idx];
    
    let bookIdx = books.findIndex(x => x.title === b.bookTitle && x.author === b.bookAuthor && x.borrowedBy === b.studentReg);
    if (bookIdx !== -1) {
      books[bookIdx].borrowed = false;
      books[bookIdx].borrowedBy = null;
      books[bookIdx].borrowedByName = null;
      saveBooks(books);
    }
    
    borrows.splice(idx, 1);
    saveBorrows(borrows);
    
    syncDashboard();
    renderBorrows();
    notify("Ledger record execution canceled.", "info");
  }
}

window.onload = function() {
  if(localStorage.getItem('borrows') === null) {
    localStorage.setItem('borrows', JSON.stringify([
      { id: "BR001", bookTitle: "Academic Writing and Research", bookAuthor: "John Swales", studentName: "Farah Adriana Binti Hisham", studentReg: "2024552198", date: "05/01/2026", dueDate: "19/01/2026", returnDate: "17/01/2026", returned: true, status: "returned", fine: "0.00" },
      { id: "BR002", bookTitle: "Introduction to Computer Science", bookAuthor: "Thomas H. Cormen", studentName: "Nurul Shuhada Binti Mohd Zaki", studentReg: "2024987654", date: "12/01/2026", dueDate: "26/01/2026", returnDate: "26/01/2026", returned: true, status: "returned", fine: "0.00" },
      { id: "BR003", bookTitle: "Practical Data Science with R", bookAuthor: "Nina Zumel", studentName: "Anis Maisarah Binti Zulkifli", studentReg: "2024228743", date: "02/02/2026", dueDate: "16/02/2026", returnDate: "15/02/2026", returned: true, status: "returned", fine: "0.00" },
      { id: "BR004", bookTitle: "Records and Information Management", bookAuthor: "Patricia C. Franks", studentName: "Daniel Asyraf Bin Shahrul", studentReg: "2023774156", date: "15/02/2026", dueDate: "01/03/2026", returnDate: "04/03/2026", returned: true, status: "returned", fine: "1.50" },
      { id: "BR005", bookTitle: "Cybersecurity Essentials", bookAuthor: "Charles J. Brooks", studentName: "Arif Daniel Bin Kamaruddin", studentReg: "2024667123", date: "04/03/2026", dueDate: "18/03/2026", returnDate: "18/03/2026", returned: true, status: "returned", fine: "0.00" },
      { id: "BR006", bookTitle: "Introduction to Python for Data Analytics", bookAuthor: "Daniel Y. Chen", studentName: "Adam Harith Bin Norizan", studentReg: "2025993412", date: "20/03/2026", dueDate: "03/04/2026", returnDate: "01/04/2026", returned: true, status: "returned", fine: "0.00" },
      { id: "BR007", bookTitle: "Systems Analysis and Design", bookAuthor: "Kenneth E. Kendall", studentName: "Siti Nuraisyah Binti Abdullah", studentReg: "2025881234", date: "08/04/2026", dueDate: "22/04/2026", returnDate: "20/04/2026", returned: true, status: "returned", fine: "0.00" },
      { id: "BR008", bookTitle: "Strategic Management in Information Services", bookAuthor: "David Baker", studentName: "Khairul Amrin Bin Mohd Azmi", studentReg: "2023114562", date: "15/04/2026", dueDate: "29/04/2026", returnDate: "02/05/2026", returned: true, status: "returned", fine: "1.50" },
      { id: "BR009", bookTitle: "Computer Networking Global Edition", bookAuthor: "James Kurose", studentName: "Muhammad Farhan Bin Izham", studentReg: "2023451298", date: "10/05/2026", dueDate: "24/05/2026", returnDate: null, returned: false, status: "borrowed", fine: "0.00" },
      { id: "BR010", bookTitle: "Artificial Intelligence: A Modern Approach", bookAuthor: "Stuart Russell", studentName: "Khairul Amrin Bin Mohd Azmi", studentReg: "2023114562", date: "12/05/2026", dueDate: "26/05/2026", returnDate: null, returned: false, status: "borrowed", fine: "0.00" },
      { id: "BR011", bookTitle: "Cloud Computing Architecture", bookAuthor: "Thomas Erl", studentName: "Adam Harith Bin Norizan", studentReg: "2025993412", date: "18/05/2026", dueDate: "01/06/2026", returnDate: null, returned: false, status: "borrowed", fine: "0.00" },
      { id: "BR012", bookTitle: "Knowledge Management Systems", bookAuthor: "Stuart Barnes", studentName: "Ahmad Fakhrul Bin Rosli", studentReg: "2024123456", date: "19/05/2026", dueDate: "02/06/2026", returnDate: null, returned: false, status: "borrowed", fine: "0.00" }
    ]));
  }
  renderBorrows();
};

function notify(msg, type = 'success') {
  let n = document.getElementById('notification');
  if (!n) return;
  let toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'danger' : type);
  toast.innerHTML = msg;
  n.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2400);
}