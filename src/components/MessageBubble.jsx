import { format } from 'date-fns';
import MessageTicks from './MessageTicks';

const Avatar = ({ name, size = 32 }) => {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#00a884','#2196f3','#9c27b0','#f44336','#ff9800','#009688'];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[colorIndex], color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

const MessageBubble = ({ message, isOwn, showName, members }) => {
  const senderName = message.senderId?.name || 'Unknown';
  const time = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div className={`message-row ${isOwn ? 'message-own' : 'message-other'}`}>
      {!isOwn && (
        <div className="message-avatar">
          <Avatar name={senderName} size={30} />
        </div>
      )}
      <div className={`bubble ${isOwn ? 'bubble-out' : 'bubble-in'}`}>
        {!isOwn && showName && (
          <span className="bubble-sender">{senderName}</span>
        )}
        <span className="bubble-text">{message.messageText}</span>
        <div className="bubble-meta">
          <span className="bubble-time">{time}</span>
          {isOwn && (
            <MessageTicks
              message={message}
              currentUserId={message.senderId?._id}
              members={members}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
