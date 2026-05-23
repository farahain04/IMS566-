// ==========================================================================
// 1. DYNAMIC CORE DATABASE LOADING
// ==========================================================================
let users = JSON.parse(localStorage.getItem('users') || '[]');

if (users.length === 0) {
  users = [
    { username: "admin", password: "admin123", role: "admin", name: "Administrator", email: "admin@university.edu.my" },
    { username: "user1", password: "user123", role: "user", name: "User One", email: "student@university.edu.my" }
  ];
  // Sync it to localStorage right away so register.html sees it too
  localStorage.setItem('users', JSON.stringify(users));
}

// ==========================================================================
// 2. SESSION LIFECYCLE MANAGEMENT
// ==========================================================================
function storeUserSession(user) {
  localStorage.setItem('user', JSON.stringify({
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email || '', // CRITICAL FIX: Retain email so profile settings can display it!
    loginTime: Date.now()
  }));
}

// ==========================================================================
// 3. LOGIN INTERACTION CONTROLLER
// ==========================================================================
if(document.getElementById('loginForm')) {
  document.getElementById('loginForm').onsubmit = function(e){
    e.preventDefault();
    let uname = document.getElementById('username').value.trim();
    let pwd = document.getElementById('password').value;
    let role = document.getElementById('userRole').value;

    // Reload users array fresh in case a user just registered
    users = JSON.parse(localStorage.getItem('users') || '[]');

    // Search the live database array checking both password variants
    let user = users.find(u => 
      u.username.toLowerCase() === uname.toLowerCase() && 
      (u.password === pwd || u.pass === pwd) && 
      u.role === role
    );

    if(user){
      storeUserSession(user);
      document.getElementById('loginMsg').innerHTML = `<span style="color:#26a69a">Login successful! Redirecting…</span>`;
      setTimeout(()=>{ window.location.href = "dashboard.html"; }, 1000);
    } else {
      document.getElementById('loginMsg').innerHTML = `<span style="color:#f43f5e;">Invalid credentials or role selected.</span>`;
    }
  };
}

// ==========================================================================
// 4. ROUTE GUARD PROTECTION UTILITIES
// ==========================================================================
function requireAuth(allowedRoles) {
  const user = JSON.parse(localStorage.getItem('user')||'null');
  if(!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    window.location.href = "login.html";
    return false;
  }
  return user;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user')||'null');
}