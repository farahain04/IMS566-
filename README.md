====================================================================
                   LIBRARY LMS - WEB APPLICATION
====================================================================

PROJECT OVERVIEW
-----------------
This is a client-side Library Management System (LMS) built for the 
IMS566 Individual Project Assignment. It operates entirely in the 
browser using HTML, CSS, JavaScript, and LocalStorage for data 
persistence, requiring no backend database configuration.

KEY FEATURES
-----------------
* Authentication System: Role-based login (Admin vs. Librarian Staff).
* Dynamic Dashboard: Interactive Chart.js analytics tracking monthly borrows/returns.
* Books Management: Add, edit, delete, and search the library catalog.
* Issue/Return Ledger: Track active borrows, automatically calculate late fines (RM 0.20/day), and process returns.
* Profile Settings: Manage user details, roles, and passwords.
* UI/UX Enhancements: Full Dark Mode toggle, responsive design, and toast notifications.

HOW TO RUN THE SYSTEM
-----------------
1. Extract the project folder.
2. Open `login.html` in any modern web browser (Chrome, Edge, Safari, Firefox).
3. Log in using the default credentials.
4. Note: Do not clear your browser cache/history, as the system relies on LocalStorage to save your data.

DEFAULT CREDENTIALS
-----------------
Admin Account
- Username: admin
- Password: (Check your initial setup or use the one registered in your system)

User Account (Librarian Staff)
- Username: user
- Password: (Check your initial setup)

FILE STRUCTURE
-----------------
/css/        - Contains style.css and darkmode.css
/js/         - Core logic (auth.js, main.js, books.js, borrow.js, return.js, chart.js)
*.html       - Frontend interface pages (dashboard, borrow, return, etc.)

CREDITS
-----------------
Developed for Universiti Teknologi MARA (UiTM)
====================================================================
