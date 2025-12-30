import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const validateProfile = () => {
    const errors = {};
    if (!profileData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!profileData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Invalid email format';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one digit';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one special character';
    }
    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setProfileLoading(true);
    try {
      const response = await api.put('/users/me/', {
        full_name: profileData.fullName,
      });
      updateUser(response.data);
      showSuccess('Profile updated successfully');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
        const profileErrorsObj = {};
        Object.keys(errorData).forEach(key => {
          if (key === 'full_name') profileErrorsObj.fullName = errorData[key][0];
          else if (key === 'email') profileErrorsObj.email = errorData[key][0];
        });
        setProfileErrors(profileErrorsObj);
      } else {
        showError(errorData?.error || 'Failed to update profile');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      await api.put('/users/me/password/', {
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      showSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
        const passwordErrorsObj = {};
        Object.keys(errorData).forEach(key => {
          if (key === 'old_password') passwordErrorsObj.currentPassword = errorData[key][0];
          else if (key === 'new_password') passwordErrorsObj.newPassword = errorData[key][0];
          else if (key === 'confirm_new_password') passwordErrorsObj.confirmNewPassword = errorData[key][0];
        });
        setPasswordErrors(passwordErrorsObj);
      } else {
        showError(errorData?.error || 'Failed to change password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const resetProfile = () => {
    setProfileData({
      fullName: user?.full_name || '',
      email: user?.email || '',
    });
    setProfileErrors({});
  };

  const resetPassword = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setPasswordErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container profile-container">
          <div className="page-header">
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your account information</p>
          </div>

          <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div className="profile-section">
              <h2 className="profile-section-title">Account Information</h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-sm)' }}>
                <strong>Role:</strong> <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-sm)' }}>
                <strong>Status:</strong> <span className={`badge badge-${user?.status}`}>{user?.status}</span>
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', marginBottom: 'var(--spacing-sm)' }}>
                <strong>Member since:</strong> {formatDate(user?.created_at)}
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                <strong>Last updated:</strong> {formatDate(user?.updated_at)}
              </p>
            </div>
          </div>

          <div className="profile-forms-grid">
            <div className="card">
              <div className="profile-section">
                <h2 className="profile-section-title">Edit Profile</h2>
                <form onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      className={`form-input ${profileErrors.fullName ? 'error' : ''}`}
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      disabled={profileLoading}
                    />
                    {profileErrors.fullName && <p className="form-error">{profileErrors.fullName}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`form-input ${profileErrors.email ? 'error' : ''}`}
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={profileLoading}
                    />
                    {profileErrors.email && <p className="form-error">{profileErrors.email}</p>}
                  </div>

                  <div className="action-buttons">
                    <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetProfile} disabled={profileLoading}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card">
              <div className="profile-section">
                <h2 className="profile-section-title">Change Password</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={passwordLoading}
                    />
                    {passwordErrors.currentPassword && <p className="form-error">{passwordErrors.currentPassword}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={passwordLoading}
                    />
                    {passwordErrors.newPassword && <p className="form-error">{passwordErrors.newPassword}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmNewPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      className={`form-input ${passwordErrors.confirmNewPassword ? 'error' : ''}`}
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      disabled={passwordLoading}
                    />
                    {passwordErrors.confirmNewPassword && <p className="form-error">{passwordErrors.confirmNewPassword}</p>}
                  </div>

                  <div className="action-buttons">
                    <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetPassword} disabled={passwordLoading}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default UserProfile;
