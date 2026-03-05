import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../hooks/useChat';
import MessageBubble from '../components/MessageBubble';
import AdminPanel from '../components/AdminPanel';
import Sidebar from '../components/Sidebar';
import './ChatPage.css';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const {
    group, messages, membershipStatus, typingUsers, onlineUsers,
    loading, error, joinRequestSent,
    sendMessage, sendTyping, requestJoin,
    approveRequest, rejectRequest, removeMember,
  } = useChat();

  const [input, setInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [joinError, setJoinError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    sendTyping(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRequestJoin = async () => {
    setJoinError('');
    try {
      await requestJoin();
    } catch (err) {
      setJoinError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto' }}
            onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const isMember = membershipStatus?.isMember;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <Sidebar
        group={isMember || user?.isAdmin ? group : null}
        onlineUsers={onlineUsers}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div className="chat-main">
        {/* Top bar */}
        <div className="chat-topbar">
          <div className="topbar-group-info">
            <div className="topbar-group-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div>
              <span className="topbar-group-name">{group?.name || 'ChatApp'}</span>
              <span className="topbar-status">
                <span className={`conn-dot ${isConnected ? 'green' : 'red'}`} />
                {isConnected ? `${group?.members?.length || 0} members` : 'Connecting...'}
              </span>
            </div>
          </div>
          <div className="topbar-actions">
            {user?.isAdmin && (
              <button
                className={`admin-toggle-btn ${showAdmin ? 'active' : ''}`}
                onClick={() => setShowAdmin(!showAdmin)}
              >
                👑 Admin
                {(group?.joinRequests?.length || 0) > 0 && (
                  <span className="notif-dot">{group.joinRequests.length}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="chat-content">
          {/* Admin panel overlay */}
          {user?.isAdmin && showAdmin && (
            <div className="admin-panel-overlay">
              <AdminPanel
                group={group}
                onApprove={approveRequest}
                onReject={rejectRequest}
                onRemove={removeMember}
                currentUserId={user._id}
              />
            </div>
          )}

          {/* Not a member view */}
          {!isMember && !user?.isAdmin && (
            <div className="join-screen">
              <div className="join-card">
                <div className="join-icon">💬</div>
                <h2>{group?.name || 'Group Chat'}</h2>
                <p>{group?.description || 'Request access to join the conversation.'}</p>

                {joinError && <div className="error-msg">{joinError}</div>}

                {joinRequestSent || membershipStatus?.hasPendingRequest ? (
                  <div className="pending-badge">
                    <span>⏳</span> Join request pending approval
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 28px' }}
                    onClick={handleRequestJoin}>
                    Request to Join
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin non-member view */}
          {!isMember && user?.isAdmin && !showAdmin && (
            <div className="join-screen">
              <div className="join-card">
                <div className="join-icon">👑</div>
                <h2>Admin Dashboard</h2>
                <p>You are the admin. Click the Admin button above to manage join requests and members.</p>
                <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 28px' }}
                  onClick={() => setShowAdmin(true)}>
                  Open Admin Panel
                </button>
              </div>
            </div>
          )}

          {/* Chat messages area */}
          {isMember && (
            <div className="messages-area">
              {messages.length === 0 && (
                <div className="empty-chat">
                  <span>👋</span>
                  <p>No messages yet. Be the first to say hello!</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isOwn = msg.senderId?._id === user._id || msg.senderId === user._id;
                const prevMsg = messages[idx - 1];
                const showName = !isOwn && prevMsg?.senderId?._id !== msg.senderId?._id;

                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={isOwn}
                    showName={showName}
                    members={group?.members}
                  />
                );
              })}

              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="typing-row">
                  <div className="typing-bubble">
                    <span className="typing-name">
                      {typingUsers.map((u) => u.userName).join(', ')}
                      {typingUsers.length === 1 ? ' is' : ' are'} typing
                    </span>
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        {isMember && (
          <div className="chat-input-bar">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={`send-btn ${input.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
