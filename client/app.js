const API_BASE_URL = 'http://localhost:5000/api/v1';
const ROUTE_CODE_PATTERN = /^[A-Z]{2,3}\d{3}$/;

const routeForm = document.getElementById('routeForm');
const routesTbody = document.getElementById('routesTbody');
const loadingSpinner = document.getElementById('loadingSpinner');
const btnRefresh = document.getElementById('btnRefresh');
const formAlert = document.getElementById('formAlert');
const searchInput = document.getElementById('searchInput');

let allRoutes = [];

// ===== Практика 1: состояние сервера =====
async function loadHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    document.getElementById('status').textContent = data.status;
    document.getElementById('time').textContent = data.timestamp;
  } catch (err) {
    document.getElementById('status').textContent = 'Сервер недоступен';
  }
}

async function loadSystemInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/system-info`);
    const data = await response.json();
    document.getElementById('nodeVersion').textContent = data.nodeVersion;
    document.getElementById('uptime').textContent = data.uptimeSec;
  } catch (err) {
    document.getElementById('nodeVersion').textContent = 'нет связи';
  }
}

// ===== Загрузка маршрутов (GET) =====
async function fetchAndRenderRoutes() {
  showSpinner(true);
  try {
    const response = await fetch(`${API_BASE_URL}/routes`);
    if (!response.ok) throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
    const result = await response.json();
    allRoutes = result.data;
    applySearch();
  } catch (err) {
    showAlert(`Не удалось загрузить данные: ${err.message}`, 'error');
  } finally {
    showSpinner(false);
  }
}

function renderRoutesTable(routes) {
  routesTbody.innerHTML = '';
  if (routes.length === 0) {
    routesTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Маршруты не найдены</td></tr>';
    return;
  }
  routes.forEach(route => {
    const tr = document.createElement('tr');
    tr.dataset.id = route.id;
    tr.innerHTML = `
      <td><strong>${escapeHtml(route.code)}</strong></td>
      <td>${escapeHtml(route.name)}</td>
      <td>${escapeHtml(route.transportType)}</td>
      <td>${route.plannedDistanceKm} км</td>
      <td>${route.plannedDurationMin} мин</td>
      <td><button class="btn btn-danger">Удалить</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => deleteRoute(route.id));
    routesTbody.appendChild(tr);
  });
}

// ===== Поиск в реальном времени =====
function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allRoutes.filter(r => r.name.toLowerCase().includes(query));
  renderRoutesTable(filtered);
}

searchInput.addEventListener('input', applySearch);

// ===== Создание маршрута (POST) с валидацией =====
routeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newRoute = {
    code: document.getElementById('routeCode').value.trim().toUpperCase(),
    originCity: document.getElementById('originCity').value.trim(),
    destinationCity: document.getElementById('destinationCity').value.trim(),
    transportType: document.getElementById('transportType').value,
    plannedDistanceKm: Number(document.getElementById('distance').value),
    plannedDurationMin: Number(document.getElementById('duration').value)
  };

  const validationError = validateRoute(newRoute);
  if (validationError) {
    showAlert(validationError, 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoute)
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error ? errData.error.message : 'Ошибка сохранения');
    }
    showAlert('Маршрут успешно добавлен!', 'success');
    routeForm.reset();
    fetchAndRenderRoutes();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

function validateRoute(route) {
  if (!ROUTE_CODE_PATTERN.test(route.code)) {
    return 'Код маршрута: 2–3 латинские буквы и 3 цифры (например, OSJ104)';
  }
  if (!route.originCity || !route.destinationCity) return 'Укажите города отправления и назначения';
  if (route.originCity.toLowerCase() === route.destinationCity.toLowerCase()) {
    return 'Город отправления и назначения не должны совпадать';
  }
  if (!(route.plannedDistanceKm > 0)) return 'Расстояние должно быть больше 0';
  if (!(route.plannedDurationMin > 0)) return 'Время в пути должно быть больше 0';
  return null;
}

// ===== Удаление маршрута (DELETE) =====
async function deleteRoute(routeId) {
  if (!confirm('Удалить маршрут?')) return;
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Ошибка ${response.status}: не удалось удалить`);
    allRoutes = allRoutes.filter(r => r.id !== routeId);
    const row = routesTbody.querySelector(`tr[data-id="${routeId}"]`);
    if (row) {
      row.classList.add('fade-out');
      setTimeout(() => row.remove(), 400);
    }
    showAlert('Маршрут удалён', 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

// ===== Вспомогательные функции =====
function showSpinner(visible) {
  loadingSpinner.classList.toggle('hidden', !visible);
}

function showAlert(msg, type) {
  formAlert.textContent = msg;
  formAlert.className = `alert alert-${type}`;
  setTimeout(() => formAlert.classList.add('hidden'), 4000);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

btnRefresh.addEventListener('click', fetchAndRenderRoutes);
document.addEventListener('DOMContentLoaded', () => {
  loadHealth();
  loadSystemInfo();
  setInterval(loadSystemInfo, 5000);
  fetchAndRenderRoutes();
});
