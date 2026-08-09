import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';

import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { friendService } from '../services/friendService';
import { directMessageService } from '../services/directMessageService';

import './DirectChat.css';

export default function DirectChat() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
const [selectedMessageId, setSelectedMessageId] = useState(null);
  useEffect(() => {
  let unsubscribe;
  let unsubscribeDelete;
  let unsubscribeUpdate;

  async function loadChat() {
    try {
      const friends = await friendService.getFriends(user.id);

      const currentFriend = friends.find(
        (item) => item.id === userId
      );

      setFriend(currentFriend || null);

      if (!currentFriend) {
        setLoading(false);
        return;
      }

      const history =
        await directMessageService.getHistory(
          user.id,
          userId
        );

      setMessages(history);

      // Realtime new messages
      unsubscribe = directMessageService.subscribe(
        user.id,
        userId,
        async (message) => {
          setMessages((current) => {
            if (
              current.some(
                (item) => item.id === message.id
              )
            ) {
              return current;
            }

            return [...current, message];
          });

          // Chat open hai aur message mujhe aaya hai
          // to turant Seen mark karo
          if (
            message.receiverId === user.id &&
            message.isRead !== true
          ) {
            try {
              await directMessageService.markConversationAsRead(
                user.id,
                userId
              );
            } catch (error) {
              console.error(
                'Could not mark incoming message as read:',
                error
              );
            }
          }
        }
      );

      // Realtime deleted messages
      unsubscribeDelete =
        directMessageService.subscribeToDeleted(
          user.id,
          userId,
          (message) => {
            setMessages((current) =>
              current.filter(
                (item) => item.id !== message.id
              )
            );

            setSelectedMessageId((current) =>
              current === message.id
                ? null
                : current
            );
          }
        );

      // Realtime Sent -> Seen updates
      unsubscribeUpdate =
        directMessageService.subscribeToUpdates(
          user.id,
          userId,
          (updatedMessage) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === updatedMessage.id
                  ? updatedMessage
                  : message
              )
            );
          }
        );

      // Purane unread messages ko Seen karo
      await directMessageService.markConversationAsRead(
        user.id,
        userId
      );
    } catch (error) {
      console.error('Could not load chat:', error);
    } finally {
      setLoading(false);
    }
  }

  loadChat();

  return () => {
    if (unsubscribe) unsubscribe();
    if (unsubscribeDelete) unsubscribeDelete();
    if (unsubscribeUpdate) unsubscribeUpdate();
  };
}, [user.id, userId]);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  async function handleSend(event) {
  event.preventDefault();

  const body = text.trim();

  if (!body || !friend) return;

  // Send dabate hi input empty
  setText('');

  try {
    const message =
      await directMessageService.send(
        user,
        friend.id,
        body
      );

    if (message) {
      setMessages((current) => {
        if (
          current.some(
            (item) => item.id === message.id
          )
        ) {
          return current;
        }

        return [...current, message];
      });
    }
  } catch (error) {
    console.error('Could not send message:', error);

    // Sirf actual send fail ho tab text wapas aaye
    setText(body);
  }
}
async function handleDeleteMessage(messageId) {
  const ok = window.confirm('Delete this message?');

  if (!ok) return;

  try {
    await directMessageService.deleteMessage(messageId);

    setMessages((current) =>
      current.filter((item) => item.id !== messageId)
    );

    setSelectedMessageId(null);
  } catch (error) {
    console.error('Could not delete message:', error);
  }
}
async function handleDeleteConversation() {
  const ok = window.confirm(
    `Delete all messages with ${friend?.displayName || 'this friend'}?`
  );

  if (!ok || !friend) return;

  try {
    await directMessageService.deleteConversation(
      user.id,
      friend.id
    );

    setMessages([]);
    setSelectedMessageId(null);
  } catch (error) {
    console.error('Could not delete conversation:', error);
  }
}
  if (loading) {
    return (
      <div className="qz-direct-chat__state">
        Loading chat...
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="qz-direct-chat__state">
        <h2>Friend not found</h2>
        <p>You can only message people in your friends list.</p>

        <Button as={Link} to="/friends">
          Back to Friends
        </Button>
      </div>
    );
  }

  return (
    <main className="qz-direct-chat">
      <header className="qz-direct-chat__header">
        <Link
          to="/friends"
          className="qz-direct-chat__back"
          aria-label="Back to friends"
        >
          <ArrowLeft size={21} />
        </Link>

        <Avatar
          name={friend.displayName}
          color="#16A374"
          size={42}
        />

        <div>
  <strong>{friend.displayName}</strong>
</div>
        
<button
  type="button"
  className="qz-direct-chat__delete-all"
  onClick={handleDeleteConversation}
  aria-label="Delete all messages"
  title="Delete all messages"
>
  <Trash2 size={18} />
</button>
      </header>

      <section className="qz-direct-chat__messages">
        {messages.length === 0 && (
          <div className="qz-direct-chat__empty">
            No messages yet. Say hello 👋
          </div>
        )}

        {messages.map((message) => {
          const mine = message.senderId === user.id;

          return (
           <div
  key={message.id}
  className={
    mine
      ? 'qz-direct-chat__message qz-direct-chat__message--mine'
      : 'qz-direct-chat__message'
  }
>
  <div
    className="qz-direct-chat__bubble-wrap"
    onClick={() => {
      if (mine) {
        setSelectedMessageId(
          selectedMessageId === message.id
            ? null
            : message.id
        );
      }
    }}
  >
    <div className="qz-direct-chat__bubble">
      {message.body}
    </div>
{mine && (
  <span className="qz-direct-chat__status">
    {message.isRead ? 'Seen' : 'Sent'}
  </span>
)}
    {mine && selectedMessageId === message.id && (
      <button
        type="button"
        className="qz-direct-chat__delete"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteMessage(message.id);
        }}
      >
        Delete
      </button>
    )}
  </div>
</div>
          );
        })}

        <div ref={bottomRef} />
      </section>

      <form
        className="qz-direct-chat__composer"
        onSubmit={handleSend}
      >
        <input
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder={`Message ${friend.displayName}`}
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <Send size={19} />
        </button>
      </form>
    </main>
  );
}