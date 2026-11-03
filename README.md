# Система оценки эффективности логистических маршрутов и доставки

Дисциплина: РКСП (разработка клиент-серверных приложений), практики 1–3.
Тема: время в пути, расстояние, тип транспорта, объём груза, задержки.

## Структура

```
logistics-system/
├── server/index.js        # Express API (практики 1–2)
├── client/                # HTML/CSS/JS клиент (практики 1, 3)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── docs/
│   ├── architecture.drawio                    # схема архитектуры (практика 1)
│   ├── Logistics_Week2_Collection.json        # коллекция Postman (практика 2)
│   └── Logistics_Local.postman_environment.json
├── package.json
└── .gitignore
```

## Запуск

```
npm install
npm start
```

Откройте http://localhost:5000 — откроется клиент.

## Практика 1 — архитектура и health check

- Схема 3-tier: `docs/architecture.drawio` (Presentation — Application — Data).
- `GET /api/v1/health` — статус сервера и время.
- `GET /api/v1/system-info` — версия Node.js и uptime (самостоятельное задание).
- Клиент обновляет system-info каждые 5 секунд.
- Проверка: F12 → Network → запросы `health` и `system-info`, статус 200.

## Практика 2 — REST API

| Метод | URL | Код ответа |
|---|---|---|
| GET | /api/v1/routes?transportType=TRUCK&search=ош | 200 |
| GET | /api/v1/routes/:id | 200 / 404 |
| POST | /api/v1/routes | 201 / 400 |
| PUT | /api/v1/routes/:id | 200 / 400 / 404 |
| DELETE | /api/v1/routes/:id | 204 / 404 |
| GET | /api/v1/couriers?vehicleType=VAN | 200 |
| POST | /api/v1/couriers | 201 / 400 |

Пример тела POST /api/v1/routes:

```json
{
  "code": "OSJ104",
  "originCity": "Ош",
  "destinationCity": "Жалал-Абад",
  "transportType": "VAN",
  "plannedDistanceKm": 100,
  "plannedDurationMin": 110
}
```

Коллекция: импортируйте `docs/Logistics_Week2_Collection.json` в Postman или Thunder Client.
Переменная `baseUrl` = `http://localhost:5000/api/v1`.

## Практика 3 — DOM и Fetch API

- GET: загрузка таблицы маршрутов.
- POST: форма создания с проверкой `response.ok`.
- DELETE: удаление строки без перезагрузки страницы (с анимацией).
- Клиентская валидация кода маршрута: `/^[A-Z]{2,3}\d{3}$/`, например `BSO101`.
- Поиск по названию маршрута в реальном времени.
- Индикатор загрузки, сообщения об успехе и ошибке, пустое состояние таблицы.

Данные хранятся в памяти сервера: после перезапуска возвращаются 3 исходных маршрута.
