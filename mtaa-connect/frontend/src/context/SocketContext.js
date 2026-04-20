import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [liveLocations, setLiveLocations] = useState({});
  const [newMessages, setNewMessages] = useState([]);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://mtaa-connect.onrender.com';
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (user?._id) {
        socket.emit('join', user._id);
        if (user.role === 'admin' || user.role === 'super_admin') {
          socket.emit('join_admin');
        }
      }
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('users_online', count => setOnlineCount(count));

    socket.on('emergency_broadcast', data => {
      setActiveEmergency(data);
      const icons = { violence: '⚔️', fire: '🔥', medical: '🏥', missing_child: '👶', flood: '💧', other: '⚠️' };
      toast.error(
        `🚨 EMERGENCY: ${(data.type || '').replace('_', ' ').toUpperCase()} — ${data.area || data.location || ''}`,
        { duration: 15000, style: { background: '#c0392b', color: 'white', fontWeight: 700 } }
      );
    });

    socket.on('emergency_resolved', () => setActiveEmergency(null));

    socket.on('user_location_update', data => {
      if (data.userId) {
        setLiveLocations(prev => ({ ...prev, [data.userId]: { ...data, timestamp: Date.now() } }));
      }
    });

    socket.on('new_job', data => {
      toast.success(`💼 New job: ${data.title} — ${data.pay}`, { duration: 6000 });
    });

    socket.on('new_message', msg => {
      setNewMessages(prev => [...prev, msg]);
      toast(`💬 New message from ${msg.sender?.name || 'someone'}`, { duration: 4000 });
    });

    socket.on('post_moderated', data => {
      if (data.action === 'approve' || data.action === 'feature') {
        toast.success('✅ Your post has been approved and is now live!', { duration: 6000 });
      } else if (data.action === 'reject') {
        toast.error('Your post was not approved. Check your notifications.', { duration: 6000 });
      }
    });

    socket.on('payment_confirmed', data => {
      toast.success(`✅ Payment confirmed! Your ${(data.purpose || '').replace('_', ' ')} is now active.`, { duration: 8000 });
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const emitLocation = (lat, lng) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('share_location', {
        userId: user._id, name: user.name, area: user.area, role: user.role, lat, lng
      });
    }
  };

  const emitEmergency = data => {
    socketRef.current?.emit('emergency_alert', data);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected, onlineCount,
      activeEmergency, setActiveEmergency,
      liveLocations, newMessages, setNewMessages,
      emitLocation, emitEmergency
    }}>
      {children}
    </SocketContext.Provider>
  );
};
