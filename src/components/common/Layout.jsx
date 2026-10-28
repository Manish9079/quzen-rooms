import Navbar, { MobileBottomNav } from './Navbar';
import Footer from './Footer';

export default function Layout({ children, footer = true }) {
  return (
    <>
      <Navbar />
      <MobileBottomNav />
      <main>{children}</main>
      {footer && <Footer />}
    </>
  );
}
