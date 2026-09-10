import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import Login from './pages/Login.jsx'
import NuevaActa from './pages/NuevaActa.jsx'
import FormatoActa from './pages/FormatoActa.jsx'
import Catalogo from './pages/Catalogo.jsx'
import MarcasList from './pages/MarcasList.jsx'
import MarcasForm from './pages/MarcasForm.jsx'
import MarcasView from './pages/MarcasView.jsx'
import DepartamentosList from './pages/DepartamentosList.jsx'
import DepartamentosForm from './pages/DepartamentosForm.jsx'
import DepartamentosView from './pages/DepartamentosView.jsx'
import EquiposList from './pages/EquiposList.jsx'
import EquipoForm from './pages/EquipoForm.jsx'
import EquipoView from './pages/EquipoView.jsx'
import EmpleadosList from './pages/EmpleadosList.jsx'
import EmpleadoForm from './pages/EmpleadoForm.jsx'
import EmpleadoView from './pages/EmpleadoView.jsx'
import Historial from './pages/Historial.jsx'
import HistorialEntregaList from './pages/HistorialEntregaList.jsx'
import HistorialEntregaView from './pages/HistorialEntregaView.jsx'
import RegistrarDevolucion from './pages/RegistrarDevolucion.jsx'
import HistorialDevolucionList from './pages/HistorialDevolucionList.jsx'
import HistorialDevolucionView from './pages/HistorialDevolucionView.jsx'
import BuscarDevolucion from './pages/BuscarDevolucion.jsx'
import HistorialProximamente from './pages/HistorialProximamente.jsx'
import Usuarios from './pages/Usuarios.jsx'
import UsuarioForm from './pages/UsuarioForm.jsx'
import UsuarioView from './pages/UsuarioView.jsx'
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
            seis formatos físicos del Departamento de TIC. El rol "user"
            queda restringido a Historial (solo ver + corregir fechas), así
            que no puede crear actas nuevas. */}
        <Route
          index
          element={
            <RequireAdmin>
              <NuevaActa />
            </RequireAdmin>
          }
        />

        {/* Un solo motor de formularios para los seis formatos. */}
        <Route
          path="actas/:tipo/nueva"
          element={
            <RequireAdmin>
              <FormatoActa />
            </RequireAdmin>
          }
        />

        {/* Catálogo: datos maestros. Antes sin RequireAdmin (las rutas
            /brands y /departments de Laravel solo exigen jwt.auth), pero
            ahora "user" queda restringido a Historial únicamente. */}
        <Route
          path="catalogo"
          element={
            <RequireAdmin>
              <Catalogo />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/marcas"
          element={
            <RequireAdmin>
              <MarcasList />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/marcas/nuevo"
          element={
            <RequireAdmin>
              <MarcasForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/marcas/:id"
          element={
            <RequireAdmin>
              <MarcasForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/marcas/:id/ver"
          element={
            <RequireAdmin>
              <MarcasView />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/departamentos"
          element={
            <RequireAdmin>
              <DepartamentosList />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/departamentos/nuevo"
          element={
            <RequireAdmin>
              <DepartamentosForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/departamentos/:id"
          element={
            <RequireAdmin>
              <DepartamentosForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/departamentos/:id/ver"
          element={
            <RequireAdmin>
              <DepartamentosView />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/equipos"
          element={
            <RequireAdmin>
              <EquiposList />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/equipos/nuevo"
          element={
            <RequireAdmin>
              <EquipoForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/equipos/:id"
          element={
            <RequireAdmin>
              <EquipoForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/equipos/:id/ver"
          element={
            <RequireAdmin>
              <EquipoView />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/empleados"
          element={
            <RequireAdmin>
              <EmpleadosList />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/empleados/nuevo"
          element={
            <RequireAdmin>
              <EmpleadoForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/empleados/:id"
          element={
            <RequireAdmin>
              <EmpleadoForm />
            </RequireAdmin>
          }
        />
        <Route
          path="catalogo/empleados/:id/ver"
          element={
            <RequireAdmin>
              <EmpleadoView />
            </RequireAdmin>
          }
        />

        {/* Historial: landing con las 6 hojas -- solo "Entrega de Equipo"
            está conectada a la API real (delivery_documents); las otras
            cinco muestran "Próximamente" hasta que Laravel las exponga. */}
        <Route path="historial" element={<Historial />} />
        <Route path="historial/entrega" element={<HistorialEntregaList />} />
        <Route path="historial/entrega/:id" element={<HistorialEntregaView />} />
        {/* Una devolución nace de una entrega puntual -- por eso cuelga de
            su detalle en vez de vivir en "Nueva Acta". Registrarla es una
            acción de creación, así que "user" no entra aquí. */}
        <Route
          path="historial/entrega/:id/devolucion"
          element={
            <RequireAdmin>
              <RegistrarDevolucion />
            </RequireAdmin>
          }
        />
        {/* Devolución ya está conectada a la API real (return_documents);
            se saca de la lista genérica de "Próximamente". */}
        <Route path="historial/devolucion" element={<HistorialDevolucionList />} />
        <Route
          path="historial/devolucion/nueva"
          element={
            <RequireAdmin>
              <BuscarDevolucion />
            </RequireAdmin>
          }
        />
        <Route path="historial/devolucion/:id" element={<HistorialDevolucionView />} />
        <Route path="historial/:tipo" element={<HistorialProximamente />} />
        <Route
          path="usuarios"
          element={
            <RequireAdmin>
              <Usuarios />
            </RequireAdmin>
          }
        />
        <Route
          path="usuarios/nuevo"
          element={
            <RequireAdmin>
              <UsuarioForm />
            </RequireAdmin>
          }
        />
        <Route
          path="usuarios/:id"
          element={
            <RequireAdmin>
              <UsuarioForm />
            </RequireAdmin>
          }
        />
        <Route
          path="usuarios/:id/ver"
          element={
            <RequireAdmin>
              <UsuarioView />
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
