const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// ==================== НАСТРОЙКИ ====================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

// ==================== ДАННЫЕ В ПАМЯТИ ====================

const TRANSPORT_TYPES = ['TRUCK', 'VAN', 'CAR', 'MOTORCYCLE'];

let routes = [
  { id: 'r1', code: 'BSO101', name: 'Бишкек — Ош', originCity: 'Бишкек', destinationCity: 'Ош', transportType: 'TRUCK', plannedDistanceKm: 610, plannedDurationMin: 600 },
  { id: 'r2', code: 'BSK102', name: 'Бишкек — Каракол', originCity: 'Бишкек', destinationCity: 'Каракол', transportType: 'VAN', plannedDistanceKm: 390, plannedDurationMin: 360 },
  { id: 'r3', code: 'BST103', name: 'Бишкек — Токмок', originCity: 'Бишкек', destinationCity: 'Токмок', transportType: 'CAR', plannedDistanceKm: 60, plannedDurationMin: 70 }
];

let couriers = [
  { id: 'k1', fullName: 'Нурзат Кадырова', phone: '+996555123456', licenseNumber: 'KG100001', vehicleType: 'TRUCK' },
  { id: 'k2', fullName: 'Азамат Сыдыков', phone: '+996700234567', licenseNumber: 'KG100002', vehicleType: 'VAN' }
];

let nextRouteId = 4;
let nextCourierId = 3;

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function validateRoute(body) {
  const { code, originCity, destinationCity, transportType, plannedDistanceKm, plannedDurationMin } = body;
  if (!code || !originCity || !destinationCity || plannedDistanceKm === undefined || plannedDurationMin === undefined) {
    return 'Поля code, originCity, destinationCity, plannedDistanceKm и plannedDurationMin обязательны';
  }
  if (!/^[A-Z]{2,3}\d{3}$/.test(code)) return 'Код маршрута: 2–3 заглавные латинские буквы и 3 цифры (например, BSO101)';
  if (transportType !== undefined && !TRANSPORT_TYPES.includes(transportType)) {
    return `transportType должен быть одним из: ${TRANSPORT_TYPES.join(', ')}`;
  }
  if (!(Number(plannedDistanceKm) > 0)) return 'plannedDistanceKm должен быть положительным числом';
  if (!(Number(plannedDurationMin) > 0)) return 'plannedDurationMin должен быть положительным числом';
  return null;
}

function buildRoute(id, body) {
  return {
    id,
    code: body.code,
    name: `${body.originCity} — ${body.destinationCity}`,
    originCity: body.originCity,
    destinationCity: body.destinationCity,
    transportType: body.transportType || 'TRUCK',
    plannedDistanceKm: Number(body.plannedDistanceKm),
    plannedDurationMin: Number(body.plannedDurationMin)
  };
}

// ==================== ПРАКТИКА 1: СОСТОЯНИЕ СЕРВЕРА ====================

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Logistics System API is active', timestamp: new Date().toISOString() });
});

app.get('/api/v1/system-info', (req, res) => {
  res.status(200).json({ nodeVersion: process.version, uptimeSec: Math.round(process.uptime()), timestamp: new Date().toISOString() });
});

// ==================== МАРШРУТЫ (ROUTES) — CRUD ====================

// GET /api/v1/routes?transportType=TRUCK&search=ош
app.get('/api/v1/routes', (req, res) => {
  const { transportType, search } = req.query;
  let result = [...routes];
  if (transportType) {
    result = result.filter(r => r.transportType.toLowerCase() === transportType.toLowerCase());
  }
  if (search) {
    result = result.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  }
  res.status(200).json({ success: true, count: result.length, data: result });
});

app.get('/api/v1/routes/:id', (req, res) => {
  const route = routes.find(r => r.id === req.params.id);
  if (!route) return sendError(res, 404, 'NOT_FOUND', `Маршрут с ID ${req.params.id} не найден`);
  res.status(200).json({ success: true, data: route });
});

app.post('/api/v1/routes', (req, res) => {
  const error = validateRoute(req.body);
  if (error) return sendError(res, 400, 'VALIDATION_ERROR', error);
  if (routes.some(r => r.code === req.body.code)) {
    return sendError(res, 400, 'VALIDATION_ERROR', `Маршрут с кодом ${req.body.code} уже существует`);
  }
  const newRoute = buildRoute(`r${nextRouteId++}`, req.body);
  routes.push(newRoute);
  res.status(201).json({ success: true, data: newRoute });
});

app.put('/api/v1/routes/:id', (req, res) => {
  const index = routes.findIndex(r => r.id === req.params.id);
  if (index === -1) return sendError(res, 404, 'NOT_FOUND', 'Маршрут для обновления не найден');
  const error = validateRoute(req.body);
  if (error) return sendError(res, 400, 'VALIDATION_ERROR', error);
  routes[index] = buildRoute(req.params.id, req.body);
  res.status(200).json({ success: true, data: routes[index] });
});

app.delete('/api/v1/routes/:id', (req, res) => {
  const index = routes.findIndex(r => r.id === req.params.id);
  if (index === -1) return sendError(res, 404, 'NOT_FOUND', 'Маршрут для удаления не найден');
  routes.splice(index, 1);
  res.status(204).send();
});

// ==================== КУРЬЕРЫ (COURIERS) — самостоятельное задание ====================

// GET /api/v1/couriers?vehicleType=VAN
app.get('/api/v1/couriers', (req, res) => {
  const { vehicleType } = req.query;
  let result = [...couriers];
  if (vehicleType) {
    result = result.filter(c => c.vehicleType.toLowerCase() === vehicleType.toLowerCase());
  }
  res.status(200).json({ success: true, count: result.length, data: result });
});

app.post('/api/v1/couriers', (req, res) => {
  const { fullName, phone, licenseNumber, vehicleType } = req.body;
  if (typeof fullName !== 'string' || fullName.trim().length < 3) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'fullName обязателен (минимум 3 символа)');
  }
  if (typeof phone !== 'string' || !/^\+996\d{9}$/.test(phone)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'phone обязателен в формате +996XXXXXXXXX');
  }
  if (typeof licenseNumber !== 'string' || !/^KG\d{6}$/.test(licenseNumber)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'licenseNumber обязателен в формате KG123456');
  }
  if (couriers.some(c => c.licenseNumber === licenseNumber)) {
    return sendError(res, 400, 'VALIDATION_ERROR', `Курьер с удостоверением ${licenseNumber} уже существует`);
  }
  if (!TRANSPORT_TYPES.includes(vehicleType)) {
    return sendError(res, 400, 'VALIDATION_ERROR', `vehicleType должен быть одним из: ${TRANSPORT_TYPES.join(', ')}`);
  }
  const newCourier = { id: `k${nextCourierId++}`, fullName: fullName.trim(), phone, licenseNumber, vehicleType };
  couriers.push(newCourier);
  res.status(201).json({ success: true, data: newCourier });
});

app.listen(PORT, () => console.log(`[Logistics API] Сервер запущен на http://localhost:${PORT}`));
