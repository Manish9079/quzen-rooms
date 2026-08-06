import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children, footer = true }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      {footer && <Footer />}
    </>
  );
}
