requireAuth(['admin','user']);
let editCatIdx = null;

function loadCategories() { 
  return JSON.parse(localStorage.getItem('categories') || '[]'); 
}

function saveCategories(cats) {
  localStorage.setItem('categories', JSON.stringify(cats));
}

function renderCategories() {
  let tbody = document.querySelector("#catTable tbody");
  if (!tbody) return;
  
  let cats = loadCategories();
  let searchInput = document.getElementById('searchCat');
  let filter = searchInput ? searchInput.value.toLowerCase() : '';
  
  let showCats = cats.filter(c => {
    let categoryName = typeof c === 'object' ? c.name : c;
    let categoryId = typeof c === 'object' ? c.id : '';
    return categoryName.toLowerCase().includes(filter) || categoryId.toLowerCase().includes(filter);
  });
  
  const isAdmin = getCurrentUser().role === "admin";
  tbody.innerHTML = '';
  
  if (showCats.length === 0) {
    let cols = isAdmin ? 2 : 1;
    tbody.innerHTML = `<tr><td colspan="${cols}"><i>No LCC Classes found.</i></td></tr>`;
    return;
  }
  
  showCats.forEach((c) => {
    let trueIdx = cats.indexOf(c);
    let displayId = typeof c === 'object' ? c.id : '';
    let displayName = typeof c === 'object' ? c.name : c;
    
    // Memaparkan kod LCC bersama nama kelas (Contoh: Z - Bibliography. Library Science)
    let fullDisplay = displayId ? `${displayId} - ${displayName}` : displayName;
    
    tbody.innerHTML += `
      <tr>
        <td>${fullDisplay}</td>
        <td class="admin-only">
          <div class="action-btns">
            <button class="edit" onclick="openCatModal(${trueIdx})"><i class="fas fa-edit"></i> Edit</button>
            <button class="del" onclick="delCat(${trueIdx})"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </td>
      </tr>`;
  });
  
  if (!isAdmin) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    let addBtn = document.getElementById('addCatBtn');
    if (addBtn) addBtn.style.display = 'none';
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    let addBtn = document.getElementById('addCatBtn');
    if (addBtn) addBtn.style.display = '';
  }
}

function openCatModal(idx) {
  const modal = document.getElementById('catModal');
  if(!modal) return;
  
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  editCatIdx = (typeof idx === 'number') ? idx : null;
  
  const titleEl = document.getElementById('catFormTitle');
  const inputEl = document.getElementById('catName');
  
  if (editCatIdx === null) {
    if(titleEl) titleEl.textContent = "Add LCC Class";
    if(inputEl) {
      inputEl.value = '';
      inputEl.placeholder = "e.g., QA - Mathematics";
    }
  } else {
    if(titleEl) titleEl.textContent = "Edit LCC Class";
    let cats = loadCategories();
    let targetCat = cats[editCatIdx];
    if(inputEl) {
      let catId = typeof targetCat === 'object' ? targetCat.id : '';
      let catName = typeof targetCat === 'object' ? targetCat.name : targetCat;
      inputEl.value = catId ? `${catId} - ${catName}` : catName;
    }
  }
}

function closeCatModal() {
  const modal = document.getElementById('catModal');
  const form = document.getElementById('catForm');
  if(modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  if(form) form.reset();
  editCatIdx = null;
}

function delCat(idx) {
  let cats = loadCategories();
  if (cats.length === 1) {
    notify("Cannot delete the last classification!", "error");
    return;
  }
  
  let targetCat = cats[idx];
  let catIdentifier = typeof targetCat === 'object' ? targetCat.id : targetCat;
  
  let books = JSON.parse(localStorage.getItem('books') || '[]');
  if (books.some(b => b.category === catIdentifier)) {
    notify("Cannot delete: In use by books.", "error");
    return;
  }
  
  if (confirm("Delete this LCC classification forever?")) {
    cats.splice(idx, 1);
    saveCategories(cats);
    renderCategories();
    notify("Classification deleted.", "info");
  }
}

// Data awal (Seed Data) berasaskan skema Library of Congress Classification (LCC)
document.addEventListener("DOMContentLoaded", function() {
  if (localStorage.getItem('categories') === null) {
    localStorage.setItem('categories', JSON.stringify([
      { id: "T", name: "Technology (General)" },
      { id: "Q", name: "Science (General)" },
      { id: "QA", name: "Mathematics. Computer Science" },
      { id: "Z", name: "Bibliography. Library Science" },
      { id: "ZA", name: "Information Resources (General)" },
      { id: "H", name: "Social Sciences" },
      { id: "HD", name: "Industries. Land use. Labor management" }
    ]));
  }
  
  renderCategories();

  const searchCat = document.getElementById('searchCat');
  if (searchCat) searchCat.oninput = renderCategories;

  const formEl = document.getElementById('catForm');
  if (formEl) {
    formEl.onsubmit = function(e) {
      e.preventDefault();
      let cats = loadCategories();
      let rawValue = document.getElementById('catName').value.trim();
      
      if (!rawValue) {
        notify("Classification input required.", "error");
        return;
      }
      
      // Logik pemisahan jika admin memasukkan format "Kod - Nama" atau hanya teks biasa
      let parts = rawValue.split(' - ');
      let id = parts[0].toUpperCase();
      let name = parts[1] || parts[0];
      
      let isDuplicate = cats.some((c, i) => {
        let cId = typeof c === 'object' ? c.id : c;
        return cId.toLowerCase() === id.toLowerCase() && i !== editCatIdx;
      });
      
      if (isDuplicate) {
        notify("LCC Class code already exists", "error");
        return;
      }
      
      if (editCatIdx === null) {
        cats.push({ id: id, name: name });
        notify("LCC Class added successfully.");
      } else {
        cats[editCatIdx] = { id: id, name: name };
        notify("LCC Class updated successfully.");
      }
      
      saveCategories(cats);
      closeCatModal();
      renderCategories();
    };
  }
});

function notify(msg, type = 'success') {
  let n = document.getElementById('notification');
  if (!n) return;
  let toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'danger' : type);
  toast.innerHTML = msg;
  n.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2400);
}

window.openCatModal = openCatModal;
window.closeCatModal = closeCatModal;
window.delCat = delCat;