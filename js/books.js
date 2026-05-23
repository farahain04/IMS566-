requireAuth(['admin','user']);

// UI state
let editIndex = null;

// Categories (load into select)
// js/books.js -> Replace the populateCategoryOptions logic block
function populateCategoryOptions() {
  let sel = document.getElementById('bookCategory');
  if (!sel) return;
  sel.innerHTML = `<option value="" disabled selected>-- Choose Category --</option>`;
  let cats = JSON.parse(localStorage.getItem('categories') || '[]');
  
  cats.forEach(c => {
    // Safely parse ID and Name properties out of seed-data storage components
    let catId = typeof c === 'object' ? c.id : c;
    let catName = typeof c === 'object' ? c.name : c;
    sel.innerHTML += `<option value="${catId}">${catName}</option>`;
  });
}

function loadBooks() {
  return JSON.parse(localStorage.getItem('books')||'[]');
}
function saveBooks(books) {
  localStorage.setItem('books', JSON.stringify(books));
}
function renderBooks() {
  let tbody = document.querySelector("#bookTable tbody");
  let books = loadBooks();
  
  // 1. Load categories to perform lookup
  let categories = JSON.parse(localStorage.getItem('categories') || '[]');
  
  let filter = document.getElementById('searchBook').value.toLowerCase();
  const isAdmin = getCurrentUser().role === 'admin';

  if(filter) {
    books = books.filter(
      b => (b.title + b.author + b.category).toLowerCase().includes(filter)
    );
  }
  
  tbody.innerHTML = '';
  
  if(books.length === 0) {
    let cols = isAdmin ? 5 : 4;
    tbody.innerHTML = `<tr><td colspan="${cols}"><i>No books found.</i></td></tr>`;
    return;
  }
  
  books.forEach((b, i) => {
    // 2. LOGIC FIX: Match the category ID or Name to display the full name
    let catObj = categories.find(c => {
        let cId = typeof c === 'object' ? c.id : c;
        let cName = typeof c === 'object' ? c.name : c;
        return cId === b.category || cName === b.category;
    });
    
    // Use the name if found, otherwise keep original
    let displayCategory = catObj ? (typeof catObj === 'object' ? catObj.name : catObj) : b.category;

    let status = b.borrowed ? `<span style="color:#eab308;">Borrowed</span><br><span style="font-size:.9em">(${b.borrowedByName||'?'})</span>` : `<span style="color:#10b981;font-weight:500">Available</span>`;
    let actionBtn =
      `<div class="action-btns">
        <button class="edit" onclick="openBookModal(${i})"><i class="fas fa-edit"></i> Edit</button>
        <button class="del" onclick="delBook(${i})"><i class="fas fa-trash"></i> Delete</button>
      </div>`;
    
    tbody.innerHTML += `
      <tr>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${displayCategory}</td> <td>${status}</td>
        <td class="admin-only">${actionBtn}</td>
      </tr>`;
  });
  
  // Hide edit/delete container if not admin
  if(!isAdmin) {
    document.querySelectorAll('.admin-only').forEach(el=>el.style.display='none');
    let addBtn = document.getElementById('addBookBtn');
    if(addBtn) addBtn.style.display = 'none';
  } else {
    document.querySelectorAll('.admin-only').forEach(el=>el.style.display='');
    let addBtn = document.getElementById('addBookBtn');
    if(addBtn) addBtn.style.display = '';
  }
}

// Open add/edit book modal
function openBookModal(idx) {
  populateCategoryOptions();
  const modal = document.getElementById('bookModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  editIndex = (typeof idx === 'number') ? idx : null;
  // If editing, fill out info
  let title = '', author = '', category = '', year = '';
  if(editIndex !== null) {
    let b = loadBooks()[editIndex];
    title = b.title; author = b.author; category = b.category; year = b.year||'';
    document.getElementById('bookFormTitle').textContent = 'Edit Book';
  } else {
    document.getElementById('bookFormTitle').textContent = 'Add Book';
  }
  document.getElementById('bookTitle').value = title;
  document.getElementById('bookAuthor').value = author;
  document.getElementById('bookCategory').value = category;
  document.getElementById('bookYear').value = year;
}
function closeBookModal() {
  document.getElementById('bookModal').classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(()=>{document.getElementById('bookForm').reset();},151);
  editIndex = null;
}

// CRUD
function submitBookForm(e){
  e.preventDefault();
  let books = loadBooks();
  let title = document.getElementById('bookTitle').value.trim();
  let author = document.getElementById('bookAuthor').value.trim();
  let category = document.getElementById('bookCategory').value || '';
  let year = document.getElementById('bookYear').value.trim();
  // Validate
  if(!title || !author || !category) {
    notify("All fields required!","error");
    return;
  }
  if(year && (isNaN(+year) || year.length !== 4 || +year < 1000 || +year > 2100)) {
    notify("Enter a valid year.","error");
    return;
  }
  if(editIndex !== null) {
    // Cannot edit if borrowed
    if(books[editIndex].borrowed) {
      notify("Cannot edit a borrowed book!","error");
      closeBookModal(); return;
    }
    books[editIndex] = {...books[editIndex], title, author, category, year};
    notify("Book updated!");
  } else {
    const newBook = { title, author, category, year, borrowed: false, borrowedBy: null, borrowedByName:null };
    books.push(newBook);
    notify("Book added!");
  }
  saveBooks(books);
  closeBookModal();
  renderBooks();
}

function delBook(idx) {
  let books = loadBooks();
  if(books[idx].borrowed) {
    notify("Cannot delete borrowed book!","error"); return;
  }
  if(confirm("Delete this book forever?")) {
    books.splice(idx,1);
    saveBooks(books);
    renderBooks();
    notify("Book deleted.","info");
  }
}

function notify(msg, type='success') {
  let n = document.getElementById('notification');
  if(!n) return;
  let toast = document.createElement('div');
  toast.className = 'toast ' + (type==='error'?'danger':type);
  toast.innerHTML = msg;
  n.appendChild(toast);
  setTimeout(()=>{ toast.remove(); }, 2400);
}

// Everything in window.onload so all elements are present!
window.onload = function() {
  // SUNTIKAN DATA BUKU UITM (12 BUAH BUKU)
  if(localStorage.getItem('books') === null) {
  localStorage.setItem('books', JSON.stringify([
    { title: "Systems Analysis and Design", author: "Kenneth E. Kendall", category: "Information Management", year: "2020", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Introduction to Computer Science", author: "Thomas H. Cormen", category: "Computer Science", year: "2022", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Cybersecurity Essentials", author: "Charles J. Brooks", category: "Cybersecurity", year: "2021", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Knowledge Management Systems", author: "Stuart Barnes", category: "Information Management", year: "2020", borrowed: true, borrowedBy: "S001", borrowedByName: "Ahmad Fakhrul Bin Rosli" }, // MATCH BR012
    { title: "Practical Data Science with R", author: "Nina Zumel", category: "Data Science", year: "2023", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Academic Writing and Research", author: "John Swales", category: "General Education", year: "2019", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Computer Networking Global Edition", author: "James Kurose", category: "Computer Science", year: "2021", borrowed: true, borrowedBy: "S003", borrowedByName: "Muhammad Farhan Bin Izham" }, // MATCH BR009
    { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", category: "Artificial Intelligence", year: "2021", borrowed: true, borrowedBy: "S006", borrowedByName: "Khairul Amrin Bin Mohd Azmi" }, // MATCH BR010
    { title: "Records and Information Management", author: "Patricia C. Franks", category: "Information Management", year: "2020", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Cloud Computing Architecture", author: "Thomas Erl", category: "Computer Science", year: "2023", borrowed: true, borrowedBy: "S008", borrowedByName: "Adam Harith Bin Norizan" }, // MATCH BR011
    { title: "Strategic Management in Information Services", author: "David Baker", category: "Strategic Management", year: "2022", borrowed: false, borrowedBy: null, borrowedByName: null },
    { title: "Introduction to Python for Data Analytics", author: "Daniel Y. Chen", category: "Data Science", year: "2021", borrowed: false, borrowedBy: null, borrowedByName: null }
  ]));
}
  
  populateCategoryOptions();
  renderBooks();
  
  const searchInput = document.getElementById('searchBook');
  if(searchInput) searchInput.oninput = renderBooks;
  
  const bookForm = document.getElementById('bookForm');
  if(bookForm) bookForm.onsubmit = submitBookForm;
}

// Ensure these are globally accessible
window.openBookModal = openBookModal;
window.closeBookModal = closeBookModal;
window.delBook = delBook;
window.submitBookForm = submitBookForm;