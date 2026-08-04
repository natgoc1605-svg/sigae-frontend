// api/socket.js
import { io } from 'socket.io-client';

function getSessionId() {
    let sessionId = sessionStorage.getItem('socket_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        sessionStorage.setItem('socket_session_id', sessionId);
    }
    return sessionId;
}

function getAuthToken() {
    return localStorage.getItem('token');
}

const socket = io('http://localhost:3000', {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    withCredentials: true
});

const sessionId = getSessionId();

socket.on('connect', () => {
    console.log('Socket conectado correctamente - Sesion:', sessionId);
    
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.id_usuario) {
                socket.emit('register_user', { 
                    user_id: user.id_usuario,
                    rol: user.rol || 'usuario',
                    session_id: sessionId,
                    token: getAuthToken()
                });
                console.log('Usuario registrado en socket:', user.id_usuario, 'rol:', user.rol);
            }
        } catch (e) {
            console.error('Error al parsear usuario:', e);
        }
    }
});

socket.on('connect_error', (error) => {
    console.error('Error de conexion Socket:', error.message);
    
    if (error.message === 'Authentication error') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }
});

socket.on('connected', (data) => {
    console.log('Confirmacion de conexion:', data);
});

socket.on('notificacion', (data) => {
    console.log('Nueva notificacion:', data);
    window.dispatchEvent(new CustomEvent('nueva-notificacion', { detail: data }));
});

socket.on('disconnect', (reason) => {
    console.log('Socket desconectado:', reason);
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconectado despues de', attemptNumber, 'intentos');
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.id_usuario) {
                socket.emit('register_user', { 
                    user_id: user.id_usuario,
                    rol: user.rol || 'usuario',
                    session_id: sessionId
                });
            }
        } catch (e) {
            console.error('Error al re-registrar usuario:', e);
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (socket.connected) {
        socket.disconnect();
    }
});

export const reconnectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket;