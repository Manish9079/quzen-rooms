import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { directMessageService } from '../services/directMessageService';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { friendService } from '../services/friendService';

import './Friends.css';

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadFriendsData() {
    try {
      const [incoming, friendList] = await Promise.all([
        friendService.getIncomingRequests(user.id),
        friendService.getFriends(user.id),
      ]);

      setRequests(incoming);
      setFriends(friendList);
      const counts = {};

await Promise.all(
  friendList.map(async (friend) => {
    counts[friend.id] =
      await directMessageService.getUnreadCount(
        user.id,
        friend.id
      );
  })
);

setUnreadCounts(counts);
    } catch (err) {
      showToast(err.message || 'Could not load friends.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFriendsData();
  }, [user.id]);
  useEffect(() => {
  const unsubscribe =
    directMessageService.subscribeToAllIncoming(
      user.id,
      (message) => {
        setUnreadCounts((current) => ({
          ...current,
          [message.senderId]:
            (current[message.senderId] || 0) + 1,
        }));

        showToast(
          `${message.senderDisplayName} sent you a message`
        );
      }
    );

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [user.id, showToast]);

  async function handleSearch(e) {
    e.preventDefault();

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      const users = await friendService.searchUsers(query, user.id);
      setResults(users);
    } catch (err) {
      showToast(err.message || 'Could not search users.', 'error');
    } finally {
      setSearching(false);
    }
  }

  async function handleAddFriend(targetUser) {
    try {
      await friendService.sendFriendRequest(user, targetUser);

      showToast('Friend request sent.');

      setResults((prev) =>
        prev.filter((item) => item.ownerId !== targetUser.ownerId)
      );
    } catch (err) {
      showToast(err.message || 'Could not send friend request.', 'error');
    }
  }

  async function handleAccept(request) {
    try {
      await friendService.acceptFriendRequest(request);

      setRequests((prev) =>
        prev.filter((item) => item.id !== request.id)
      );

      await loadFriendsData();
      showToast('Friend added.');
    } catch (err) {
      showToast(err.message || 'Could not accept request.', 'error');
    }
  }

  async function handleReject(request) {
    try {
      await friendService.rejectFriendRequest(request.id);

      setRequests((prev) =>
        prev.filter((item) => item.id !== request.id)
      );

      showToast('Friend request rejected.');
    } catch (err) {
      showToast(err.message || 'Could not reject request.', 'error');
    }
  }
  async function handleUnfriend(friend) {
  const ok = window.confirm(
    `Remove ${friend.displayName} from your friends?`
  );

  if (!ok) return;

  try {
    await friendService.removeFriend(friend.friendshipId);

    setFriends((prev) =>
      prev.filter(
        (item) => item.friendshipId !== friend.friendshipId
      )
    );

    showToast('Friend removed.');
  } catch (err) {
    showToast(
      err.message || 'Could not remove friend.',
      'error'
    );
  }
}

  return (
    <main className="qz-friends">
      <div className="qz-container qz-friends__inner">
        <section className="qz-friends__head">
          <span className="qz-eyebrow">Friends</span>
          <h1>Your people</h1>
          <p>Find people, add friends and chat privately.</p>
        </section>

        <form className="qz-friends__search" onSubmit={handleSearch}>
          <Search size={18} />

          <input
            type="text"
            placeholder="Search username or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Button type="submit" size="sm" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {results.length > 0 && (
          <section className="qz-friends__section">
            <h2>Search results</h2>

            <div className="qz-friends__list">
              {results.map((person) => (
                <div key={person.ownerId} className="qz-friend-card">
                  <Avatar
                    name={person.displayName}
                    color="#16A374"
                    size={44}
                  />

                  <div className="qz-friend-card__info">
                    <strong>{person.displayName}</strong>
                    <span>@{person.username}</span>
                  </div>

                  <Button
                    size="sm"
                    icon={UserPlus}
                    onClick={() => handleAddFriend(person)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="qz-friends__section">
          <h2>
            Friend requests
            {requests.length > 0 && ` (${requests.length})`}
          </h2>

          {requests.length === 0 ? (
            <p className="qz-friends__empty">
              No pending friend requests.
            </p>
          ) : (
            <div className="qz-friends__list">
              {requests.map((request) => (
                <div key={request.id} className="qz-friend-card">
                  <Avatar
                    name={request.fromDisplayName}
                    color="#34A99B"
                    size={44}
                  />

                  <div className="qz-friend-card__info">
                    <strong>{request.fromDisplayName}</strong>
                    <span>wants to be your friend</span>
                  </div>

                  <div className="qz-friend-card__actions">
                    <Button
                      size="sm"
                      icon={Check}
                      onClick={() => handleAccept(request)}
                    >
                      Accept
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      icon={X}
                      onClick={() => handleReject(request)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="qz-friends__section">
          <h2>My friends</h2>

          {loading ? (
            <p className="qz-friends__empty">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="qz-friends__empty">
              You haven't added any friends yet.
            </p>
          ) : (
            <div className="qz-friends__list">
              {friends.map((friend) => (
                <div key={friend.friendshipId} className="qz-friend-card">
                  <Avatar
                    name={friend.displayName}
                    color="#16A374"
                    size={44}
                  />

                  <div className="qz-friend-card__info">
  <strong>{friend.displayName}</strong>
  <span>Friend</span>
</div>

{unreadCounts[friend.id] > 0 && (
  <span className="qz-friend-card__unread">
    {unreadCounts[friend.id]}
  </span>
)}

                  <Button
                    size="sm"
                    variant="secondary"
                    icon={MessageCircle}
                    onClick={() => navigate(`/chat/${friend.id}`)}
                  >
                    Message
                  </Button>
                  <Button
  size="sm"
  variant="secondary"
  onClick={() => handleUnfriend(friend)}
>
  Unfriend
</Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}