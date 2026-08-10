import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="qz-footer">
      <div className="qz-container qz-footer__inner">
        <div className="qz-footer__brand">
          <Logo size={28} />
          <p>Your space. Your people. Your room.</p>
        </div>
        <div className="qz-footer__cols">
          <div>
            <h4>Product</h4>
            <Link to="/explore">Explore Rooms</Link>
            <Link to="/create">Create Room</Link>
            <Link to="/join">Join Room</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/profile">Profile</Link>
            <Link to="/settings">Settings</Link>
          </div>
        </div>
      </div>
      <div className="qz-container qz-footer__bottom">
        <span>© {new Date().getFullYear()} Qyzen Rooms . qyzen.online</span>
      </div>
    </footer>
  );
}

