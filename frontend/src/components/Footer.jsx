import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="ocdra-footer mt-auto">
      <div className="container">
        {/* Logos */}
        <div className="footer-logos">
          <img src="/ched-logo.png" alt="CHED" />
          <img src="/bp-logo-white.png" alt="Bagong Pilipinas" />
        </div>

        {/* Title */}
        <h5 className="footer-title">SUC Directory Management System</h5>
        <p className="footer-desc">
          Commission on Higher Education — Official SUC Directory for managing
          State Universities and Colleges information.
        </p>

        {/* Tags */}
        <div className="footer-tags">
          <span className="footer-tag">Official</span>
          <span className="footer-tag">Transparent</span>
          <span className="footer-tag">Service-Oriented</span>
        </div>

        {/* Quick Links */}
        <div className="footer-quick">
          <h6>QUICK LINKS</h6>
          <div className="d-flex justify-content-center gap-4">
            <Link to="/">Public Directory</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          Copyright &copy; {new Date().getFullYear()} Commission on Higher Education. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
