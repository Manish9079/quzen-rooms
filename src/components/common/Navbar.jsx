import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Compass, Plus, LogIn, LogOut, UserPlus } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';
import Avatar from './Avatar';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const LINKS = [
  { to: '/explore', label: 'Explore Rooms', icon: Compass },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <header className="qz-nav">
      <div className="qz-container qz-nav__inner">
        <Link to="/" className="qz-nav__brand" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className={`qz-nav__links ${open ? 'qz-nav__links--open' : ''}`}>
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `qz-nav__link ${isActive ? 'qz-nav__link--active' : ''}`} onClick={() => setOpen(false)}>
              <Icon size={17} strokeWidth={2.1} /> {label}
            </NavLink>
          ))}
          <div className="qz-nav__mobile-actions">
            {isAuthenticated ? (
              <>
              <Button
  as={Link}
  to="/profile"
  variant="secondary"
  onClick={() => setOpen(false)}
>
  Profile
</Button>
                <Button as={Link} to="/join" variant="secondary" icon={LogIn} onClick={() => setOpen(false)}>Join Room</Button>
                <Button as={Link} to="/create" variant="primary" icon={Plus} onClick={() => setOpen(false)}>Create Room</Button>
                <Button variant="ghost" icon={LogOut} onClick={handleLogout}>Log out</Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="secondary" icon={LogIn} onClick={() => setOpen(false)}>Log in</Button>
                <Button as={Link} to="/register" variant="primary" icon={UserPlus} onClick={() => setOpen(false)}>Sign up</Button>
              </>
            )}
          </div>
        </nav>

        <div className="qz-nav__actions">
          {isAuthenticated ? (
            <>
              <Button as={Link} to="/join" variant="secondary" size="sm" icon={LogIn}>Join Room</Button>
              <Button as={Link} to="/create" variant="primary" size="sm" icon={Plus}>Create Room</Button>
              <Link to="/profile" className="qz-nav__avatar" aria-label="Your profile">
                <Avatar name={user.displayName} color="#16A374" size={40} />
                <Button
  variant="ghost"
  size="sm"
  icon={LogOut}
  onClick={handleLogout}
>
  Log out
</Button>
              </Link>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="secondary" size="sm" icon={LogIn}>Log in</Button>
              <Button as={Link} to="/register" variant="primary" size="sm" icon={UserPlus}>Sign up</Button>
            </>
          )}
        </div>

        <button className="qz-nav__burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
