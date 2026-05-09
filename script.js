// ==================== MULTI-USER AUTH & DATA ====================
// Users stored as array: [{ fullName, email, password }]
// Each user's data stored under their email key:
//   studyplan_tasks_<email>
//   studyplan_courses_<email>

let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

function getUserKey(type) {
  return `studyplan_${type}_${currentUser?.email || 'demo'}`;
}

function loadUserData() {
  const defaultCourses = [
    { id: 1, code: "INS 204", name: "Systems Analysis and Design",                lecturer: "Miss Hauwa Ibrahim Aminu", colour: "indigo" },
    { id: 2, code: "SEN 309", name: "Information Gathering: Interactive Methods",  lecturer: "TBA", colour: "purple" },
    { id: 3, code: "COS 202", name: "Computer Programming 2",                      lecturer: "TBA", colour: "blue"   },
    { id: 4, code: "MTH 202", name: "Mathematical Methods II",                     lecturer: "TBA", colour: "green"  }
  ];
  const defaultTasks = [
    { id: 1, title: "Complete Research Methodology Chapter 3",         deadline: "2026-04-12", priority: "High",   category: "Assignment", courseId: 1, description: "", completed: false },
    { id: 2, title: "Solve 50 Calculus past questions",                deadline: "2026-04-10", priority: "Medium", category: "Revision",   courseId: 4, description: "", completed: true  },
    { id: 3, title: "Prepare slides for System Analysis presentation", deadline: "2026-04-15", priority: "High",   category: "Project",    courseId: 1, description: "", completed: false },
    { id: 4, title: "Read Database Management notes",                  deadline: "2026-04-11", priority: "Low",    category: "Reading",    courseId: 3, description: "", completed: false }
  ];
  courses = JSON.parse(localStorage.getItem(getUserKey('courses'))) || defaultCourses;
  tasks   = JSON.parse(localStorage.getItem(getUserKey('tasks')))   || defaultTasks;
}

function saveTasksToStorage()   { localStorage.setItem(getUserKey('tasks'),   JSON.stringify(tasks));   }
function saveCoursesToStorage() { localStorage.setItem(getUserKey('courses'), JSON.stringify(courses)); }

let courses = [];
let tasks   = [];

let currentView         = 'dashboard';
let currentEditId       = null;
let currentEditCourseId = null;
let selectedColour      = 'indigo';

// ==================== POMODORO STATE ====================
const POMODORO_MODES = {
  focus:      { label: '🍅 Focus',       minutes: 25 },
  shortBreak: { label: '☕ Short Break', minutes: 5  },
  longBreak:  { label: '🛌 Long Break',  minutes: 15 }
};

let pomodoroState = {
  mode:          'focus',
  secondsLeft:   25 * 60,
  isRunning:     false,
  sessionsToday: 0,
  linkedTaskId:  null,
  interval:      null
};

function getPomodoroKey() { return `pomo_sessions_${currentUser?.email || 'demo'}`; }

// ==================== AUTH ====================
function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginTab').classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
  document.getElementById('registerTab').classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
}

function showRegister() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('registerTab').classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
  document.getElementById('loginTab').classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
}

function getUsers() {
  return JSON.parse(localStorage.getItem('studyplan_users')) || [];
}

function saveUsers(users) {
  localStorage.setItem('studyplan_users', JSON.stringify(users));
}

function registerUser() {
  const fullName = document.getElementById('regFullName').value.trim();
  const email    = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value.trim();
  if (!fullName || !email || !password) { alert("All fields are required!"); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    alert("An account with this email already exists. Please login.");
    showLogin();
    return;
  }

  users.push({ fullName, email, password });
  saveUsers(users);
  alert("Account created successfully! You can now login.");
  document.getElementById('loginEmail').value    = email;
  document.getElementById('loginPassword').value = password;
  showLogin();
}

function login() {
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value.trim();

  // Demo account
  if (email === "justice@student.edu.ng" && password === "123456") {
    currentUser = { fullName: "Justice Eze", email };
    startSession();
    return;
  }

  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === password);
  if (found) {
    currentUser = found;
    startSession();
  } else {
    alert("Invalid email or password!");
  }
}

function startSession() {
  sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
  pomodoroState.sessionsToday = parseInt(localStorage.getItem(getPomodoroKey()) || '0');
  loadUserData();

  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser.fullName.split(' ')[0];

  // Show logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.classList.remove('hidden');

  checkDueTaskNotifications();
  navigate('dashboard');
}

function logout() {
  if (!confirm("Are you sure you want to log out?")) return;

  // Stop any running pomodoro
  if (pomodoroState.isRunning) {
    clearInterval(pomodoroState.interval);
    pomodoroState.isRunning = false;
  }

  sessionStorage.removeItem('currentUser');
  currentUser = null;
  tasks       = [];
  courses     = [];
  document.title = 'StudyPlan - Smart Study Planner';

  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authPage').classList.remove('hidden');

  // Reset login form
  document.getElementById('loginEmail').value    = 'justice@student.edu.ng';
  document.getElementById('loginPassword').value = '123456';
  showLogin();
}

// ==================== NAVIGATION ====================
function navigate(view) {
  currentView = view;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`nav-${view}`).classList.add('active');
  const titles = {
    dashboard: 'Dashboard', today: "Today's Tasks", schedule: 'Weekly Schedule',
    all: 'All Tasks', courses: 'My Courses', pomodoro: 'Pomodoro Timer', analytics: 'Analytics'
  };
  document.getElementById('pageTitle').textContent = titles[view] || 'Dashboard';
  renderMainContent();
}

// ==================== RENDER ====================
function renderMainContent() {
  const content = document.getElementById('mainContent');
  content.innerHTML = '';
  if      (currentView === 'dashboard') renderDashboard(content);
  else if (currentView === 'today')     renderTaskView(content, true);
  else if (currentView === 'schedule')  renderSchedule(content);
  else if (currentView === 'all')       renderTaskView(content, false);
  else if (currentView === 'courses')   renderCourses(content);
  else if (currentView === 'pomodoro')  renderPomodoro(content);
  else if (currentView === 'analytics') renderAnalytics(content);
}

// ==================== DASHBOARD ====================
function renderDashboard(container) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const progress  = total ? Math.round((completed / total) * 100) : 0;

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <p class="text-gray-500 dark:text-gray-400">Total Tasks</p>
        <p class="text-5xl font-bold mt-2">${total}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <p class="text-gray-500 dark:text-gray-400">Completed</p>
        <p class="text-5xl font-bold mt-2 text-green-600">${completed}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <p class="text-gray-500 dark:text-gray-400">Pending</p>
        <p class="text-5xl font-bold mt-2 text-orange-600">${total - completed}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <p class="text-gray-500 dark:text-gray-400">Progress</p>
        <p class="text-5xl font-bold mt-2">${progress}%</p>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-4">
          <div class="h-3 bg-indigo-600 rounded-full" style="width:${progress}%"></div>
        </div>
      </div>
    </div>
    <div class="mb-10">
      <h2 class="text-2xl font-semibold mb-4">My Courses</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboardCourses"></div>
    </div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Recent Tasks</h2>
      <button onclick="showAddModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-medium">
        <i class="fas fa-plus"></i> New Task
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="recentTasks"></div>
  `;

  const dashCourses = document.getElementById('dashboardCourses');
  courses.forEach(course => {
    const ct   = tasks.filter(t => t.courseId === course.id);
    const done = ct.filter(t => t.completed).length;
    const div  = document.createElement('div');
    div.className = 'bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition';
    div.onclick   = () => navigate('courses');
    div.innerHTML = `
      <div class="w-12 h-12 rounded-2xl course-${course.colour} flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        ${course.code.split(' ')[0]}
      </div>
      <div class="min-w-0">
        <p class="font-semibold text-sm truncate">${course.code}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${course.name}</p>
        <p class="text-xs text-indigo-600 mt-1">${done}/${ct.length} tasks done</p>
      </div>
    `;
    dashCourses.appendChild(div);
  });

  tasks.slice(0, 6).forEach(task => renderTaskCard(task, document.getElementById('recentTasks')));
}

// ==================== ANALYTICS ====================
function renderAnalytics(container) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending   = total - completed;
  const todayStr  = new Date().toISOString().split('T')[0];
  const overdue   = tasks.filter(t => !t.completed && t.deadline < todayStr).length;
  const sessions  = pomodoroState.sessionsToday;
  const studyMins = sessions * 25;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), date: ds, count: tasks.filter(t => t.completed && t.deadline === ds).length });
  }
  const maxCount = Math.max(...days.map(d => d.count), 1);

  const barChart = days.map(d => {
    const pct = Math.round((d.count / maxCount) * 100);
    return `
      <div class="flex flex-col items-center gap-2 flex-1">
        <span class="text-xs font-medium text-gray-500">${d.count || ''}</span>
        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-xl flex items-end" style="height:120px">
          <div class="w-full rounded-xl bg-indigo-500 transition-all duration-700" style="height:${Math.max(pct, d.count ? 6 : 0)}%"></div>
        </div>
        <span class="text-xs text-gray-500">${d.label}</span>
      </div>`;
  }).join('');

  const rate       = total ? Math.round((completed / total) * 100) : 0;
  const radius     = 54;
  const circ       = 2 * Math.PI * radius;
  const doneOffset = circ * (1 - rate / 100);

  const categories = ['Assignment','Exam','Reading','Revision','Project','Other'];
  const catColours = ['#6366f1','#f97316','#22c55e','#a855f7','#3b82f6','#9ca3af'];
  const catData    = categories.map((cat, i) => ({ cat, count: tasks.filter(t => t.category === cat).length, colour: catColours[i] })).filter(c => c.count > 0);

  const catBars = catData.map(c => {
    const pct = total ? Math.round((c.count / total) * 100) : 0;
    return `
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full inline-block" style="background:${c.colour}"></span>${c.cat}
          </span>
          <span class="font-medium">${c.count} task${c.count > 1 ? 's' : ''}</span>
        </div>
        <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
          <div class="h-2 rounded-full transition-all duration-700" style="width:${pct}%;background:${c.colour}"></div>
        </div>
      </div>`;
  }).join('');

  const coursePerf = courses.map(course => {
    const ct  = tasks.filter(t => t.courseId === course.id);
    const done = ct.filter(t => t.completed).length;
    const pct  = ct.length ? Math.round((done / ct.length) * 100) : 0;
    return { course, ct, done, pct };
  }).filter(c => c.ct.length > 0);

  const courseBars = coursePerf.map(({ course, ct, done, pct }) => `
    <div>
      <div class="flex justify-between text-sm mb-1">
        <span class="font-medium">${course.code}</span>
        <span class="text-gray-500">${done}/${ct.length} — ${pct}%</span>
      </div>
      <div class="h-3 bg-gray-100 dark:bg-gray-700 rounded-full">
        <div class="h-3 rounded-full course-${course.colour} transition-all duration-700" style="width:${pct}%"></div>
      </div>
    </div>`).join('');

  const dates  = [...new Set(tasks.filter(t => t.completed).map(t => t.deadline).filter(Boolean))].sort().reverse();
  let streak   = 0;
  const today2 = new Date();
  for (let i = 0; i < dates.length; i++) {
    const exp = new Date(today2);
    exp.setDate(today2.getDate() - i);
    if (dates[i] === exp.toISOString().split('T')[0]) streak++;
    else break;
  }

  container.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm text-center">
        <p class="text-3xl font-bold text-indigo-600">${completed}</p>
        <p class="text-sm text-gray-500 mt-1">Tasks Done</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm text-center">
        <p class="text-3xl font-bold text-orange-500">${overdue}</p>
        <p class="text-sm text-gray-500 mt-1">Overdue</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm text-center">
        <p class="text-3xl font-bold text-green-500">${sessions}</p>
        <p class="text-sm text-gray-500 mt-1">Pomodoro Sessions</p>
      </div>
      <div class="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm text-center">
        <p class="text-3xl font-bold text-purple-500">${streak} 🔥</p>
        <p class="text-sm text-gray-500 mt-1">Day Streak</p>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <h3 class="font-semibold text-lg mb-6">Tasks Completed — Last 7 Days</h3>
        <div class="flex gap-3 items-end">${barChart}</div>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center">
        <h3 class="font-semibold text-lg mb-6 self-start">Overall Completion Rate</h3>
        <div class="relative" style="width:140px;height:140px;">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="16"/>
            <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#4f46e5" stroke-width="16"
                    stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${doneOffset}"
                    transform="rotate(-90 70 70)"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p class="text-3xl font-bold">${rate}%</p>
            <p class="text-xs text-gray-400">complete</p>
          </div>
        </div>
        <div class="flex gap-6 mt-6 text-sm">
          <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-indigo-500"></span>Done (${completed})</span>
          <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-200"></span>Pending (${pending})</span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <h3 class="font-semibold text-lg mb-6">Tasks by Category</h3>
        <div class="space-y-4">${catBars || '<p class="text-gray-400 text-sm">No tasks yet</p>'}</div>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
        <h3 class="font-semibold text-lg mb-6">Performance by Course</h3>
        <div class="space-y-4">${courseBars || '<p class="text-gray-400 text-sm">No course tasks yet</p>'}</div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm">
      <h3 class="font-semibold text-lg mb-4">Study Time Summary</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div><p class="text-2xl font-bold text-indigo-600">${studyMins}</p><p class="text-sm text-gray-500">Total Minutes</p></div>
        <div><p class="text-2xl font-bold text-indigo-600">${(studyMins / 60).toFixed(1)}</p><p class="text-sm text-gray-500">Hours Studied</p></div>
        <div><p class="text-2xl font-bold text-indigo-600">${sessions}</p><p class="text-sm text-gray-500">Focus Sessions</p></div>
        <div><p class="text-2xl font-bold text-indigo-600">${streak}</p><p class="text-sm text-gray-500">Day Streak</p></div>
      </div>
    </div>
  `;
}

// ==================== COURSES ====================
function renderCourses(container) {
  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">My Courses</h2>
      <button onclick="showAddCourseModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-medium">
        <i class="fas fa-plus"></i> Add Course
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courseGrid"></div>
  `;
  const grid = document.getElementById('courseGrid');
  if (!courses.length) { grid.innerHTML = `<p class="text-gray-400 col-span-3 text-center py-16">No courses yet.</p>`; return; }
  courses.forEach(course => {
    const ct       = tasks.filter(t => t.courseId === course.id);
    const done     = ct.filter(t => t.completed).length;
    const progress = ct.length ? Math.round((done / ct.length) * 100) : 0;
    const card     = document.createElement('div');
    card.className = 'course-card bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden';
    card.innerHTML = `
      <div class="h-3 course-${course.colour}"></div>
      <div class="p-6">
        <span class="text-xs font-bold px-3 py-1 rounded-full text-white course-${course.colour}">${course.code}</span>
        <h3 class="font-semibold text-lg mt-3">${course.name}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1"><i class="fas fa-chalkboard-teacher mr-1"></i>${course.lecturer}</p>
        <div class="mt-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-500">Tasks</span>
            <span class="font-medium">${done}/${ct.length} done</span>
          </div>
          <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <div class="h-2 rounded-full course-${course.colour}" style="width:${progress}%"></div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="filterByCourseTasks(${course.id})" class="flex-1 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium hover:bg-indigo-100">View Tasks</button>
          <button onclick="editCourse(${course.id})" class="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50">Edit</button>
          <button onclick="deleteCourse(${course.id})" class="py-3 px-4 rounded-2xl text-red-500 border border-red-100 hover:bg-red-50 text-sm"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterByCourseTasks(courseId) {
  navigate('all');
  setTimeout(() => { const s = document.getElementById('courseFilterSelect'); if (s) { s.value = courseId; refreshGrid(); } }, 50);
}

// ==================== SCHEDULE ====================
function renderSchedule(container) {
  const today = new Date();
  let html = `<h2 class="text-2xl font-semibold mb-6">Weekly Schedule</h2><div class="grid grid-cols-7 gap-4">`;
  for (let i = 0; i < 7; i++) {
    const date    = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayT    = tasks.filter(t => t.deadline === dateStr);
    html += `
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-5">
        <p class="font-medium text-center">${date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
        <p class="text-center text-sm text-gray-500">${date.getDate()}</p>
        <div class="mt-6 space-y-3 min-h-[280px]">
          ${dayT.length ? dayT.map(task => {
            const c = courses.find(c => c.id === task.courseId);
            return `<div onclick="editTask(${task.id})" class="text-sm p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}">
              ${c ? `<span class="text-xs font-bold text-white course-${c.colour} px-2 py-0.5 rounded-full">${c.code}</span><br>` : ''}
              <span class="mt-1 block">${task.title}</span>
            </div>`;
          }).join('') : '<p class="text-gray-400 text-center py-10">No tasks</p>'}
        </div>
      </div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// ==================== TASK VIEW ====================
function renderTaskView(container, todayOnly) {
  let filtered = tasks;
  if (todayOnly) { const today = new Date().toISOString().split('T')[0]; filtered = tasks.filter(t => t.deadline === today); }
  const courseOptions = courses.map(c => `<option value="${c.id}">${c.code} — ${c.name}</option>`).join('');
  container.innerHTML = `
    <div class="flex flex-wrap gap-4 mb-8">
      <input id="searchInput" onkeyup="refreshGrid()" type="text" placeholder="Search tasks..."
             class="flex-1 px-5 py-3 rounded-2xl border dark:border-gray-700 focus:border-indigo-500 outline-none">
      <select id="filterSelect" onchange="refreshGrid()" class="px-5 py-3 rounded-2xl border dark:border-gray-700 focus:border-indigo-500 outline-none">
        <option value="all">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
        <option value="high">High Priority</option>
      </select>
      <select id="courseFilterSelect" onchange="refreshGrid()" class="px-5 py-3 rounded-2xl border dark:border-gray-700 focus:border-indigo-500 outline-none">
        <option value="">All Courses</option>
        ${courseOptions}
      </select>
      <button onclick="showAddModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2">
        <i class="fas fa-plus"></i> New Task
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="taskGrid"></div>
  `;
  const grid = document.getElementById('taskGrid');
  filtered.forEach(task => renderTaskCard(task, grid));
}

function applyFilter(list, value, todayStr) {
  if (value === 'pending')   return list.filter(t => !t.completed);
  if (value === 'completed') return list.filter(t => t.completed);
  if (value === 'overdue')   return list.filter(t => !t.completed && t.deadline < todayStr);
  if (value === 'high')      return list.filter(t => t.priority === 'High');
  return list;
}

function refreshGrid() {
  const grid      = document.getElementById('taskGrid');
  if (!grid) return;
  const query     = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const filterVal = document.getElementById('filterSelect')?.value || 'all';
  const courseVal = document.getElementById('courseFilterSelect')?.value || '';
  const todayStr  = new Date().toISOString().split('T')[0];
  let result      = tasks.filter(t => t.title.toLowerCase().includes(query));
  result          = applyFilter(result, filterVal, todayStr);
  if (courseVal)  result = result.filter(t => t.courseId === parseInt(courseVal));
  grid.innerHTML  = '';
  result.forEach(task => renderTaskCard(task, grid));
}

// ==================== TASK CARD ====================
function renderTaskCard(task, container) {
  const todayStr  = new Date().toISOString().split('T')[0];
  const isOverdue = !task.completed && task.deadline < todayStr;
  const course    = courses.find(c => c.id === task.courseId);
  const card      = document.createElement('div');
  card.className  = `task-card bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border-l-4
    ${isOverdue ? 'border-red-500' : task.priority === 'High' ? 'border-red-500' : task.priority === 'Medium' ? 'border-orange-500' : 'border-green-500'}`;
  card.innerHTML = `
    <div class="flex justify-between items-start flex-wrap gap-2">
      <span class="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800">${task.category}</span>
      ${course ? `<span class="px-3 py-1 text-xs font-bold rounded-full text-white course-${course.colour}">${course.code}</span>` : ''}
      ${isOverdue ? `<i class="fas fa-exclamation-triangle text-red-500"></i>` : ''}
    </div>
    <h3 class="font-semibold text-lg mt-4 ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</h3>
    ${task.description ? `<p class="text-sm text-gray-400 mt-1 line-clamp-2">${task.description}</p>` : ''}
    <p class="text-sm mt-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}">Due: ${new Date(task.deadline).toLocaleDateString('en-GB')}</p>
    <div class="mt-6 flex gap-3">
      <button onclick="toggleComplete(${task.id}); event.stopImmediatePropagation()"
              class="flex-1 py-3 rounded-2xl ${task.completed ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-600 text-white hover:bg-green-700'}">
        ${task.completed ? '✓ Done' : 'Mark Done'}
      </button>
      <button onclick="editTask(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl border border-gray-300 dark:border-gray-600">Edit</button>
      <button onclick="startPomodoroForTask(${task.id}); event.stopImmediatePropagation()"
              class="py-3 px-3 rounded-2xl text-indigo-600 border border-indigo-200 hover:bg-indigo-50 text-sm" title="Start Pomodoro">🍅</button>
      <button onclick="deleteTask(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl text-red-600 border border-red-200 hover:bg-red-50">Delete</button>
    </div>
  `;
  container.appendChild(card);
}

// ==================== TASK MODAL ====================
function populateCourseDropdown(selectedId) {
  const select = document.getElementById('taskCourse');
  select.innerHTML = '<option value="">-- No Course --</option>';
  courses.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = `${c.code} — ${c.name}`;
    if (c.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });
}

function showAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent  = 'Add New Task';
  document.getElementById('taskTitle').value         = '';
  document.getElementById('taskDeadline').value      = '';
  document.getElementById('taskPriority').value      = 'Medium';
  document.getElementById('taskCategory').value      = 'Assignment';
  document.getElementById('taskDescription').value   = '';
  populateCourseDropdown(null);
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeModal() { document.getElementById('taskModal').classList.add('hidden'); }

function saveTask() {
  const title       = document.getElementById('taskTitle').value.trim();
  const deadline    = document.getElementById('taskDeadline').value;
  const priority    = document.getElementById('taskPriority').value;
  const category    = document.getElementById('taskCategory').value;
  const description = document.getElementById('taskDescription').value.trim();
  const courseId    = parseInt(document.getElementById('taskCourse').value) || null;
  if (!title || !deadline) { alert("Title and Deadline are required!"); return; }
  if (currentEditId) {
    const task = tasks.find(t => t.id === currentEditId);
    if (task) Object.assign(task, { title, deadline, priority, category, description, courseId });
  } else {
    tasks.push({ id: Date.now(), title, deadline, priority, category, description, courseId, completed: false });
  }
  saveTasksToStorage();
  closeModal(); renderMainContent(); updateStreak();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  currentEditId = id;
  document.getElementById('modalTitle').textContent  = 'Edit Task';
  document.getElementById('taskTitle').value         = task.title;
  document.getElementById('taskDeadline').value      = task.deadline;
  document.getElementById('taskPriority').value      = task.priority;
  document.getElementById('taskCategory').value      = task.category;
  document.getElementById('taskDescription').value   = task.description || '';
  populateCourseDropdown(task.courseId);
  document.getElementById('taskModal').classList.remove('hidden');
}

function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasksToStorage(); renderMainContent(); updateStreak();
}

function deleteTask(id) {
  if (confirm("Delete this task?")) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToStorage(); renderMainContent(); updateStreak();
  }
}

// ==================== COURSE MODAL ====================
function selectColour(colour) {
  selectedColour = colour;
  document.querySelectorAll('.colour-btn').forEach(btn => btn.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

function showAddCourseModal() {
  currentEditCourseId = null; selectedColour = 'indigo';
  document.getElementById('courseModalTitle').textContent = 'Add Course';
  document.getElementById('courseCode').value = ''; document.getElementById('courseName').value = ''; document.getElementById('courseLecturer').value = '';
  document.querySelectorAll('.colour-btn').forEach((btn, i) => btn.classList.toggle('selected', i === 0));
  document.getElementById('courseModal').classList.remove('hidden');
}

function closeCourseModal() { document.getElementById('courseModal').classList.add('hidden'); }

function saveCourse() {
  const code = document.getElementById('courseCode').value.trim();
  const name = document.getElementById('courseName').value.trim();
  const lecturer = document.getElementById('courseLecturer').value.trim();
  if (!code || !name) { alert("Course code and name are required!"); return; }
  if (currentEditCourseId) {
    const course = courses.find(c => c.id === currentEditCourseId);
    if (course) Object.assign(course, { code, name, lecturer, colour: selectedColour });
  } else {
    courses.push({ id: Date.now(), code, name, lecturer, colour: selectedColour });
  }
  saveCoursesToStorage(); closeCourseModal(); renderMainContent();
}

function editCourse(id) {
  const course = courses.find(c => c.id === id);
  if (!course) return;
  currentEditCourseId = id; selectedColour = course.colour;
  document.getElementById('courseModalTitle').textContent = 'Edit Course';
  document.getElementById('courseCode').value = course.code;
  document.getElementById('courseName').value = course.name;
  document.getElementById('courseLecturer').value = course.lecturer;
  document.querySelectorAll('.colour-btn').forEach(btn => {
    const match = btn.getAttribute('onclick').match(/'(\w+)'/);
    btn.classList.toggle('selected', match && match[1] === course.colour);
  });
  document.getElementById('courseModal').classList.remove('hidden');
}

function deleteCourse(id) {
  if (confirm("Delete this course?")) {
    courses = courses.filter(c => c.id !== id);
    tasks   = tasks.map(t => t.courseId === id ? { ...t, courseId: null } : t);
    saveCoursesToStorage(); saveTasksToStorage(); renderMainContent();
  }
}

// ==================== POMODORO ====================
function renderPomodoro(container) {
  const taskOptions   = tasks.filter(t => !t.completed).map(t => `<option value="${t.id}">${t.title}</option>`).join('');
  const totalSeconds  = POMODORO_MODES[pomodoroState.mode].minutes * 60;
  const radius        = 110;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference * (1 - pomodoroState.secondsLeft / totalSeconds);
  const dots          = Array.from({ length: 4 }, (_, i) => `<div class="session-dot ${i < (pomodoroState.sessionsToday % 4) ? 'done' : ''}"></div>`).join('');
  const linkedTask    = tasks.find(t => t.id === pomodoroState.linkedTaskId);

  container.innerHTML = `
    <div class="max-w-lg mx-auto">
      <div class="flex gap-3 mb-8 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm">
        ${Object.entries(POMODORO_MODES).map(([key, val]) => `
          <button onclick="setPomodoroMode('${key}')" class="timer-mode-btn flex-1 py-3 rounded-xl text-sm font-medium ${pomodoroState.mode === key ? 'active' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}">${val.label}</button>`).join('')}
      </div>
      <div class="flex flex-col items-center mb-8">
        <div class="relative ${pomodoroState.isRunning ? 'timer-running' : ''}" style="width:260px;height:260px;">
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="12"/>
            <circle id="timerRing" cx="130" cy="130" r="${radius}" fill="none" stroke="#4f46e5" stroke-width="12"
                    stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" class="pomodoro-ring"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p id="timerDisplay" class="text-6xl font-bold tracking-tight">${formatTime(pomodoroState.secondsLeft)}</p>
            <p class="text-sm text-gray-500 mt-1">${POMODORO_MODES[pomodoroState.mode].label}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6 items-center">${dots}<span class="text-sm text-gray-500 ml-2">${pomodoroState.sessionsToday} sessions today</span></div>
      </div>
      <div class="flex gap-4 mb-8">
        <button onclick="togglePomodoro()" class="flex-1 py-4 rounded-2xl font-semibold text-lg ${pomodoroState.isRunning ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}">
          ${pomodoroState.isRunning ? '<i class="fas fa-pause mr-2"></i>Pause' : '<i class="fas fa-play mr-2"></i>Start'}
        </button>
        <button onclick="resetPomodoro()" class="py-4 px-6 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"><i class="fas fa-redo"></i></button>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm mb-6">
        <label class="block text-sm font-medium mb-2">🔗 Studying for...</label>
        <select id="linkedTaskSelect" onchange="linkPomodoroTask(this.value)" class="w-full px-4 py-3 rounded-xl border dark:border-gray-700">
          <option value="">-- Select a task (optional) --</option>${taskOptions}
        </select>
        ${linkedTask ? `<p class="text-sm text-indigo-600 mt-2 font-medium">Currently: ${linkedTask.title}</p>` : ''}
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
        <h3 class="font-semibold mb-3">How Pomodoro works</h3>
        <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <p>🍅 Work for <strong>25 minutes</strong> without distractions</p>
          <p>☕ Take a <strong>5-minute</strong> short break</p>
          <p>🔄 After <strong>4 sessions</strong>, take a 15-minute long break</p>
          <p>🔥 Each completed session adds to your streak</p>
        </div>
      </div>
    </div>
  `;
  if (pomodoroState.linkedTaskId) { const sel = document.getElementById('linkedTaskSelect'); if (sel) sel.value = pomodoroState.linkedTaskId; }
}

function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

function setPomodoroMode(mode) {
  if (pomodoroState.isRunning) { clearInterval(pomodoroState.interval); pomodoroState.isRunning = false; }
  pomodoroState.mode = mode; pomodoroState.secondsLeft = POMODORO_MODES[mode].minutes * 60; renderMainContent();
}

function togglePomodoro() {
  if (pomodoroState.isRunning) { clearInterval(pomodoroState.interval); pomodoroState.isRunning = false; renderMainContent(); }
  else { requestNotificationPermission(); pomodoroState.isRunning = true; pomodoroState.interval = setInterval(tickPomodoro, 1000); renderMainContent(); }
}

function tickPomodoro() {
  pomodoroState.secondsLeft--;
  const display = document.getElementById('timerDisplay');
  const ring    = document.getElementById('timerRing');
  if (display) display.textContent = formatTime(pomodoroState.secondsLeft);
  if (ring) { const circ = 2 * Math.PI * 110; ring.style.strokeDashoffset = circ * (1 - pomodoroState.secondsLeft / (POMODORO_MODES[pomodoroState.mode].minutes * 60)); }
  document.title = `${formatTime(pomodoroState.secondsLeft)} — StudyPlan`;
  if (pomodoroState.secondsLeft <= 0) { clearInterval(pomodoroState.interval); pomodoroState.isRunning = false; document.title = 'StudyPlan - Smart Study Planner'; onPomodoroComplete(); }
}

function onPomodoroComplete() {
  if (pomodoroState.mode === 'focus') {
    pomodoroState.sessionsToday++;
    localStorage.setItem(getPomodoroKey(), pomodoroState.sessionsToday);
    sendNotification('🍅 Focus session complete!', 'Great work! Time for a break.');
    const next = pomodoroState.sessionsToday % 4 === 0 ? 'longBreak' : 'shortBreak';
    pomodoroState.mode = next; pomodoroState.secondsLeft = POMODORO_MODES[next].minutes * 60;
  } else {
    sendNotification('☕ Break over!', 'Ready for another focus session?');
    pomodoroState.mode = 'focus'; pomodoroState.secondsLeft = POMODORO_MODES['focus'].minutes * 60;
  }
  playBeep(); updateStreak(); renderMainContent();
}

function resetPomodoro() {
  clearInterval(pomodoroState.interval); pomodoroState.isRunning = false;
  pomodoroState.secondsLeft = POMODORO_MODES[pomodoroState.mode].minutes * 60;
  document.title = 'StudyPlan - Smart Study Planner'; renderMainContent();
}

function linkPomodoroTask(val) { pomodoroState.linkedTaskId = parseInt(val) || null; }

function startPomodoroForTask(taskId) {
  pomodoroState.linkedTaskId = taskId; pomodoroState.mode = 'focus';
  pomodoroState.secondsLeft = 25 * 60; pomodoroState.isRunning = false; navigate('pomodoro');
}

// ==================== NOTIFICATIONS ====================
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}
function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
}
function checkDueTaskNotifications() {
  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = tasks.filter(t => !t.completed && t.deadline === todayStr);
  const overdue  = tasks.filter(t => !t.completed && t.deadline < todayStr);
  if (dueToday.length || overdue.length) {
    requestNotificationPermission();
    setTimeout(() => {
      if (dueToday.length) sendNotification(`📅 ${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today!`, dueToday.map(t => t.title).join(', '));
      if (overdue.length)  sendNotification(`⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`, overdue.map(t => t.title).join(', '));
    }, 1500);
  }
}

// ==================== BEEP ====================
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1);
  } catch (e) {}
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

// ==================== STREAK ====================
function updateStreak() {
  const streakEl = document.getElementById('streak');
  if (!streakEl) return;
  const dates = [...new Set(tasks.filter(t => t.completed).map(t => t.deadline).filter(Boolean))].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const exp = new Date(today); exp.setDate(today.getDate() - i);
    if (dates[i] === exp.toISOString().split('T')[0]) streak++; else break;
  }
  streakEl.textContent = streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} 🔥` : '0 days';
}

// ==================== SIDEBAR ====================
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }

// ==================== INIT ====================
window.onload = () => {
  if (localStorage.getItem('darkMode') === 'true') document.documentElement.classList.add('dark');

  // Resume session if still active
  if (currentUser) {
    loadUserData();
    pomodoroState.sessionsToday = parseInt(localStorage.getItem(getPomodoroKey()) || '0');
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.fullName.split(' ')[0];
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    navigate('dashboard');
  }

  updateStreak();
};
