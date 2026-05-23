requireAuth(['admin','user']);
let editStuIdx = null;

// Mengambil senarai kursus master yang dikongsi bersama daripada localStorage
function loadCourses() {
  return JSON.parse(localStorage.getItem('courses')||'[]');
}

function loadStudents() {
  return JSON.parse(localStorage.getItem('students')||'[]');
}

function saveStudents(stus) {
  localStorage.setItem('students', JSON.stringify(stus));
}

function loadBorrowedStudents() {
  let borrows = JSON.parse(localStorage.getItem('borrows')||'[]');
  return borrows.map(b=>b.studentReg);
}

// Mengisi dropdown menu dalam modal tambah/edit pelajar
function populateCourseOptions() {
  let sel = document.getElementById('stuCourse');
  if (!sel) return;
  sel.innerHTML = `<option value="">-- Select Course --</option>`;
  
  loadCourses().forEach(c => {
    // Memaparkan nama penuh di dropdown tetapi menggunakan nilai yang seragam
    sel.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function renderStudents() {
  let tbody = document.querySelector("#stuTable tbody");
  if (!tbody) return;
  
  let stus = loadStudents();
  let searchInput = document.getElementById('searchStu');
  let filter = searchInput ? searchInput.value.toLowerCase() : '';
  const isAdmin = getCurrentUser().role === 'admin';
  
  if(filter) {
    stus = stus.filter(
      s=>(s.name + s.regNo + s.course).toLowerCase().includes(filter)
    );
  }
  
  let borrowedRegs = loadBorrowedStudents();
  tbody.innerHTML = '';
  
  if(stus.length === 0) {
    let cols = isAdmin ? 5 : 4;
    tbody.innerHTML = `<tr><td colspan="${cols}"><i>No students found.</i></td></tr>`;
    return;
  }
  
  stus.forEach((s, i) => {
    let isBorrowed = borrowedRegs.includes(s.regNo) ?
      `<span style="color:#eab308;font-weight:500;">Yes</span>` :
      `<span style="color:#10b981;font-weight:500;">No</span>`;
      
    let actionBtn =
      `<div class="action-btns">
        <button class="edit" onclick="openStudentModal(${i})"><i class="fas fa-edit"></i> Edit</button>
        <button class="del" onclick="delStudent(${i})"><i class="fas fa-trash"></i> Delete</button>
      </div>`;
      
    tbody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.regNo}</td>
        <td>${s.course}</td>
        <td>${isBorrowed}</td>
        <td class="admin-only">${actionBtn}</td>
      </tr>`;
  });
  
  if(!isAdmin) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    let addBtn = document.getElementById('addStuBtn');
    if(addBtn) addBtn.style.display = 'none';
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    let addBtn = document.getElementById('addStuBtn');
    if(addBtn) addBtn.style.display = '';
  }
}

function openStudentModal(idx) {
  populateCourseOptions();
  document.getElementById('stuModal').classList.add('show');
  document.body.style.overflow = 'hidden';
  editStuIdx = (typeof idx === 'number') ? idx : null;
  document.getElementById('stuFormTitle').textContent = editStuIdx === null ? "Add Student" : "Edit Student";
  
  let name = '', regNo = '', course = '';
  if(editStuIdx !== null) {
    let s = loadStudents()[editStuIdx];
    name = s.name || '';
    regNo = s.regNo || '';
    course = s.course || '';
  }
  
  document.getElementById('stuName').value = name;
  document.getElementById('stuReg').value = regNo;
  document.getElementById('stuReg').disabled = (editStuIdx !== null);
  document.getElementById('stuCourse').value = course;
}

function closeStudentModal() {
  document.getElementById('stuModal').classList.remove('show');
  document.body.style.overflow = '';
  document.getElementById('stuForm').reset();
  editStuIdx = null;
}

function delStudent(idx) {
  let stus = loadStudents();
  let borrowedRegs = loadBorrowedStudents();
  let s = stus[idx];
  if(borrowedRegs.includes(s.regNo)) {
    notify("Cannot delete: Student has borrowed books!", "error");
    return;
  }
  if(confirm(`Delete student "${s.name}" forever?`)) {
    stus.splice(idx, 1);
    saveStudents(stus);
    renderStudents();
    notify("Student deleted.", "info");
  }
}

// Menggunakan DOMContentLoaded bagi menjamin penyelarasan data tanpa konflik window.onload
document.addEventListener("DOMContentLoaded", function() {
  if(localStorage.getItem('students') === null) {
    localStorage.setItem('students', JSON.stringify([
      { id: "S001", name: "Ahmad Fakhrul Bin Rosli", regNo: "2024123456", course: "CDIM263 - Bachelor of Information Science (Hons.) Content Management" },
      { id: "S002", name: "Nurul Shuhada Binti Mohd Zaki", regNo: "2024987654", course: "CS240 - Bachelor of Information Technology (Hons.)" },
      { id: "S003", name: "Muhammad Farhan Bin Izham", regNo: "2023451298", course: "CS255 - Bachelor of Computer Science (Hons.) Computer Networks" },
      { id: "S004", name: "Siti Nuraisyah Binti Abdullah", regNo: "2025881234", course: "CDIM260 - Bachelor of Information Science (Hons.) Library Management" },
      { id: "S005", name: "Arif Daniel Bin Kamaruddin", regNo: "2024667123", course: "CS245 - Bachelor of Computer Science (Hons.) Data Science" },
      { id: "S006", name: "Khairul Amrin Bin Mohd Azmi", regNo: "2023114562", course: "CS270 - Bachelor of Computer Science (Hons.) Creative IT" },
      { id: "S007", name: "Farah Adriana Binti Hisham", regNo: "2024552198", course: "CDIM261 - Bachelor of Information Science (Hons.) Records Management" },
      { id: "S008", name: "Adam Harith Bin Norizan", regNo: "2025993412", course: "CS240 - Bachelor of Information Technology (Hons.)" },
      { id: "S009", name: "Anis Maisarah Binti Zulkifli", regNo: "2024228743", course: "CDIM263 - Bachelor of Information Science (Hons.) Content Management" },
      { id: "S010", name: "Daniel Asyraf Bin Shahrul", regNo: "2023774156", course: "CS255 - Bachelor of Computer Science (Hons.) Computer Networks" }
    ]));
  }
  
  populateCourseOptions();
  renderStudents();

  const searchInp = document.getElementById('searchStu');
  if(searchInp) searchInp.oninput = renderStudents;

  const formEl = document.getElementById('stuForm');
  if(formEl) {
    formEl.onsubmit = function(e) {
      e.preventDefault();
      let stus = loadStudents();
      let name = document.getElementById('stuName').value.trim();
      let regNo = document.getElementById('stuReg').value.trim();
      let course = document.getElementById('stuCourse').value || '';
      
      if(!name || !regNo || !course){
        notify("All fields required!", "error");
        return;
      }
      
      if(editStuIdx === null) {
        if(stus.some(s=>s.regNo.toLowerCase()===regNo.toLowerCase())) {
          notify("Student reg no must be unique.", "error");
          return;
        }
        stus.push({name, regNo, course});
        notify("Student added!");
      } else {
        stus[editStuIdx] = {...stus[editStuIdx], name, course};
        notify("Student updated!");
      }
      
      saveStudents(stus);
      closeStudentModal();
      renderStudents();
    }
  }
});

function notify(msg, type='success') {
  let n = document.getElementById('notification');
  if(!n) return;
  let toast = document.createElement('div');
  toast.className = 'toast ' + (type==='error'?'danger':type);
  toast.innerHTML = msg;
  n.appendChild(toast);
  setTimeout(()=>{ toast.remove(); }, 2400);
}

// Dedahkan fungsi kepada elemen onclick global HTML
window.openStudentModal = openStudentModal;
window.closeStudentModal = closeStudentModal;
window.delStudent = delStudent;