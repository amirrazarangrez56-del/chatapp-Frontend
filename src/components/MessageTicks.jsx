/**
 * MessageTicks - shows delivery/seen status for sender's messages
 * Single tick  = sent (saved to DB)
 * Double tick  = delivered (at least one other member received)
 * Blue ticks   = seen (at least one member opened chat)
 */
const MessageTicks = ({ message, currentUserId, members }) => {
  // Only show ticks for messages sent by the current user
  if (message.senderId?._id !== currentUserId && message.senderId !== currentUserId) {
    return null;
  }

  const memberCount = members?.length || 1;
  // Exclude the sender from calculations
  const othersCount = memberCount - 1;

  const deliveredCount = (message.deliveredTo || []).filter(
    (id) => id !== currentUserId && id !== message.senderId?._id
  ).length;

  const seenCount = (message.seenBy || []).filter(
    (id) => id !== currentUserId && id !== message.senderId?._id
  ).length;

  const isSeen = seenCount > 0;
  const isDelivered = deliveredCount > 0;

  if (isSeen) {
    // Blue double ticks
    return (
      <span className="ticks ticks-seen" title="Seen">
        <DoubleTick color="#53bdeb" />
      </span>
    );
  }

  if (isDelivered) {
    // Grey double ticks
    return (
      <span className="ticks ticks-delivered" title="Delivered">
        <DoubleTick color="#8696a0" />
      </span>
    );
  }

  // Single grey tick - sent
  return (
    <span className="ticks ticks-sent" title="Sent">
      <SingleTick color="#8696a0" />
    </span>
  );
};

const SingleTick = ({ color }) => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
    <path d="M1 6L5 10L15 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleTick = ({ color }) => (
  <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
    <path d="M1 6L5 10L15 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6L9 10L19 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default MessageTicks;
