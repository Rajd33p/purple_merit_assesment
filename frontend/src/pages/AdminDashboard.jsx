import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0,
  });
  const searchTimeoutRef = useRef(null);
  const [modalData, setModalData] = useState({ isOpen: false, user: null, action: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const { success: showSuccess, error: showError } = useToast();

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/admin/users/?page=${page}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await api.get(url);
      const data = response.data;
      setUsers(data.users);
      setPagination({
        currentPage: page,
        totalPages: data.total_pages,
        count: data.total_users,
      });
    } catch (err) {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  const openModal = (user, action) => {
    setModalData({ isOpen: true, user, action });
  };

  const closeModal = () => {
    setModalData({ isOpen: false, user: null, action: '' });
  };

  const handleAction = async () => {
    const { user, action } = modalData;
    setActionLoading(true);

    try {
      const endpoint = action === 'activate'
        ? `/admin/users/${user.id}/activate/`
        : `/admin/users/${user.id}/deactivate/`;

      const response = await api.patch(endpoint);
      showSuccess(`User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`);
      // Update the user in the state with the response data
      fetchUsers(pagination.currentPage);
    } catch (err) {
      showError(err.response?.data?.error || `Failed to ${action} user`);
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container">
          <div className="page-header">
            <div className="page-header-content">
              <div className="header-text">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Manage user accounts and permissions</p>
              </div>
              <div className="search-container">
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);

                    // Clear the previous timeout
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }

                    // Set a new timeout to fetch users after 500ms of inactivity
                    searchTimeoutRef.current = setTimeout(() => {
                      setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
                      fetchUsers(1);
                    }, 500);
                  }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Full Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.full_name}</td>
                        <td>
                          <span className={`badge badge-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${user.status}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.updated_at)}</td>
                        <td>
                          <div className="action-buttons">
                            {user.status === 'inactive' ? (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => openModal(user, 'activate')}
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => openModal(user, 'deactivate')}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.count} users)
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Modal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        title={`${modalData.action === 'activate' ? 'Activate' : 'Deactivate'} User`}
        onConfirm={handleAction}
        confirmText={actionLoading ? 'Processing...' : (modalData.action === 'activate' ? 'Activate' : 'Deactivate')}
        confirmVariant={modalData.action === 'activate' ? 'success' : 'danger'}
      >
        <p>
          Are you sure you want to {modalData.action} the user{' '}
          <strong>{modalData.user?.email}</strong>?
        </p>
      </Modal>
    </>
  );
};

export default AdminDashboard;
