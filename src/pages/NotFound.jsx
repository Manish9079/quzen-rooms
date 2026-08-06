import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="qz-notfound">
      <Orb size={140} />
      <span className="qz-eyebrow">404</span>
      <h1>This room doesn't exist</h1>
      <p>The link or code you followed doesn't match a page we have — let's get you back somewhere real.</p>
      <Button as={Link} to="/" icon={ArrowLeft}>Back to home</Button>
    </div>
  );
}
