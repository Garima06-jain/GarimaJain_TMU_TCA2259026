const API = "http://127.0.0.1:5000";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function setToken(token, remember) {
  if (remember) localStorage.setItem("token", token);
  else sessionStorage.setItem("token", token);
}

function toast(msg, type = "info") {
  const icons = { success: "Done", error: "Error", info: "Info", warning: "Warn" };
  const container = document.getElementById("toast-container");
  if (!container) { alert(msg); return; }

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || "Warn"}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add("hide");
    el.addEventListener("animationend", () => el.remove());
  }, 3500);
}

async function login() {
  const userId   = document.getElementById("loginUserId").value.trim();
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("rememberMe")?.checked;

  if (!userId || !password) { toast("Please enter your User ID and password.", "error"); return; }

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, password })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token, remember);
      window.location.href = "dashboard.html";
    } else {
      toast(data.message || data.error || "Incorrect User ID or password.", "error");
    }
  } catch {
    toast("Unable to reach the server. Please try again.", "error");
  }
}

async function signup() {
  const userId   = document.getElementById("signupUserId").value.trim();
  const name     = document.getElementById("name").value.trim();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role     = document.getElementById("role").value;

  if (!userId || !name || !email || !password) { toast("All fields are required.", "error"); return; }
  if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(userId)) { toast("User ID: 3-50 chars, letters/numbers/_ only.", "error"); return; }
  if (password.length < 8) { toast("Password must be at least 8 characters.", "error"); return; }

  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, name, email, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      toast("Account created! You can now sign in.", "success");
      setTimeout(() => window.switchTab && switchTab("login"), 1600);
    } else {
      toast(data.error || "Could not create account.", "error");
    }
  } catch {
    toast("Unable to reach the server. Please try again.", "error");
  }
}

function getUserPayload() {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
}

function loadUserGreeting() {
  const payload = getUserPayload();
  if (!payload) return;

  const name = payload.name || payload.sub || "User";
  const role = payload.role || "member";

  // Show logged-in user's name in sidebar
  const el = document.getElementById("loggedName");
  if (el) el.textContent = name;

  // Personalised greeting on dashboard
  const heading = document.getElementById("greetingHeading");
  if (heading) {
    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    heading.textContent = `${greet}, ${name.split(" ")[0]}`;
  }

  // Show/hide admin-only sections based on role
  const adminSections = document.querySelectorAll(".admin-only");
  adminSections.forEach(el => {
    el.style.display = role === "admin" ? "" : "none";
  });

  // Update page title and subtitle for members vs admins
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const taskListTitle = document.getElementById("taskListTitle");
  if (role !== "admin") {
    if (pageTitle) pageTitle.textContent = "My Tasks";
    if (pageSubtitle) pageSubtitle.textContent = "Here are the tasks assigned to you.";
    if (taskListTitle) taskListTitle.textContent = "My Assigned Tasks";
  } else {
    if (pageTitle) pageTitle.textContent = "Manage Tasks";
    if (pageSubtitle) pageSubtitle.textContent = "Build projects and assign work to your teammates.";
  }
}

let allTasks = [];
let activeFilter = "all";

async function loadDashboard() {
  loadUserGreeting();
  try {
    const res  = await fetch(`${API}/tasks/dashboard`, {
      headers: { Authorization: "Bearer " + getToken() }
    });
    if (!res.ok) return;
    const data = await res.json();

    const animate = (el, val) => {
      if (!el) return;
      el.style.animation = "countUp 0.4s ease";
      el.innerText = val;
    };
    animate(document.getElementById("total"),     data.total);
    animate(document.getElementById("completed"), data.completed);
    animate(document.getElementById("overdue"),   data.overdue);

    const today = new Date().toISOString().slice(0, 10);
    const dueTodayEl = document.getElementById("dueToday");
    if (dueTodayEl) {
      const count = (allTasks || []).filter(t => t.dueDate === today && t.status !== "completed").length;
      animate(dueTodayEl, count);
    }

    const pct = data.total ? Math.round((data.completed / data.total) * 100) : 0;
    const rateEl = document.getElementById("completionRate");
    if (rateEl) rateEl.textContent = `${pct}% completion rate`;

    const fill = document.getElementById("progressFill");
    const pctEl = document.getElementById("progressPct");
    if (fill) fill.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";

  } catch (err) { console.error("Dashboard error:", err); }
}

async function loadTasks() {
  const container = document.getElementById("tasks");
  if (!container) return;

  try {
    const res   = await fetch(`${API}/tasks/`, {
      headers: { Authorization: "Bearer " + getToken() }
    });
    if (!res.ok) return;
    allTasks = await res.json();

    const today = new Date().toISOString().slice(0, 10);
    const dueTodayEl = document.getElementById("dueToday");
    if (dueTodayEl) {
      dueTodayEl.textContent = allTasks.filter(t => t.dueDate === today && t.status !== "completed").length;
    }

    const lr = document.getElementById("lastRefreshed");
    if (lr) lr.textContent = "Last refreshed " + new Date().toLocaleTimeString();

    renderTasks(allTasks);
  } catch (err) { console.error("Tasks error:", err); }
}

function renderTasks(tasks) {
  const container = document.getElementById("tasks");
  if (!container) return;

  if (!tasks.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No tasks found. Create one to get started.</p>
      </div>`;
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const priorityLabel = { high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low", undefined: "" };
  const priorityClass = { high: "priority-high", medium: "priority-medium", low: "priority-low" };

  container.innerHTML = tasks.map((t, i) => {
    const done     = t.status === "completed";
    const isOverdue = t.dueDate && t.dueDate < today && !done;
    const isDueToday = t.dueDate === today && !done;
    const prio     = t.priority || "";

    return `
    <div class="task-card ${done ? "task-done" : ""} ${isOverdue ? "task-overdue" : ""}" style="animation-delay:${i * 0.04}s">
      ${isOverdue ? '<div class="overdue-ribbon">Overdue</div>' : ""}
      ${isDueToday ? '<div class="today-ribbon">Due Today</div>' : ""}
      <h4>${escHtml(t.title)}</h4>
      <div class="task-meta">
        <div class="task-meta-row"><span class="icon">👤</span> Assigned to: <strong>${escHtml(String(t.assignedTo))}</strong></div>
        ${t.dueDate ? `<div class="task-meta-row"><span class="icon">📅</span> ${formatDate(t.dueDate)}</div>` : ""}
        ${prio ? `<div class="task-meta-row"><span class="icon"></span><span class="${priorityClass[prio]}">${priorityLabel[prio]}</span></div>` : ""}
        ${t.notes ? `<div class="task-meta-row task-notes"><span class="icon">💬</span> ${escHtml(t.notes)}</div>` : ""}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        <span class="status-badge ${done ? "status-completed" : isOverdue ? "status-overdue" : "status-pending"}">${t.status}</span>
        <div style="display:flex;gap:6px;">
          ${!done
            ? `<button class="btn btn-success" style="padding:7px 14px;font-size:12px;" onclick="completeTask(${t._id})">Complete</button>`
            : `<button class="btn btn-ghost" style="padding:7px 14px;font-size:12px;opacity:0.4;cursor:not-allowed;" disabled>Done ✓</button>`
          }
          <button class="btn btn-ghost" style="padding:7px 10px;font-size:12px;" onclick="deleteTask(${t._id})" title="Delete task">🗑</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

async function completeTask(taskId) {
  try {
    const res = await fetch(`${API}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ status: "completed" })
    });
    if (res.ok) {
      toast("Task marked complete! 🎉", "success");
      await loadTasks();
      await loadDashboard();
    } else {
      const d = await res.json();
      toast(d.error || "Could not update task.", "error");
    }
  } catch { toast("Server error — please try again.", "error"); }
}

async function deleteTask(taskId) {
  if (!confirm("Remove this task? This can't be undone.")) return;
  try {
    const res = await fetch(`${API}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + getToken() }
    });
    if (res.ok || res.status === 204) {
      toast("Task deleted.", "info");
      await loadTasks();
      await loadDashboard();
    } else {
      toast("Could not delete task.", "error");
    }
  } catch { toast("Server error.", "error"); }
}

async function bulkComplete() {
  const pending = allTasks.filter(t => t.status !== "completed");
  if (!pending.length) { toast("No pending tasks to complete.", "info"); return; }
  if (!confirm(`Mark all ${pending.length} pending tasks as complete?`)) return;

  let done = 0;
  for (const t of pending) {
    const res = await fetch(`${API}/tasks/${t._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + getToken() },
      body: JSON.stringify({ status: "completed" })
    });
    if (res.ok) done++;
  }
  toast(`${done} task${done !== 1 ? "s" : ""} marked complete.`, "success");
  await loadTasks();
  await loadDashboard();
}

async function createProject() {
  const name        = document.getElementById("projectName").value.trim();
  const description = document.getElementById("projectDesc").value.trim();
  if (!name) { toast("Project name is required.", "error"); return; }
  try {
    const res  = await fetch(`${API}/projects/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ name, description })
    });
    const data = await res.json();
    if (res.ok) {
      toast("Project created successfully!", "success");
      document.getElementById("projectName").value = "";
      document.getElementById("projectDesc").value = "";
    } else {
      toast(data.error || "Error creating project.", "error");
    }
  } catch { toast("Unable to reach server.", "error"); }
}

async function createTask() {
  const title      = document.getElementById("title").value.trim();
  const assignedTo = document.getElementById("assignedTo").value.trim();
  const dueDate    = document.getElementById("dueDate").value;
  const priority   = document.getElementById("priority")?.value || "medium";
  const notes      = document.getElementById("taskNotes")?.value.trim() || "";

  if (!title || !assignedTo || !dueDate) { toast("Title, assignee, and due date are required.", "error"); return; }

  try {
    const res  = await fetch(`${API}/tasks/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
      },
      body: JSON.stringify({ title, assignedTo, dueDate, priority, notes })
    });
    const data = await res.json();
    if (res.ok) {
      toast("Task created!", "success");
      ["title", "assignedTo", "dueDate", "taskNotes"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      await loadTasks();
    } else {
      toast(data.error || data.msg || "Error creating task.", "error");
    }
  } catch { toast("Unable to reach server.", "error"); }
}

function filterTasks(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  applySortFilter();
}

function applySortFilter() {
  if (!allTasks.length) return;
  const today  = new Date().toISOString().slice(0, 10);
  const sort   = document.getElementById("sortSelect")?.value || "newest";
  const pOrder = { high: 0, medium: 1, low: 2 };

  let filtered = [...allTasks];
  if (activeFilter === "pending")   filtered = filtered.filter(t => t.status !== "completed");
  if (activeFilter === "completed") filtered = filtered.filter(t => t.status === "completed");
  if (activeFilter === "overdue")   filtered = filtered.filter(t => t.dueDate && t.dueDate < today && t.status !== "completed");

  if (sort === "due")      filtered.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  else if (sort === "az")  filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "priority") filtered.sort((a, b) => (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1));
  else if (sort === "oldest") filtered.sort((a, b) => a._id - b._id);
  else filtered.sort((a, b) => b._id - a._id); 

  renderTasks(filtered);
}

function quickSearch(q) {
  if (!allTasks.length) return;
  const query = q.toLowerCase().trim();
  const results = query ? allTasks.filter(t => t.title.toLowerCase().includes(query)) : allTasks;
  renderTasks(results);
}

function exportTasks() {
  if (!allTasks.length) { toast("No tasks to export.", "info"); return; }
  const rows = [["ID", "Title", "Assigned To", "Due Date", "Status", "Priority", "Notes"]];
  allTasks.forEach(t => rows.push([t._id, t.title, t.assignedTo, t.dueDate || "", t.status, t.priority || "", t.notes || ""]));
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV downloaded!", "success");
}

function goAnalytics() {
  const modal = document.getElementById("analyticsModal");
  if (!modal) { window.location.href = "dashboard.html"; return; }

  const today = new Date().toISOString().slice(0, 10);
  const total     = allTasks.length;
  const completed = allTasks.filter(t => t.status === "completed").length;
  const pending   = allTasks.filter(t => t.status !== "completed").length;
  const overdue   = allTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "completed").length;
  const highPrio  = allTasks.filter(t => t.priority === "high" && t.status !== "completed").length;
  const pct       = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("analyticsContent").innerHTML = `
    <div class="analytics-stat"><div class="as-num">${total}</div><div class="as-label">Total Tasks</div></div>
    <div class="analytics-stat"><div class="as-num" style="color:var(--success)">${completed}</div><div class="as-label">Completed</div></div>
    <div class="analytics-stat"><div class="as-num" style="color:var(--warning)">${pending}</div><div class="as-label">Pending</div></div>
    <div class="analytics-stat"><div class="as-num" style="color:var(--danger)">${overdue}</div><div class="as-label">Overdue</div></div>
    <div class="analytics-stat"><div class="as-num" style="color:#f97316">${highPrio}</div><div class="as-label">High Priority</div></div>
    <div class="analytics-stat"><div class="as-num" style="color:var(--accent)">${pct}%</div><div class="as-label">Completion Rate</div></div>
  `;
  modal.style.display = "flex";
}

function closeAnalytics() {
  const modal = document.getElementById("analyticsModal");
  if (modal) modal.style.display = "none";
}

async function refreshTasks() {
  await loadTasks();
  await loadDashboard();
  toast("Refreshed.", "info");
}

function logout()      { localStorage.removeItem("token"); sessionStorage.removeItem("token"); window.location.href = "index.html"; }
function goTasks()     { window.location.href = "task.html"; }
function goDashboard() { window.location.href = "dashboard.html"; }

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(d) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

window.onload = async function () {
  const path = window.location.pathname;
  if (path.includes("dashboard.html")) {
    await loadTasks();
    await loadDashboard();
  } else if (path.includes("task.html")) {
    loadUserGreeting();
    await loadTasks();
  }
};
