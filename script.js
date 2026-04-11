let tasks = JSON.parse(localStorage.getItem('studyplan_tasks')) || [
  { id: 1, title: "Complete Research Methodology Chapter 3", deadline: "2026-04-12", priority: "High", category: "Assignment", completed: false },
  { id: 2, title: "Solve 50 Calculus past questions", deadline: "2026-04-10", priority: "Medium", category: "Revision", completed: true },
  { id: 3, title: "Prepare slides for System Analysis presentation", deadline: "2026-04-15", priority: "High", category: "Project", completed: false },
  { id: 4, title: "Read Database Management notes", deadline: "2026-04-11", priority: "Low", category: "Reading", completed: false }
];

let currentView = 'dashboard';
let currentEditId = null;
let searchTerm = '';
let currentFilter = 'all';

// Navigation
function navigate(view) {
  currentView = view;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.nav-link')[['dashboard','today','schedule','all'].indexOf(view)].classList.add('active');
  
  document.getElementById('pageTitle').textContent = 
    view === 'dashboard' ? 'Dashboard' :
    view === 'today' ? "Today's Tasks" :
    view === 'schedule' ? 'Weekly Schedule' : 'All Tasks';

  renderMainContent();
}

function login() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  renderMainContent();
}

// Render Main Content
function renderMainContent() {
  const content = document.getElementById('mainContent');
  content.innerHTML = '';

  if (currentView === 'dashboard') renderDashboard(content);
  else if (currentView === 'today') renderTaskView(content, true);
  else if (currentView === 'schedule') renderSchedule(content);
  else renderTaskView(content, false);
}

// Dashboard
function renderDashboard(container) { /* Same as previous version - kept clean */ 
  // (I'll keep it short here - you can copy from previous message if needed)
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl"><p class="text-gray-500">Total</p><p class="text-5xl font-bold">${total}</p></div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl"><p class="text-gray-500">Completed</p><p class="text-5xl font-bold text-green-600">${completed}</p></div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl"><p class="text-gray-500">Pending</p><p class="text-5xl font-bold text-orange-600">${total-completed}</p></div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl"><p class="text-gray-500">Progress</p><p class="text-5xl font-bold">${progress}%</p></div>
    </div>
    <div class="flex justify-between mb-6"><h2 class="text-2xl font-semibold">Recent Tasks</h2>
      <button onclick="showAddModal()" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl">+ New Task</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="recent"></div>
  `;
  const recent = document.getElementById('recent');
  tasks.slice(0,6).forEach(t => renderTaskCard(t, recent));
}

// Weekly Schedule View
function renderSchedule(container) {
  const today = new Date();
  let html = `<h2 class="text-2xl font-semibold mb-6">Weekly Schedule</h2><div class="grid grid-cols-7 gap-4">`;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.deadline === dateStr);

    html += `
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-4">
        <p class="font-medium text-center">${date.toLocaleDateString('en-US', {weekday:'short'})}</p>
        <p class="text-center text-sm text-gray-500">${date.getDate()}</p>
        <div class="mt-4 space-y-3 min-h-[300px]">
          ${dayTasks.length ? dayTasks.map(task => `
            <div onclick="editTask(${task.id})" class="text-xs p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}">
              ${task.title.substring(0,35)}...
            </div>`).join('') : '<p class="text-gray-400 text-center text-xs py-8">No tasks</p>'}
        </div>
      </div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

// Task View (Today & All)
function renderTaskView(container, todayOnly) {
  let filtered = tasks;

  if (todayOnly) {
    const today = new Date().toISOString().split('T')[0];
    filtered = tasks.filter(t => t.deadline === today);
  }

  // Search & Filter UI
  container.innerHTML = `
    <div class="flex flex-wrap gap-4 mb-6">
      <input id="searchInput" onkeyup="handleSearch()" type="text" placeholder="Search tasks..." 
             class="flex-1 px-5 py-3 rounded-2xl border focus:border-indigo-500">
      <select onchange="handleFilter(this.value)" class="px-5 py-3 rounded-2xl border">
        <option value="all">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="overdue">Overdue</option>
        <option value="high">High Priority</option>
      </select>
      <button onclick="showAddModal()" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl">+ New Task</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="taskGrid"></div>
  `;

  const grid = document.getElementById('taskGrid');
  filtered.forEach(task => renderTaskCard(task, grid));
}

// Render Task Card with Overdue + Category
function renderTaskCard(task, container) {
  const isOverdue = !task.completed && new Date(task.deadline) < new Date(new Date().toISOString().split('T')[0]);
  
  const card = document.createElement('div');
  card.className = `task-card bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm ${isOverdue ? 'overdue' : `priority-${task.priority.toLowerCase()}`}`;
  
  card.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <span class="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">${task.category}</span>
        <h3 class="font-semibold mt-3 ${task.completed ? 'completed' : ''}">${task.title}</h3>
      </div>
      ${isOverdue ? '<i class="fas fa-exclamation-triangle text-red-500"></i>' : ''}
    </div>
    <p class="due-date text-sm mt-4 ${isOverdue ? 'text-red-600' : 'text-gray-500'}">
      Due: ${new Date(task.deadline).toLocaleDateString('en-GB')}
    </p>
    
    <div class="mt-6 flex gap-3">
      <button onclick="toggleComplete(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl ${task.completed ? 'bg-gray-200' : 'bg-green-600 text-white'}">
        ${task.completed ? '✓ Completed' : 'Mark Done'}
      </button>
      <button onclick="editTask(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl border">Edit</button>
      <button onclick="deleteTask(${task.id}); event.stopImmediatePropagation()" class="flex-1 py-3 rounded-2xl text-red-600 border border-red-200">Delete</button>
    </div>
  `;
  container.appendChild(card);
}

// Search & Filter Handlers
function handleSearch() {
  searchTerm = document.getElementById('searchInput').value.toLowerCase();
  renderMainContent();
}

function handleFilter(filter) {
  currentFilter = filter;
  renderMainContent();
}

// Modal, Save, Edit, Delete, etc. (same logic as before, just with category added)
function showAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add New Task';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDeadline').value = '';
  document.getElementById('taskPriority').value = 'Medium';
  document.getElementById('taskCategory').value = 'Assignment';
  document.getElementById('taskModal').classList.remove('hidden');
}

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const deadline = document.getElementById('taskDeadline').value;
  const priority = document.getElementById('taskPriority').value;
  const category = document.getElementById('taskCategory').value;

  if (!title || !deadline) return alert("Title and Deadline required!");

  if (currentEditId) {
    const task = tasks.find(t => t.id === currentEditId);
    Object.assign(task, {title, deadline, priority, category});
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
  document.getElementById('taskCategory').value = task.category || 'Other';
  document.getElementById('taskModal').classList.remove('hidden');
}

function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
  localStorage.setItem('studyplan_tasks', JSON.stringify(tasks));
  renderMainContent();
}

function deleteTask(id) {
  if (confirm("Delete this task?")) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('studyplan_tasks', JSON.stringify(tasks));
    renderMainContent();
  }
}

function closeModal() {
  document.getElementById('taskModal').classList.add('hidden');
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

function updateStreak() {
  document.getElementById('streak').textContent = "9 days 🔥";
}

window.onload = () => {
  updateStreak();
};