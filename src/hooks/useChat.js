import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export const useChat = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [membershipStatus, setMembershipStatus] = useState(null); // { isMember, hasPendingRequest }
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinRequestSent, setJoinRequestSent] = useState(false);

  const typingTimerRef = useRef(null);

  // ── Load initial data ────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Get membership status
      const statusRes = await API.get('/group/status');
      setMembershipStatus(statusRes.data);

      if (statusRes.data.hasPendingRequest) setJoinRequestSent(true);

      if (statusRes.data.isMember) {
        // Load group details and messages in parallel
        const [groupRes, messagesRes] = await Promise.all([
          API.get('/group'),
          API.get('/messages?page=1&limit=50'),
        ]);
        setGroup(groupRes.data);
        setMessages(messagesRes.data.messages);

        // Build initial online map
        const onlineMap = {};
        groupRes.data.members.forEach((m) => {
          onlineMap[m._id] = m.isOnline;
        });
        setOnlineUsers(onlineMap);
      } else if (user?.isAdmin) {
        const groupRes = await API.get('/group');
        setGroup(groupRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ── Socket event listeners ───────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // New message received
    const handleNewMessage = (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      // Auto-mark as delivered (socket delivery = received)
      // (already handled on backend when broadcast happens)

      // If chat is open, mark as seen after 1 second
      setTimeout(() => {
        socket.emit('mark-seen');
      }, 1000);
    };

    // Messages seen by someone
    const handleMessagesSeen = ({ seenBy, seenByName }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.senderId?._id === user?._id && !msg.seenBy?.includes(seenBy)) {
            return {
              ...msg,
              seenBy: [...(msg.seenBy || []), seenBy],
            };
          }
          return msg;
        })
      );
    };

    // User typing
    const handleUserTyping = ({ userId, userName, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.find((u) => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        } else {
          return prev.filter((u) => u.userId !== userId);
        }
      });
    };

    // User online/offline
    const handleUserOnline = ({ userId, isOnline }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
    };

    // Join request approved
    const handleJoinApproved = async ({ groupId, groupName }) => {
      setJoinRequestSent(false);
      await loadInitialData();
    };

    // Join request rejected
    const handleJoinRejected = () => {
      setJoinRequestSent(false);
      setMembershipStatus((prev) => ({ ...prev, hasPendingRequest: false }));
    };

    // Removed from group
    const handleRemovedFromGroup = () => {
      setMembershipStatus({ isMember: false, hasPendingRequest: false });
      setMessages([]);
    };

    // New member joined
    const handleMemberJoined = ({ user: newUser }) => {
      setGroup((prev) => {
        if (!prev) return prev;
        if (prev.members.some((m) => m._id === newUser._id)) return prev;
        return { ...prev, members: [...prev.members, newUser] };
      });
    };

    // Admin: new join request notification
    const handleNewJoinRequest = ({ user: requestUser, requestedAt }) => {
      setGroup((prev) => {
        if (!prev) return prev;
        const alreadyExists = prev.joinRequests?.some(
          (jr) => jr.user._id === requestUser._id
        );
        if (alreadyExists) return prev;
        return {
          ...prev,
          joinRequests: [
            ...(prev.joinRequests || []),
            { user: requestUser, requestedAt },
          ],
        };
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('messages-seen', handleMessagesSeen);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-online', handleUserOnline);
    socket.on('join-request-approved', handleJoinApproved);
    socket.on('join-request-rejected', handleJoinRejected);
    socket.on('removed-from-group', handleRemovedFromGroup);
    socket.on('member-joined', handleMemberJoined);
    socket.on('new-join-request', handleNewJoinRequest);

    // Mark all as seen when chat opens
    socket.emit('mark-seen');

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('messages-seen', handleMessagesSeen);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-online', handleUserOnline);
      socket.off('join-request-approved', handleJoinApproved);
      socket.off('join-request-rejected', handleJoinRejected);
      socket.off('removed-from-group', handleRemovedFromGroup);
      socket.off('member-joined', handleMemberJoined);
      socket.off('new-join-request', handleNewJoinRequest);
    };
  }, [socket, user, loadInitialData]);

  // ── Actions ──────────────────────────────────────────────
  const sendMessage = useCallback(
    (messageText) => {
      if (!socket || !messageText.trim()) return;
      socket.emit('send-message', { messageText });
    },
    [socket]
  );

  const sendTyping = useCallback(
    (isTyping) => {
      if (!socket) return;
      socket.emit('typing', { isTyping });

      if (isTyping) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          socket.emit('typing', { isTyping: false });
        }, 2000);
      }
    },
    [socket]
  );

  const requestJoin = useCallback(async () => {
    try {
      await API.post('/group/request-join');
      setJoinRequestSent(true);
      setMembershipStatus((prev) => ({ ...prev, hasPendingRequest: true }));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to send request');
    }
  }, []);

  const approveRequest = useCallback(async (userId) => {
    await API.post(`/group/approve/${userId}`);
    setGroup((prev) => ({
      ...prev,
      joinRequests: prev.joinRequests.filter((jr) => jr.user._id !== userId),
    }));
  }, []);

  const rejectRequest = useCallback(async (userId) => {
    await API.delete(`/group/reject/${userId}`);
    setGroup((prev) => ({
      ...prev,
      joinRequests: prev.joinRequests.filter((jr) => jr.user._id !== userId),
    }));
  }, []);

  const removeMember = useCallback(async (userId) => {
    await API.delete(`/group/remove/${userId}`);
    setGroup((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m._id !== userId),
    }));
  }, []);

  return {
    group,
    messages,
    membershipStatus,
    typingUsers,
    onlineUsers,
    loading,
    error,
    joinRequestSent,
    sendMessage,
    sendTyping,
    requestJoin,
    approveRequest,
    rejectRequest,
    removeMember,
    reload: loadInitialData,
  };
};
