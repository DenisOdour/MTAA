import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const AV_COLORS = ['#1a7a4a','#1a5fa8','#6c3483','#c0392b','#e67e22'];
const avColor = name => AV_COLORS[(name?.charCodeAt(0)||0) % AV_COLORS.length];

export default function Messages() {
  const { user } = useAuth();
  const { newMessages, setNewMessages } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);

  // Load conversations
  useEffect(() => {
    API.get('/messages/conversations').then(({ data }) => {
      setConversations(data.conversations || []);
      setLoadingConvs(false);
    }).catch(() => setLoadingConvs(false));
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!active) return;
    setLoadingMsgs(true);
    API.get(`/messages/${active._id}`).then(({ data }) => {
      setMessages(data.messages || []);
      setLoadingMsgs(false);
    }).catch(() => setLoadingMsgs(false));
  }, [active]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!newMessages.length) return;
    const latest = newMessages[newMessages.length - 1];
    const senderId = latest.sender?._id || latest.sender;
    if (active && senderId === active._id) {
      setMessages(prev => [...prev, latest]);
    }
    // Update conversation preview
    setConversations(prev => {
      const existing = prev.find(c => c.other?._id === senderId);
      if (existing) {
        return prev.map(c => c.other?._id === senderId ? { ...c, lastMessage: latest } : c);
      }
      return prev;
    });
    setNewMessages([]);
  }, [newMessages, active, setNewMessages]);

  const sendMessage = async () => {
    if (!text.trim() || !active) return;
    const content = text.trim();
    setText('');
    try {
      const { data } = await API.post('/messages', { recipientId: active._id, content });
      setMessages(prev => [...prev, data.message]);
    } catch { toast.error('Failed to send message'); setText(content); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '1rem' }}>💬 Messages</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '12px', height: 'calc(100vh - 160px)', minHeight: '500px' }}>

        {/* Conversations list */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px' }}>
            Conversations
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#5a7a60' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No conversations yet</div>
                <div style={{ fontSize: '12px' }}>Start a conversation by finding users on the community map or in the feed.</div>
              </div>
            ) : (
              conversations.map((conv, i) => {
                const other = conv.other;
                if (!other) return null;
                const isActive = active?._id === other._id;
                return (
                  <div key={i} onClick={() => setActive(other)}
                    style={{ display: 'flex', gap: '10px', padding: '12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isActive ? 'var(--green-light)' : 'white', transition: 'background 0.15s' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: avColor(other.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '14px', flexShrink: 0 }}>
                      {other.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{other.name}</div>
                      <div style={{ fontSize: '12px', color: '#5a7a60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </div>
                    </div>
                    {conv.lastMessage?.createdAt && (
                      <div style={{ fontSize: '11px', color: '#5a7a60', flexShrink: 0 }}>
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!active ? (
            <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: '12px', color: '#5a7a60', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '52px' }}>💬</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Select a conversation</div>
              <div style={{ fontSize: '13px', maxWidth: 280 }}>You can message anyone from the community map or from the stories feed.</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: avColor(active.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '13px' }}>
                  {active.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{active.name}</div>
                  {active.area && <div style={{ fontSize: '12px', color: '#5a7a60' }}>📍 {active.area}</div>}
                </div>
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loadingMsgs
                  ? <div className="flex-center" style={{ flex: 1 }}><div className="spinner" /></div>
                  : messages.length === 0
                    ? <div style={{ textAlign: 'center', color: '#5a7a60', marginTop: '2rem' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>👋</div>
                        <div style={{ fontSize: '13px' }}>Say hello to {active.name}!</div>
                      </div>
                    : messages.map((msg, i) => {
                        const isMine = (msg.sender?._id || msg.sender) === user?._id;
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                            <div>
                              <div className={`bubble ${isMine ? 'sent' : 'received'}`}>{msg.content}</div>
                              <div style={{ fontSize: '11px', color: '#5a7a60', marginTop: '3px', textAlign: isMine ? 'right' : 'left' }}>
                                {msg.createdAt && format(new Date(msg.createdAt), 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        );
                      })
                }
                <div ref={bottomRef} />
              </div>

              {/* Message input */}
              <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                <input
                  style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', transition: 'border-color 0.18s' }}
                  placeholder={`Message ${active.name}…`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  onFocus={e => e.target.style.borderColor = '#1a7a4a'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button className="btn btn-primary" onClick={sendMessage} disabled={!text.trim()}>Send →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
