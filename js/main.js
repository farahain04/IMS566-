requireAuth(['admin', 'user']); // Block unauth access

// --- 0. DATA NORMALIZATION (Standardizes mixed formats to DD/MM/YYYY) ---
function normalizeLegacyData() {
  ['borrows', 'returns'].forEach(key => {
    let items = JSON.parse(localStorage.getItem(key) || '[]');
    let updated = false;

    items.forEach(item => {
      if (!item.status) { item.status = item.returned === true ? 'returned' : 'borrowed'; updated = true; }
      if (typeof item.returned === 'undefined') { item.returned = (item.status === 'returned'); updated = true; }
      if (!item.date && item.borrowDate) { item.date = item.borrowDate; updated = true; }

      // Fix mixed date formats across localStorage entries
      ['date', 'borrowDate', 'dueDate', 'returnDate'].forEach(dateKey => {
        if (item[dateKey]) {
          let cleanStr = item[dateKey].trim().replace(/-/g, '/');
          let parts = cleanStr.split('/');
          if (parts.length === 3) {
            let d, m, y;
            if (parts[0].length === 4) { // YYYY/MM/DD
              y = parts[0]; m = parts[1]; d = parts[2];
            } else if (parseInt(parts[0]) > 12) { // DD/MM/YYYY
              d = parts[0]; m = parts[1]; y = parts[2];
            } else if (parseInt(parts[1]) > 12) { // MM/DD/YYYY
              m = parts[0]; d = parts[1]; y = parts[2];
            } else { // Default assumed DD/MM/YYYY
              d = parts[0]; m = parts[1]; y = parts[2];
            }
            let formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
            if (item[dateKey] !== formatted) {
              item[dateKey] = formatted;
              updated = true;
            }
          }
        }
      });
    });

    if (updated) {
      localStorage.setItem(key, JSON.stringify(items));
      console.log(`Data normalized: Standardized ${key} dates to DD/MM/YYYY.`);
    }
  });
}

// --- 1. CORE HELPERS ---
function initTheme() {
  const themeStyle = document.getElementById('theme-style');
  const darkModeToggle = document.getElementById('darkModeToggle'); 
  const darkModeIcon = document.getElementById('darkModeIcon');     
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  if (themeStyle) themeStyle.disabled = (savedTheme === 'light');
  if (darkModeIcon) darkModeIcon.className = (savedTheme === 'dark') ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  if (darkModeToggle) darkModeToggle.title = (savedTheme === 'dark') ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  
  if (savedTheme === 'dark') document.body.classList.add('dark-theme');
  else document.body.classList.remove('dark-theme');
}

function displayWelcome() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if(user) {
    let displayRole = "Librarian Staff";
    if(user.role === 'admin') displayRole = "System Administrator";
    if(user.role === 'manager') displayRole = "Library Manager";
    const welcomeEl = document.getElementById('welcome-user');
    if(welcomeEl) welcomeEl.textContent = `Welcome, ${user.name || user.username} (${displayRole})`;
  }
}

function getCount(name, whereFn) {
  let arr = JSON.parse(localStorage.getItem(name) || '[]');
  if(whereFn) arr = arr.filter(whereFn);
  return arr.length;
}

// --- 2. STATISTICS ENGINE ---
function statUpdate() {
  const borrowsArr = JSON.parse(localStorage.getItem('borrows') || '[]');
  const returnsArr = JSON.parse(localStorage.getItem('returns') || '[]');
  const booksArr = JSON.parse(localStorage.getItem('books') || '[]');
  const studentsArr = JSON.parse(localStorage.getItem('students') || '[]');

  const activeBorrowsCount = borrowsArr.filter(b => b.returned === false || b.status === "borrowed").length;
  const totalHistoryCount = borrowsArr.length;

  const uniqueReturnsSet = new Set();
  returnsArr.forEach(r => uniqueReturnsSet.add(`${r.bookTitle}-${r.studentReg}-${r.returnDate}`));
  borrowsArr.forEach(b => {
    if (b.returned === true || b.status === "returned") {
      uniqueReturnsSet.add(`${b.bookTitle}-${b.studentReg}-${b.returnDate}`);
    }
  });
  const totalReturnsCount = uniqueReturnsSet.size;

  function setVal(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  }

  setVal('dashTotalBooks', booksArr.length);
  setVal('totalBooks', booksArr.length);
  setVal('dashTotalStudents', studentsArr.length);
  setVal('totalStudents', studentsArr.length);
  setVal('dashTotalBorrows', activeBorrowsCount); 
  setVal('totalBorrows', activeBorrowsCount);
  setVal('dashTotalReturns', totalReturnsCount);
  setVal('totalReturns', totalReturnsCount);
  setVal('catCount', getCount('categories'));
  setVal('totalCategories', getCount('categories'));
  setVal('courseCount', getCount('courses'));
  setVal('totalCourses', getCount('courses'));
  setVal('totalHistoryBorrows', totalHistoryCount);
  setVal('returnedCount', totalReturnsCount);
}

// --- 3. CHART ENGINE ---
function initDashboardChart() {
  if (!document.getElementById('statsChart')) return;

  const selectEl = document.getElementById('yearSelect');
  const selectedYear = selectEl && selectEl.value ? parseInt(selectEl.value) : new Date().getFullYear();

  const borrowData = JSON.parse(localStorage.getItem('borrows') || '[]');
  const returnData = JSON.parse(localStorage.getItem('returns') || '[]');

  let monthlyBorrows = Array(12).fill(0);
  let monthlyReturns = Array(12).fill(0);

  function getMonthIndex(dateStr, targetYear) {
    if (!dateStr) return -1;
    let cleanStr = dateStr.replace(/-/g, '/');
    let parts = cleanStr.split('/');
    if (parts.length === 3) {
      let y = parseInt(parts[2].length === 4 ? parts[2] : parts[0]);
      let m = parseInt(parts[1]);
      if (y === targetYear) return m - 1;
    }
    return -1;
  }

  borrowData.forEach(b => {
    let m = getMonthIndex(b.date || b.borrowDate, selectedYear);
    if (m !== -1) monthlyBorrows[m]++;
  });

  const trackedReturns = new Set();
  [...returnData, ...borrowData.filter(b => b.returned === true || b.status === "returned")].forEach(item => {
    let key = `${item.bookTitle}-${item.studentReg}-${item.returnDate || item.date}`;
    if (!trackedReturns.has(key)) {
      trackedReturns.add(key);
      let m = getMonthIndex(item.returnDate || item.date, selectedYear);
      if (m !== -1) monthlyReturns[m]++;
    }
  });

  if (selectedYear === new Date().getFullYear()) {
    for (let m = new Date().getMonth() + 1; m < 12; m++) {
      monthlyBorrows[m] = null;
      monthlyReturns[m] = null;
    }
  }

  if (typeof renderDashboardChart === 'function') {
    renderDashboardChart(monthlyBorrows, monthlyReturns);
  }
}

function initDashboardYearEngine() { 
  statUpdate();
  initDashboardChart(); 
}

function setupYearDropdown() {
  const selectEl = document.getElementById('yearSelect');
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const currentYear = new Date().getFullYear();
  for (let year = 2025; year <= 2032; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) option.selected = true;
    selectEl.appendChild(option);
  }
  selectEl.onchange = () => initDashboardYearEngine();
}

function updateHeaderProfile() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return;

  const displayIdentity = user.name || user.username; 
  const navName = document.getElementById('navProfileName');
  if (navName) navName.textContent = displayIdentity;

  const dropHeader = document.getElementById('dropdownRoleTitle');
  if (dropHeader) dropHeader.textContent = displayIdentity; 

  const dropEmail = document.getElementById('dropdownEmailText');
  if (dropEmail) dropEmail.textContent = `${(user.username || 'user').toLowerCase()}@librarylms.com`;

  const welcomeEl = document.getElementById('welcome-user');
  if (welcomeEl) {
    let roleDisplay = (user.role === 'admin') ? "System Administrator" : "Librarian Staff";
    welcomeEl.textContent = `Welcome, ${displayIdentity} (${roleDisplay})`;
  }
}

// --- 4. INITIALIZATION ENGINE ---
document.addEventListener('DOMContentLoaded', () => {
  normalizeLegacyData(); 
  initTheme();
  displayWelcome();
  setupYearDropdown();
  updateHeaderProfile(); // Fixed broken reference here!
  statUpdate(); 
  
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user && user.role.toLowerCase() === 'admin') {
    document.body.classList.remove('role-user');
    document.body.classList.add('role-admin');
  } else {
    document.body.classList.remove('role-admin');
    document.body.classList.add('role-user');
  }

  setTimeout(() => {
    initDashboardChart();
  }, 100);
});