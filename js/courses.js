requireAuth(['admin','user']);
let editCourseIdx = null;

function loadCourses() {
  return JSON.parse(localStorage.getItem('courses')||'[]');
}

function saveCourses(arr) {
  localStorage.setItem('courses', JSON.stringify(arr));
}

function renderCourses() {
  let tbody = document.querySelector("#courseTable tbody");
  if (!tbody) return;

  let arr = loadCourses();
  let searchInput = document.getElementById('searchCourse');
  let filter = searchInput ? searchInput.value.toLowerCase() : '';
  let showArr = arr.filter(c => c.toLowerCase().includes(filter));
  
  const isAdmin = getCurrentUser().role === 'admin';
  tbody.innerHTML = '';
  
  if(showArr.length === 0) {
    let cols = isAdmin ? 2 : 1;
    tbody.innerHTML = `<tr><td colspan="${cols}"><i>No courses found.</i></td></tr>`;
    return;
  }
  
  showArr.forEach((c) => {
    let idx = arr.indexOf(c);
    
    tbody.innerHTML += `
      <tr>
        <td>${c}</td>
        <td class="admin-only">
          <div class="action-btns">
            <button class="edit" onclick="openCourseModal(${idx})"><i class="fas fa-edit"></i> Edit</button>
            <button class="del" onclick="delCourse(${idx})"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </td>
      </tr>`;
  });
  
  if(!isAdmin) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    let addBtn = document.getElementById('addCourseBtn');
    if(addBtn) addBtn.style.display = 'none';
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    let addBtn = document.getElementById('addCourseBtn');
    if(addBtn) addBtn.style.display = '';
  }
}

function openCourseModal(idx) {
  document.getElementById('courseModal').classList.add('show');
  document.body.style.overflow = 'hidden';
  
  editCourseIdx = (typeof idx === 'number') ? idx : null;
  
  const titleEl = document.getElementById('courseFormTitle');
  const inputEl = document.getElementById('courseName');
  
  if (editCourseIdx === null) {
    titleEl.textContent = "Add Course";
    inputEl.value = '';
  } else {
    titleEl.textContent = "Edit Course";
    inputEl.value = loadCourses()[editCourseIdx];
  }
}

function closeCourseModal() {
  document.getElementById('courseModal').classList.remove('show');
  document.body.style.overflow = '';
  document.getElementById('courseForm').reset();
  editCourseIdx = null;
}

function delCourse(idx) {
  let arr = loadCourses();
  if(arr.length === 1) {
    notify("Cannot delete last course!", "error");
    return;
  }
  let delName = arr[idx];
  
  let students = JSON.parse(localStorage.getItem('students')||'[]');
  if(students.some(s => s.course === delName)) {
    notify("Cannot delete: In use by students.", "error");
    return;
  }
  
  if(confirm(`Delete "${delName}" forever?`)) {
    arr.splice(idx, 1);
    saveCourses(arr);
    renderCourses();
    notify("Course deleted.", "info");
  }
}

// MENGGUNAKAN DOMContentLoaded SUPAYA TIDAK BERTEMBUNG DENGAN SEED-DATA ATAU SCRIPT LAIN
document.addEventListener("DOMContentLoaded", function() {
  if(localStorage.getItem('courses') === null) {
    localStorage.setItem('courses', JSON.stringify([
      "CDIM260 - Bachelor of Information Science (Hons.) Library Management",
      "CDIM262 - Bachelor of Information Science (Hons.) Information Systems Management",
      "CDIM261 - Bachelor of Information Science (Hons.) Records Management",
      "CDIM263 - Bachelor of Information Science (Hons.) Content Management",
      "CS240 - Bachelor of Information Technology (Hons.)",
      "CS245 - Bachelor of Computer Science (Hons.) Data Science",
      "CS255 - Bachelor of Computer Science (Hons.) Computer Networks",
      "CS270 - Bachelor of Computer Science (Hons.) Creative IT"
    ]));
  }
  
  renderCourses();

  const searchInp = document.getElementById('searchCourse');
  if(searchInp) searchInp.oninput = renderCourses;

  const formEl = document.getElementById('courseForm');
  if(formEl) {
    formEl.onsubmit = function(e) {
      e.preventDefault();
      let arr = loadCourses();
      let name = document.getElementById('courseName').value.trim();
      
      if(!name) {
        notify("Course required.", "error");
        return;
      }
      
      if(arr.some((c, i) => c.toLowerCase() === name.toLowerCase() && i !== editCourseIdx)){
        notify("Course already exists", "error");
        return;
      }
      
      if(editCourseIdx === null) {
        arr.push(name);
        saveCourses(arr);
        notify("Course added successfully!");
      } else {
        let old = arr[editCourseIdx];
        arr[editCourseIdx] = name;
        
        let students = JSON.parse(localStorage.getItem('students')||'[]');
        students.forEach(s => {
          if(s.course === old) s.course = name;
        });
        localStorage.setItem('students', JSON.stringify(students));
        
        saveCourses(arr);
        notify("Course updated successfully!");
      }
      
      closeCourseModal();
      renderCourses();
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

// Pendedahan kepada window skrin global HTML onclick
window.openCourseModal = openCourseModal;
window.closeCourseModal = closeCourseModal;
window.delCourse = delCourse;