import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const Avatar = ({ name, size = 36 }) => {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#00a884','#2196f3','#9c27b0','#f44336','#ff9800'];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: colors[colorIndex],
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
};

const AdminPanel = ({ group, onApprove, onReject, onRemove, currentUserId }) => {
  const [tab, setTab] = useState('requests'); // 'requests' | 'members'
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (action, userId) => {
    setActionLoading((p) => ({ ...p, [userId]: true }));
    try {
      await action(userId);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  const joinRequests = group?.joinRequests || [];
  const members = group?.members || [];

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <span>👑</span>
        <h3>Admin Panel</h3>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'requests' ? 'active' : ''}`}
          onClick={() => setTab('requests')}
        >
          Requests
          {joinRequests.length > 0 && (
            <span className="badge">{joinRequests.length}</span>
          )}
        </button>
        <button
          className={`admin-tab ${tab === 'members' ? 'active' : ''}`}
          onClick={() => setTab('members')}
        >
          Members ({members.length})
        </button>
      </div>

      <div className="admin-content">
        {tab === 'requests' && (
          <div className="request-list">
            {joinRequests.length === 0 ? (
              <div className="empty-state">No pending requests</div>
            ) : (
              joinRequests.map((jr) => (
                <div key={jr.user._id} className="request-item">
                  <Avatar name={jr.user.name} size={38} />
                  <div className="request-info">
                    <span className="request-name">{jr.user.name}</span>
                    <span className="request-email">{jr.user.email}</span>
                    <span className="request-time">
                      {formatDistanceToNow(new Date(jr.requestedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-approve"
                      disabled={actionLoading[jr.user._id]}
                      onClick={() => handleAction(onApprove, jr.user._id)}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-reject"
                      disabled={actionLoading[jr.user._id]}
                      onClick={() => handleAction(onReject, jr.user._id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="member-list">
            {members.map((member) => (
              <div key={member._id} className="member-item">
                <div className="member-avatar-wrap">
                  <Avatar name={member.name} size={36} />
                  <span className={`online-dot ${member.isOnline ? 'online' : 'offline'}`} />
                </div>
                <div className="member-info">
                  <span className="member-name">
                    {member.name}
                    {member._id === group?.admin?._id && (
                      <span className="admin-badge"> 👑</span>
                    )}
                  </span>
                  <span className="member-email">{member.email}</span>
                </div>
                {member._id !== currentUserId && member._id !== group?.admin?._id && (
                  <button
                    className="btn-remove"
                    disabled={actionLoading[member._id]}
                    onClick={() => {
                      if (confirm(`Remove ${member.name} from the group?`)) {
                        handleAction(onRemove, member._id);
                      }
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
