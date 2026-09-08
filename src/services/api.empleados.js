// ---------------------------------------------------------------------------
// PEGAR AL FINAL DE src/services/api.js (no importar desde un archivo aparte).
//
// Regla ya aprendida en Equipos: mantener un solo services/api.js. Un
// archivo por sección causó imports cruzados (EquiposList/EquipoForm
// importaban de api.js funciones que vivían en api.equipos.js) y
// `laravelRequest is not defined` porque no estaba exportada. Aquí
// `laravelRequest` se usa asumiendo que YA está exportada en api.js
// (export async function laravelRequest(...) ...) -- no la vuelvas a
// declarar en ningún otro archivo.
//
// Empleados (Laravel): GET/POST /employees, PUT /employees/{id}. Mismo
// candado que Marcas/Departamentos/Equipos: jwt.auth, sin rol.
//
// Avisos de la API, iguales a los de Equipos:
//  - El POST no devuelve el registro completo (sin id ni fechas): tras crear
//    hay que recargar la lista con listarEmpleados, no confiar en la
//    respuesta del POST.
//  - PUT exige los tres campos siempre (code, name, department_id), aunque
//    el usuario solo cambie uno -- el formulario de edición reenvía todo lo
//    precargado.
// ---------------------------------------------------------------------------

export async function listarEmpleados(token) {
  return laravelRequest('/employees', { token, method: 'GET' })
}

export async function obtenerEmpleado(token, id) {
  return laravelRequest(`/employees/${id}`, { token, method: 'GET' })
}

export async function crearEmpleado(token, { code, name, department_id }) {
  return laravelRequest('/employees', {
    token,
    method: 'POST',
    body: JSON.stringify({ code, name, department_id }),
  })
}

export async function actualizarEmpleado(token, id, { code, name, department_id }) {
  return laravelRequest(`/employees/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify({ code, name, department_id }),
  })
}

// Y en el `export default { ... }` de api.js, agregar:
//   listarEmpleados, obtenerEmpleado, crearEmpleado, actualizarEmpleado,
