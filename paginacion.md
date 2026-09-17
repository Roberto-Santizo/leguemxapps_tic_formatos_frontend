# Paginación de listados

Guía de integración para consumir los listados (`GET`) de la API. La regla es una sola:

> **Si la petición trae `limit`, el listado se pagina con ese tamaño. Si no lo trae, la respuesta devuelve todos los registros.**

Todas las rutas requieren el header `Authorization: Bearer <token>` (`jwt.auth`).

---

## 1. Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `limit` | entero ≥ 1 | No | Tamaño de página. Su presencia activa la paginación. |
| `page` | entero ≥ 1 | No | Número de página (empieza en 1). Sólo tiene efecto junto con `limit`; sin `limit` se ignora. |

Los parámetros se envían por **query string** y se pueden combinar con los filtros propios de cada recurso (ver §4).

### Validación (HTTP 422)

| Caso | `message` |
|------|-----------|
| `limit` no numérico (`limit=abc`) | `El límite debe ser un valor numérico` |
| `limit` menor a 1 (`limit=0`) | `El límite debe ser mayor a cero` |
| `page` no numérico | `La página debe ser un valor numérico` |
| `page` menor a 1 | `La página debe ser mayor a cero` |

Formato del error (el estándar de validación de Laravel):

```json
{
  "message": "El límite debe ser mayor a cero",
  "errors": {
    "limit": ["El límite debe ser mayor a cero"]
  }
}
```

---

## 2. Forma de la respuesta

### 2.1 Sin `limit` → todos los registros

```http
GET /api/brands
```

```json
{
  "statusCode": 200,
  "message": "Marcas Obtenidas Correctamente",
  "data": [
    { "id": 1, "name": "Dell", "created_at": "...", "updated_at": "..." },
    { "id": 2, "name": "HP",   "created_at": "...", "updated_at": "..." }
  ]
}
```

`data` es el arreglo completo. **No** vienen `total`, `currentPage` ni `lastPage`.

### 2.2 Con `limit` → paginado

```http
GET /api/brands?limit=10&page=2
```

```json
{
  "statusCode": 200,
  "message": "Marcas Obtenidas Correctamente",
  "data": [
    { "id": 11, "name": "Lenovo", "created_at": "...", "updated_at": "..." }
  ],
  "total": 11,
  "currentPage": 2,
  "lastPage": 2
}
```

| Campo | Descripción |
|-------|-------------|
| `data` | Registros de la página actual (máximo `limit` elementos). |
| `total` | Total de registros que cumplen los filtros (todas las páginas). |
| `currentPage` | Página devuelta. |
| `lastPage` | Última página disponible (`ceil(total / limit)`, mínimo 1). |

Notas:

- Los metadatos van **al mismo nivel** que `data`, no anidados.
- Una página fuera de rango (`page` > `lastPage`) responde `200` con `data: []`; no es error.
- Los elementos de `data` tienen **exactamente el mismo formato** con o sin paginación: cada recurso usa su mismo `Resource` en ambos modos.

### Detección en el cliente

```ts
const isPaginated = 'total' in response; // sólo existe cuando se envió limit
```

---

## 3. Dominios con paginación

Los **nueve** listados principales soportan `limit`/`page`:

| Dominio | Ruta | Formato de cada elemento de `data` |
|---------|------|-------------------------------------|
| Marcas | `GET /api/brands` | Modelo `Brand` completo |
| Departamentos | `GET /api/departments` | Modelo `Department` completo |
| Empleados | `GET /api/employees` | `EmployeeResource` |
| Equipos | `GET /api/equipments` | `EquipmentResource` |
| Características | `GET /api/caracteristics` | `CaracteristicResource` (vista reducida: `id`, `name`, `equipment`) |
| Documentos de entrega | `GET /api/delivery_documents` | `DeliveryDocumentResource` |
| Detalles de entrega | `GET /api/delivery_document_details` | `DeliveryDocumentDetailResource` |
| Documentos de devolución | `GET /api/return_documents` | `ReturnDocumentResource` |
| Detalles de devolución | `GET /api/return_document_details` | `ReturnDocumentDetailResource` |

### Listados **sin** paginación

Estas rutas siempre devuelven la colección completa e ignoran `limit`/`page`:

| Ruta | Motivo |
|------|--------|
| `GET /api/equipments/available` | Consulta de proceso (selector de equipos al armar una entrega). |
| `GET /api/equipments/{id}/history` | Historial de un solo equipo. |
| `GET /api/employees/{id}/equipments` | Equipos asignados a un solo empleado. |
| `GET /api/delivery_documents/{id}/pending_items` | Detalles pendientes de una sola entrega. |
| `GET /api/users` | Catálogo administrativo. |

---

## 4. Filtros combinables por dominio

La paginación se aplica **después** de filtrar, por lo que `total` refleja el conjunto filtrado.

| Ruta | Filtros | Notas |
|------|---------|-------|
| `/api/brands` | — | |
| `/api/departments` | — | |
| `/api/employees` | — | |
| `/api/equipments` | — | |
| `/api/caracteristics` | `equipmentId` | Debe existir (422 si no). |
| `/api/delivery_documents` | `employeeId`, `location`, `status` | `status` ∈ `pendiente`, `parcial`, `devuelto`, `activo` (= pendiente + parcial). |
| `/api/delivery_document_details` | `deliveryDocumentId`, `equipmentId`, `pending` | `pending=1` → sólo detalles sin devolución. |
| `/api/return_documents` | `deliveryDocumentId`, `employeeId` | |
| `/api/return_document_details` | `returnDocumentId` | |

Ejemplos:

```http
GET /api/delivery_documents?status=activo&employeeId=7&limit=20&page=1
GET /api/delivery_document_details?deliveryDocumentId=15&pending=1
GET /api/caracteristics?equipmentId=3&limit=50
```

---

## 5. Recomendaciones de integración

- **Tablas / grillas:** enviar siempre `limit` y `page`; usar `total` y `lastPage` para el paginador.
- **Selectores / combos / catálogos pequeños:** omitir `limit` para recibir todo en una sola llamada.
- **Mantener `limit` constante** mientras se navega entre páginas; cambiarlo invalida `lastPage`.
- Tras crear o eliminar registros, volver a pedir la página actual: el orden es el del motor de base de datos (por defecto, inserción/`id`).
- El `page` sin `limit` no falla ni pagina: devuelve todo.

---

## 6. Implementación (referencia interna)

- `App\Http\Requests\PaginatedIndexRequest` — FormRequest base de todos los listados. Valida `limit`/`page` y expone `limit(): ?int`. Cada recurso extiende esta clase y declara sus filtros en `filterRules()` / `filterMessages()`.
- `App\Http\Controllers\Controller::paginateOrAll()` — recibe la consulta ya filtrada, el request y las clases de resource. Con `limit` hace `paginate($limit)` y envuelve en `Paginated<X>Resource`; sin `limit` hace `get()` y devuelve la colección (transformada con el resource del recurso cuando lo tiene).
- `App\Helpers\ResponseHandler::success()` — aplana `total`, `currentPage` y `lastPage` al nivel raíz de la respuesta.
- Spec: `resources/api-docs/openapi.yaml` (parámetros `Limit` / `Page`, respuesta `PaginationError`), Swagger UI en `/api/documentation`.
- Tests: `tests/Feature/PaginationTest.php`.
