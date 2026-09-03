import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import Login from './pages/Login.jsx'
import NuevaActa from './pages/NuevaActa.jsx'
import FormatoActa from './pages/FormatoActa.jsx'
import Catalogo from './pages/Catalogo.jsx'
import MarcasList from './pages/MarcasList.jsx'
import DepartamentosList from './pages/DepartamentosList.jsx'
import EquiposList from './pages/EquiposList.jsx'
import EquipoForm from './pages/EquipoForm.jsx'
import EquipoView from './pages/EquipoView.jsx'
import EmpleadosList from './pages/EmpleadosList.jsx'
import EmpleadoForm from './pages/EmpleadoForm.jsx'
import Historial from './pages/Historial.jsx'
import Auditoria from './pages/Auditoria.jsx'
import Usuarios from './pages/Usuarios.jsx'
import RequireAuth from './routes/RequireAuth.jsx'
import RequireAdmin from './routes/RequireAdmin.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* El inicio ya no es un formato concreto: es el selector de los
            seis formatos físicos del Departamento de TIC. */}
        <Route index element={<NuevaActa />} />

        {/* Un solo motor de formularios para los seis formatos. */}
        <Route path="actas/:tipo/nueva" element={<FormatoActa />} />

        {/* Catálogo: datos maestros. Sin RequireAdmin -- las rutas
            /brands y /departments de Laravel solo exigen jwt.auth. */}
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="catalogo/marcas" element={<MarcasList />} />
        <Route path="catalogo/departamentos" element={<DepartamentosList />} />
        <Route path="catalogo/equipos" element={<EquiposList />} />
        <Route path="catalogo/equipos/nuevo" element={<EquipoForm />} />
        <Route path="catalogo/equipos/:id" element={<EquipoForm />} />
        <Route path="catalogo/equipos/:id/ver" element={<EquipoView />} />
        <Route path="catalogo/empleados" element={<EmpleadosList />} />
        <Route path="catalogo/empleados/nuevo" element={<EmpleadoForm />} />
        <Route path="catalogo/empleados/:id" element={<EmpleadoForm />} />

        <Route path="historial" element={<Historial />} />
        <Route
          path="auditoria"
          element={
            <RequireAdmin>
              <Auditoria />
            </RequireAdmin>
          }
        />
        <Route
          path="usuarios"
          element={
            <RequireAdmin>
              <Usuarios />
            </RequireAdmin>
          }
        />
      </Route>

      {/* Fase 4: cualquier URL que no coincida con las rutas de arriba
          muestra la pantalla de "Página no encontrada" en vez de dejar la
          pantalla en blanco. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
