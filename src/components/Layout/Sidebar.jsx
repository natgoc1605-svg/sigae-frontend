import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, ROLES } from '../../utils/auth';
import api from '../../api/axios';

const Iconos = {
  dashboard: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  vistaGeneral: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  aula: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H9zm0 0H6a2 2 0 01-2-2v-3a2 2 0 012-2h3m6 4h.01M14 12h.01" />
    </svg>
  ),
  edificio: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  horario: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  solicitar: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm7-8h4m-2-2v4" />
    </svg>
  ),
  aprobar: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  solicitudes: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  usuarios: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  config: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  perfil: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  reportes: (
    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
};

function ItemLink({ to, icon, children, extra = null, accent = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-link group flex items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-all duration-300 ease-out relative overflow-hidden ${
          isActive
            ? accent
              ? 'bg-amber-500/30 font-medium shadow-md scale-[1.02] border-l-4 border-amber-300'
              : 'bg-white/25 font-medium shadow-md scale-[1.02] border-l-4 border-white/60'
            : accent
              ? 'hover:bg-amber-500/20 hover:translate-x-1'
              : 'hover:bg-white/15 hover:translate-x-1'
        }`
      }
    >
      <span className={`absolute inset-0 ${accent ? 'bg-gradient-to-r from-amber-300/0 via-amber-300/15 to-amber-300/0' : 'bg-gradient-to-r from-white/0 via-white/10 to-white/0'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></span>
      <div className="flex items-center gap-3 relative z-10">
        <span>{icon}</span>
        <span className="relative z-10">{children}</span>
      </div>
      {extra && <span className="relative z-10">{extra}</span>}
    </NavLink>
  );
}

function SeccionTitulo({ children, color = 'text-white/60' }) {
  return (
    <div className="mt-4 mb-2">
      <p className={`text-xs uppercase ${color} font-semibold px-4 flex items-center gap-2`}>
        <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
        {children}
      </p>
    </div>
  );
}

function Submenu({ icon, label, children, rutasActivas = [], extra = null, maxH = 'max-h-48' }) {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(() =>
    rutasActivas.some(r => pathname.startsWith(r))
  );

  useEffect(() => {
    if (rutasActivas.some(r => pathname.startsWith(r))) {
      setAbierto(true);
    }
  }, [pathname, rutasActivas]);

  return (
    <div>
      <button
        onClick={() => setAbierto(!abierto)}
        className={`sidebar-link group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-all duration-300 ease-out relative overflow-hidden ${
          abierto ? 'bg-white/15 font-medium' : 'hover:bg-white/15 hover:translate-x-1'
        }`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
        <div className="flex items-center gap-3 relative z-10">
          <span>{icon}</span>
          <span className="relative z-10">{label}</span>
        </div>
        <span className="relative z-10 flex items-center gap-1.5">
          {extra}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-y-auto sidebar-scroll transition-all duration-300 ease-out ${abierto ? maxH : 'max-h-0'}`}>
        <div className="ml-4 pl-3 border-l border-white/20 space-y-1 py-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function MisAulasArbol({ arbol }) {
  const [abiertos, setAbiertos] = useState({});

  if (!arbol || arbol.length === 0) {
    return <p className="text-xs text-white/60 px-3 py-2">Sin edificios asignados</p>;
  }

  return (
    <div className="space-y-1">
      {arbol.map(edif => {
        const totalAulas = edif.plantas.reduce((acc, p) => acc + p.aulas.length, 0);
        const abierto = !!abiertos[edif.id_edificio];
        return (
          <div key={edif.id_edificio}>
            <button
              onClick={() => setAbiertos(prev => ({ ...prev, [edif.id_edificio]: !prev[edif.id_edificio] }))}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-white/85 hover:bg-white/10 text-sm transition-colors"
            >
              <span className="truncate font-medium">{edif.nombre}</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] text-white/50">{totalAulas}</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${abierto ? 'max-h-56' : 'max-h-0'}`}>
              <div className="ml-2 pl-2 border-l border-white/15 space-y-1 py-1">
                {edif.plantas.map(p => (
                  <div key={p.planta}>
                    <p className="text-[10px] uppercase tracking-wide text-white/50 px-2 pt-1">
                      Planta {p.planta === 'baja' ? 'baja' : 'alta'}
                    </p>
                    {p.aulas.length === 0 ? (
                      <p className="text-xs text-white/40 px-2 pb-1">Sin aulas</p>
                    ) : (
                      p.aulas.map(a => (
                        <NavLink
                          key={a.id_aula}
                          to={`/horario-aula/${a.id_aula}`}
                          className={({ isActive }) =>
                            `flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                              isActive ? 'bg-white/20 text-white font-medium' : 'text-white/75 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          {Iconos.chevron}
                          <span className="truncate">{a.nombre_aula}</span>
                        </NavLink>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const { usuario } = useAuth();
  const [colapsado, setColapsado] = useState(false);
  const [pendientes, setPendientes] = useState(null);
  const [arbolMisAulas, setArbolMisAulas] = useState([]);

  const esSuperAdmin = hasPermission(usuario, [ROLES.SUPER_ADMIN]);
  const esDirector = hasPermission(usuario, [ROLES.DIRECTOR]);
  const tieneDocencia = esSuperAdmin || esDirector;

  const cargarPendientes = async () => {
    try {
      const res = await api.get('/api/solicitudes-espacio/pendientes');
      setPendientes(Array.isArray(res.data) ? res.data.length : 0);
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
    }
  };

  useEffect(() => {
    if (!tieneDocencia) return;
    cargarPendientes();
    const intervalo = setInterval(cargarPendientes, 60000);
    window.addEventListener('nueva-notificacion', cargarPendientes);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('nueva-notificacion', cargarPendientes);
    };
  }, [tieneDocencia]);

  useEffect(() => {
    if (!tieneDocencia) return;
    let activo = true;
    const cargarMisAulas = async () => {
      try {
        const [resEdif, resAulas] = await Promise.all([
          api.get('/api/edificios'),
          api.get('/api/aulas')
        ]);
        const edificios = resEdif.data || [];
        const aulas = resAulas.data || [];
        let asig;
        if (esDirector && usuario?.id_usuario != null) {
          const resAsig = await api.get(`/api/director/${usuario.id_usuario}/edificios`);
          asig = resAsig.data || [];
        } else {
          asig = edificios.map(e => ({ id_edificio: e.id_edificio, plantas: 'ambas' }));
        }
        if (!activo) return;
        const arbol = asig.map(a => {
          const edif = edificios.find(e => e.id_edificio === a.id_edificio);
          const plantas = a.plantas === 'ambas' ? ['baja', 'alta'] : [a.plantas];
          return {
            id_edificio: a.id_edificio,
            nombre: edif?.nombre_edificio || `Edificio ${a.id_edificio}`,
            plantas: plantas.map(p => ({
              planta: p,
              aulas: aulas.filter(x => x.id_edificio === a.id_edificio && x.planta === p)
            }))
          };
        });
        setArbolMisAulas(arbol);
      } catch (err) {
        console.error('Error al cargar mis aulas:', err);
      }
    };
    cargarMisAulas();
    return () => { activo = false; };
  }, [tieneDocencia, esDirector, usuario?.id_usuario]);

  const BadgePendientes = () => (
    pendientes === null ? null : (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
        pendientes > 0 ? 'bg-red-500/90 text-white animate-pulse' : 'bg-white/15 text-white/70'
      }`}>
        {pendientes}
      </span>
    )
  );

  const toggleSidebar = () => {
    setColapsado(!colapsado);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#701330] text-white rounded-lg shadow-lg hover:bg-[#912347] transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {!colapsado && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        bg-[#701330] text-white shadow-xl relative overflow-hidden
        transition-all duration-300 ease-in-out
        fixed lg:relative z-50
        ${colapsado ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        w-64 min-h-screen flex flex-col
      `}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none"></div>

        <div className="p-5 border-b border-white/15 relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wide animate-fadeIn">SIGAE UTVT</h2>
            <p className="text-xs text-white/75 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${esSuperAdmin ? 'bg-amber-300 animate-pulse' : esDirector ? 'bg-blue-300 animate-pulse' : 'bg-white/50'}`}></span>
              {esSuperAdmin ? 'Super Administrador' : esDirector ? 'Director de Carrera' : 'Usuario'}
            </p>
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden lg:block text-white/60 hover:text-white transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${colapsado ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 mt-4 px-3 flex-1 relative z-10 overflow-y-auto sidebar-scroll">
          {tieneDocencia && (
            <>
              <SeccionTitulo>Mi Docencia</SeccionTitulo>

              <Submenu
                icon={Iconos.aula}
                label="Mis Aulas"
                rutasActivas={['/horario-aula']}
                maxH="max-h-[26rem]"
              >
                <MisAulasArbol arbol={arbolMisAulas} />
              </Submenu>

              <ItemLink to="/aulas" icon={Iconos.aula}>
                Dar de alta aulas
              </ItemLink>

              <ItemLink to="/horarios" icon={Iconos.horario}>
                Horarios
              </ItemLink>

              <Submenu
                icon={Iconos.solicitar}
                label="Reservas"
                rutasActivas={['/director/reservas', '/responsable/reservas']}
                extra={<BadgePendientes />}
              >
                <ItemLink to="/director/reservas" icon={Iconos.solicitar}>
                  Solicitar Reserva
                </ItemLink>
                <ItemLink to="/responsable/reservas" icon={Iconos.aprobar}>
                  Aprobar Reservas
                </ItemLink>
              </Submenu>
            </>
          )}

          <SeccionTitulo>General</SeccionTitulo>

          <ItemLink to="/dashboard" icon={Iconos.dashboard}>
            Dashboard
          </ItemLink>

          <ItemLink to="/reportes" icon={Iconos.reportes}>
            Reportes
          </ItemLink>

          <ItemLink to="/infraestructura" icon={Iconos.vistaGeneral}
            extra={
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse delay-300"></span>
              </div>
            }
          >
            Vista General
          </ItemLink>

          {esSuperAdmin && (
            <>
              <SeccionTitulo>Operaciones</SeccionTitulo>

              <ItemLink to="/solicitudes" icon={Iconos.solicitudes}>
                Solicitudes
              </ItemLink>

              <ItemLink to="/edificios" icon={Iconos.edificio}>
                Edificios
              </ItemLink>
            </>
          )}

          <div className="mt-auto pt-4 border-t border-white/15 mx-3 mb-3">
            <ItemLink to="/perfil" icon={Iconos.perfil}>
              Mi Perfil
            </ItemLink>
          </div>
        </nav>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out forwards;
          }
          .delay-150 { animation-delay: 150ms; }
          .delay-300 { animation-delay: 300ms; }
          @media (max-width: 1023px) {
            .sidebar-link {
              padding: 0.75rem 1rem !important;
            }
          }
        `}</style>
      </aside>
    </>
  );
}
