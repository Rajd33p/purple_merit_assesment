import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          User Management
        </Link>

        <ul className="navbar-nav">
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/profile"
              className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}
            >
              Profile
            </Link>
          </li>
        </ul>

        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="navbar-user-name">{user?.full_name}</div>
            <div className="navbar-user-role">{user?.role}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
