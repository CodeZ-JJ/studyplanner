// ==================== USER & DATA ====================
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let tasks = JSON.parse(localStorage.getItem('studyplan_tasks')) || [
  { id: 1, title: "Complete Research Methodology Chapter 3", deadline: "2026-04-12", priority: "High", category: "Assignment", completed: false },
  { id: 2, title: "Solve 50 Calculus past questions", deadline: "2026-04-10", priority: "Medium", category: "Revision", completed: true },
  { id: 3, title: "Prepare slides for System Analysis presentation", deadline: "2026-04-15", priority: "High", category: "Project", completed: false },
  { id: 4, title: "Read Database Management notes", deadline: "2026-04-11", priority: "Low", category: "Reading", completed: false }
];

let currentView = 'dashboard';
let currentEditId = null;

// ==================== AUTH FUNCTIONS ====================
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

function registerUser() {
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  if (!fullName || !email || !password) {
    alert("All fields are required!");
    return;
  }
  const user = { fullName, email, password };
  localStorage.setItem('currentUser', JSON.stringify(user));
 
  alert("Account created successfully! You can now login.");
  showLogin();
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const savedUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (savedUser && savedUser.email === email && savedUser.password === password) {
    currentUser = savedUser;
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.fullName.split(' ')[0];
    navigate('dashboard');
  } else if (email === "justice@student.edu.ng" && password === "123456") {
    currentUser = { fullName: "Justice", email: email };
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userName').textContent = "Justice";
    navigate('dashboard');
  } else {
    alert("Invalid email or password!");
  }
}

// ==================== NAVIGATION ====================
function navigate(view) {
  currentView = view;
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById(`nav-${view}`).classList.add('active');
  document.getElementById('pageTitle').textContent =
    view === 'dashboard' ? 'Dashboard' :
    view === 'today' ? "Today's Tasks" :
    view === 'schedule' ? 'Weekly Schedule' : 'All Tasks';
  renderMainContent();
}

// ==================== RENDER MAIN CONTENT ====================
function renderMainContent() {
  const content = document.getElementById('mainContent');
  content.innerHTML = '';
  if (currentView === 'dashboard') renderDashboard(content);
  else if (currentView === 'today') renderTaskView(content, true);
  else if (currentView === 'schedule') renderSchedule(content);
  else if (currentView === 'all') renderTaskView(content, false);
}

// ==================== DASHBOARD, SCHEDULE, TASK VIEW, TASK CARD ====================
// (I kept all your functions exactly as you had them)
function renderDashboard(container) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
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
          <div class="h-3 bg-indigo-600 rounded-full" style="width: ${progress}%"></div>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Recent Tasks</h2>
      <button onclick="showAddModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-medium">
        <i class="fas fa-plus"></i> New Task
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="recentTasks"></div>
  `;
  const recentContainer = document.getElementById('recentTasks');
  tasks.slice(0, 6).forEach(task => renderTaskCard(task, recentContainer));
}

function renderSchedule(container) {
  const today = new Date();
  let html = `<h2 class="text-2xl font-semibold mb-6">Weekly Schedule</h2><div class="grid grid-cols-7 gap-4">`;
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.deadline === dateStr);
    html += `
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-5">
        <p class="font-medium text-center">${date.toLocaleDateString('en-US', {weekday:'short'})}</p>
        <p class="text-center text-sm text-gray-500">${date.getDate()}</p>
        <div class="mt-6 space-y-3 min-h-[280px]">
          ${dayTasks.length ? dayTasks.map(task => `
            <div onclick="editTask(${task.id})" class="text-sm p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}">
              ${task.title}
            </div>`).join('') : '<p class="text-gray-400 text-center py-10">No tasks this day</p>'}
        </div>
      </div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

function renderTaskView(container, todayOnly) {
  let filteredTasks = tasks;
  if (todayOnly) {
    const today = new Date().toISOString().split('T')[0];
    filteredTasks = tasks.filter(t => t.deadline === today);
  }
  container.innerHTML = `
    <div class="flex flex-wrap gap-4 mb-8">
      <input id="searchInput" onkeyup="handleSearch()" type="text" placeholder="Search tasks..."
             class="flex-1 px-5 py-3 rounded-2xl border dark:border-gray-700 focus:border-indigo-500 outline-none">
      <select onchange="handleFilter(this.value)" class="px-5 py-3 rounded-2xl border dark:border-gray-700 focus:border-indigo-500 outline-none">
        <option value="all">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
        <option value="high">High Priority</option>
      </select>
      <button onclick="showAddModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2">
        <i class="fas fa-plus"></i> New Task
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="taskGrid"></div>
  `;
  const grid = document.getElementById('taskGrid');
  filteredTasks.forEach(task => renderTaskCard(task, grid));
}

function renderTaskCard(task, container) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !task.completed && task.deadline < todayStr;
  const card = document.createElement('div');
  card.className = `task-card bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border-l-4
    ${isOverdue ? 'border-red-500' : task.priority === 'High' ? 'border-red-500' : task.priority === 'Medium' ? 'border-orange-500' : 'border-green-500'}`;
  card.innerHTML = `
    <div class="flex justify-between items-start">
      <span class="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800">${task.category}</span>
      ${isOverdue ? `<i class="fas fa-exclamation-triangle text-red-500"></i>` : ''}
    </div>
    <h3 class="font-semibold text-lg mt-4 ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</h3>
    <p class="text-sm mt-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}">
      Due: ${new Date(task.deadline).toLocaleDateString('en-GB')}
    </p>
    <div class="mt-6 flex gap-3">
      <button onclick="toggleComplete(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl ${task.completed ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-600 text-white hover:bg-green-700'}">
        ${task.completed ? '✓ Completed' : 'Mark Done'}
      </button>
      <button onclick="editTask(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl border border-gray-300 dark:border-gray-600">Edit</button>
      <button onclick="deleteTask(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl text-red-600 border border-red-200 hover:bg-red-50">Delete</button>
    </div>
  `;
  container.appendChild(card);
}

// Modal Functions
function showAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add New Task';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDeadline').value = '';
  document.getElementById('taskPriority').value = 'Medium';
  document.getElementById('taskCategory').value = 'Assignment';
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('taskModal').classList.add('hidden');
}

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const deadline = document.getElementById('taskDeadline').value;
  const priority = document.getElementById('taskPriority').value;
  const category = document.getElementById('taskCategory').value;
  if (!title || !deadline) {
    alert("Title and Deadline are required!");
    return;
  }
  if (currentEditId) {
    const task = tasks.find(t => t.id === currentEditId);
    if (task) Object.assign(task, {title, deadline, priority, category});
  } else {
    tasks.push({ id: Date.now(), title, deadline, priority, category, completed: false });
  }
  localStorage.setItem('studyplan_tasks', JSON.stringify(tasks));
  closeModal();
  renderMainContent();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDeadline').value = task.deadline;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskCategory').value = task.category;
  document.getElementById('taskModal').classList.remove('hidden');
}

function toggleComplete(id) {
  tasks = tasks.map(task => task.id === id ? {...task, completed: !task.completed} : task);
  localStorage.setItem('studyplan_tasks', JSON.stringify(tasks));
  renderMainContent();
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('studyplan_tasks', JSON.stringify(tasks));
    renderMainContent();
  }
}

function handleSearch() { renderMainContent(); }
function handleFilter() { renderMainContent(); }

// ==================== DARK MODE ====================
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

// ==================== STREAK ====================
function updateStreak() {
  const streakEl = document.getElementById('streak');
  if (streakEl) streakEl.textContent = "9 days 🔥";
}

// ==================== MOBILE SIDEBAR TOGGLE ====================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
}

// ==================== INITIALIZE ====================
window.onload = () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
  }
  updateStreak();
};
