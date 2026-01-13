/**
 * VIBE Project Templates
 * Pre-built templates for common project types
 */

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'fullstack' | 'utility';
  files: TemplateFile[];
  icon: string;
}

export interface TemplateFile {
  path: string;
  content: string;
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'html-starter',
    name: 'HTML Starter',
    description: 'Simple HTML, CSS, and JavaScript starter template',
    category: 'frontend',
    icon: '🌐',
    files: [
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Your Project</h1>
    <p>Start building something amazing!</p>
    <button id="actionBtn">Click Me</button>
  </div>

  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        path: '/style.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
}

h1 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 2.5rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

button:active {
  transform: translateY(0);
}`,
      },
      {
        path: '/script.js',
        content: `// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized!');

  const button = document.getElementById('actionBtn');

  button.addEventListener('click', () => {
    alert('Hello from your new project! 🚀');
  });
});`,
      },
    ],
  },
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Modern React app with Vite bundler',
    category: 'frontend',
    icon: '⚛️',
    files: [
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,
      },
      {
        path: '/src/main.jsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      },
      {
        path: '/src/App.jsx',
        content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React + Vite</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
      </header>
    </div>
  )
}

export default App`,
      },
      {
        path: '/src/App.css',
        content: `.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.card {
  padding: 2rem;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover {
  transform: translateY(-2px);
}

code {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}`,
      },
      {
        path: '/src/index.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
}`,
      },
    ],
  },
  {
    id: 'tailwind-landing',
    name: 'Tailwind Landing Page',
    description: 'Beautiful landing page with Tailwind CSS',
    category: 'frontend',
    icon: '🎨',
    files: [
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white/10 backdrop-blur-lg border-b border-white/20">
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="text-white text-2xl font-bold">Brand</div>
        <div class="hidden md:flex space-x-8">
          <a href="#" class="text-white hover:text-purple-200 transition">Features</a>
          <a href="#" class="text-white hover:text-purple-200 transition">Pricing</a>
          <a href="#" class="text-white hover:text-purple-200 transition">About</a>
        </div>
        <button class="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition">
          Get Started
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="container mx-auto px-6 py-20 text-center">
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
      Build Something
      <span class="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
        Amazing
      </span>
    </h1>
    <p class="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
      Create stunning web experiences with modern tools and best practices.
      Start building today.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button class="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition transform">
        Start Free Trial
      </button>
      <button class="bg-white/20 backdrop-blur-lg text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white/30 hover:bg-white/30 transition">
        Learn More
      </button>
    </div>
  </section>

  <!-- Features Section -->
  <section class="container mx-auto px-6 py-20">
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div class="text-4xl mb-4">⚡</div>
        <h3 class="text-2xl font-bold text-white mb-3">Lightning Fast</h3>
        <p class="text-purple-100">Optimized for performance and speed. Load in milliseconds.</p>
      </div>
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div class="text-4xl mb-4">🎨</div>
        <h3 class="text-2xl font-bold text-white mb-3">Beautiful Design</h3>
        <p class="text-purple-100">Pixel-perfect interfaces that users love to interact with.</p>
      </div>
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div class="text-4xl mb-4">🔒</div>
        <h3 class="text-2xl font-bold text-white mb-3">Secure</h3>
        <p class="text-purple-100">Enterprise-grade security to protect your data.</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="container mx-auto px-6 py-12 text-center text-purple-100 border-t border-white/20">
    <p>&copy; 2025 Brand. All rights reserved.</p>
  </footer>
</body>
</html>`,
      },
    ],
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Simple interactive todo list application',
    category: 'utility',
    icon: '✅',
    files: [
      {
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>📝 My Todos</h1>

    <div class="input-section">
      <input type="text" id="todoInput" placeholder="Add a new task...">
      <button id="addBtn">Add</button>
    </div>

    <div class="filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="active">Active</button>
      <button class="filter-btn" data-filter="completed">Completed</button>
    </div>

    <ul id="todoList"></ul>

    <div class="stats">
      <span id="todoCount">0 tasks remaining</span>
      <button id="clearCompleted">Clear Completed</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        path: '/style.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  max-width: 600px;
  width: 100%;
}

h1 {
  color: #667eea;
  margin-bottom: 1.5rem;
  text-align: center;
}

.input-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover {
  transform: translateY(-2px);
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.filter-btn {
  background: #f5f5f5;
  color: #666;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

#todoList {
  list-style: none;
  margin-bottom: 1.5rem;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}

.todo-item:hover {
  background: #f9f9f9;
}

.todo-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-item span {
  flex: 1;
}

.delete-btn {
  background: #ff4757;
  padding: 6px 12px;
  font-size: 0.8rem;
}

.stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 2px solid #e0e0e0;
}

#todoCount {
  color: #666;
  font-size: 0.9rem;
}

#clearCompleted {
  background: #ff4757;
  font-size: 0.9rem;
  padding: 8px 16px;
}`,
      },
      {
        path: '/app.js',
        content: `let todos = JSON.parse(localStorage.getItem('todos')) || [];
let filter = 'all';

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompleted = document.getElementById('clearCompleted');
const todoCount = document.getElementById('todoCount');

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  todos.push({
    id: Date.now(),
    text,
    completed: false
  });

  todoInput.value = '';
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function renderTodos() {
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  todoList.innerHTML = filteredTodos.map(todo => \`
    <li class="todo-item \${todo.completed ? 'completed' : ''}">
      <input type="checkbox" \${todo.completed ? 'checked' : ''}
             onchange="toggleTodo(\${todo.id})">
      <span>\${escapeHtml(todo.text)}</span>
      <button class="delete-btn" onclick="deleteTodo(\${todo.id})">Delete</button>
    </li>
  \`).join('');

  const activeCount = todos.filter(t => !t.completed).length;
  todoCount.textContent = \`\${activeCount} task\${activeCount !== 1 ? 's' : ''} remaining\`;
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    renderTodos();
  });
});

clearCompleted.addEventListener('click', () => {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
});

renderTodos();`,
      },
    ],
  },
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: 'frontend' | 'fullstack' | 'utility'
): ProjectTemplate[] {
  return projectTemplates.filter((t) => t.category === category);
}
