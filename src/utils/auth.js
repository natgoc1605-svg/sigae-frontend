// utils/auth.js

export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
};

export const hasPermission = (user, allowedRoles) => {
  if (!user || !user.rol) return false;
  return allowedRoles.includes(user.rol);
};

export const getUserId = (user) => {
  if (!user) {
    console.warn('getUserId: usuario es null o undefined');
    return null;
  }
  
  console.log('Buscando ID en usuario:', user);
  
  // Verificar si el ID existe (incluyendo 0)
  if (user.id_usuario !== undefined && user.id_usuario !== null) {
    return user.id_usuario;
  }
  if (user.id !== undefined && user.id !== null) {
    return user.id;
  }
  if (user.idUser !== undefined && user.idUser !== null) {
    return user.idUser;
  }
  if (user.sub !== undefined && user.sub !== null) {
    return user.sub;
  }
  
  console.warn('getUserId: No se encontró ID en el usuario', user);
  return null;
};

export const isSuperAdmin = (user) => {
  return user?.rol === ROLES.SUPER_ADMIN;
};

export const isDirector = (user) => {
  return user?.rol === ROLES.DIRECTOR;
};

export const isDocente = (user) => {
  return user?.rol === ROLES.DOCENTE;
};

export const isConsulta = (user) => {
  return user?.rol === ROLES.CONSULTA;
};

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  DIRECTOR: 'director',
  DOCENTE: 'docente',
  CONSULTA: 'consulta'
};