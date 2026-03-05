import { useAuth } from '../context/AuthContext';

const Avatar = ({ name, size = 40 }) => {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#00a884','#2196f3','#9c27b0','#f44336','#ff9800','#009688'];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: colors[colorIndex],
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
};

const Sidebar = ({ group, onlineUsers, onLogout }) => {
  const { user } = useAuth();

  return (
    <div className="sidebar">
      {/* Current user header */}
      <div className="sidebar-header">
        <Avatar name={user?.name} size={38} />
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name}</span>
          {user?.isAdmin && <span className="admin-chip">Admin</span>}
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Group info */}
      {group && (
        <div className="group-info-card">
          <div className="group-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <h2 className="group-name">{group.name}</h2>
            <p className="group-desc">{group.description}</p>
            <span className="group-count">{group.members?.length || 0} members</span>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="sidebar-section-title">MEMBERS</div>
      <div className="members-scroll">
        {group?.members?.map((member) => {
          const isOnline = onlineUsers[member._id] ?? member.isOnline;
          return (
            <div key={member._id} className="member-row">
              <div className="member-avatar-wrap">
                <Avatar name={member.name} size={34} />
                <span className={`online-dot ${isOnline ? 'online' : 'offline'}`} />
              </div>
              <div className="member-details">
                <span className="member-name-sm">
                  {member.name}
                  {member._id === group?.admin?._id && ' 👑'}
                  {member._id === user?._id && ' (you)'}
                </span>
                <span className="member-status">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
