// Recorrido guiado ("¿Cómo funciona?", botón ? de la tarjeta de perfil). Cada paso
// ilumina el primer elemento visible de `donde` (marcas data-recorrido); sin `donde`
// la tarjeta va centrada. `enMenu`: en teléfono y tablet lo explicado vive en el menú,
// así que el menú se abre solo en ese paso. El recorrido arranca siempre en `inicio`
// (ahí están los elementos que se explican).

export const CLAVE_RECORRIDO = 'legumex_recorrido_visto'

const TEMA = {
  donde: ['[data-recorrido="tema"]'],
  enMenu: true,
  titulo: 'Claro u oscuro',
  texto: 'Cambia el tema: automático (según tu equipo), claro u oscuro. Las hojas de las actas siempre se ven como el papel impreso.',
}

const LISTO = {
  donde: ['[data-recorrido="ayuda"]'],
  enMenu: true,
  titulo: '¡Listo!',
  texto: 'Eso es todo. Si te olvidas de algo, este botón ? repite el recorrido.',
}

export const RECORRIDO_ADMIN = {
  inicio: '/',
  pasos: [
    {
      titulo: 'Control de formatos TIC',
      texto: 'Aquí se registran las entregas y devoluciones de equipo del área TIC, con firmas y la hoja lista para imprimir. Te muestro dónde está cada cosa.',
    },
    {
      donde: ['[data-recorrido="menu"]'],
      enMenu: true,
      titulo: 'El menú',
      texto: 'Nueva Acta para registrar, Historial para consultar lo registrado, Catálogo para equipos y colaboradores y Usuarios para los accesos.',
    },
    {
      donde: ['[data-recorrido="formatos"]'],
      titulo: 'Nueva acta',
      texto: 'Entrega: eliges al colaborador, agregas los equipos y firman los dos. Devolución: siempre sale de una entrega existente; buscas al colaborador y marcas lo que regresa.',
    },
    {
      donde: ['[data-recorrido="nav-historial"]'],
      enMenu: true,
      titulo: 'Historial de actas',
      texto: 'Todas las actas registradas: buscar, filtrar por departamento, ver la hoja, descargar el PDF y corregir fechas.',
    },
    {
      donde: ['[data-recorrido="nav-catalogo"]'],
      enMenu: true,
      titulo: 'Catálogo',
      texto: 'Equipos, colaboradores, departamentos y marcas. Desde la ficha de un colaborador ves todo su historial de entregas.',
    },
    {
      donde: ['[data-recorrido="nav-usuarios"]'],
      enMenu: true,
      titulo: 'Usuarios',
      texto: 'Quién entra al sistema. Administrador lo ve todo; Usuario solo consulta el historial y corrige fechas.',
    },
    TEMA,
    LISTO,
  ],
}

export const RECORRIDO_USUARIO = {
  inicio: '/historial',
  pasos: [
    {
      titulo: 'Control de formatos TIC',
      texto: 'Aquí consultas las actas de entrega y devolución de equipo del área TIC. Te muestro dónde está cada cosa.',
    },
    {
      donde: ['[data-recorrido="formatos-historial"]'],
      titulo: 'Las actas',
      texto: 'Elige Entrega o Devolución. Dentro puedes buscar, filtrar por departamento, ver cada hoja y descargarla en PDF.',
    },
    {
      donde: ['[data-recorrido="vigencia"]'],
      titulo: 'Emisión y vigencia',
      texto: 'Las fechas que salen impresas en los formatos. Toca una fecha para corregirla.',
    },
    TEMA,
    LISTO,
  ],
}
