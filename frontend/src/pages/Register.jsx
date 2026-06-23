import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'officer',
    branch: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await authAPI.branches();
        setBranches(response.data);
        console.log('Branches loaded:', response.data);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        toast.error('Could not load branches. Please try again.');
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]+/)) score++;
    if (password.match(/[A-Z]+/)) score++;
    if (password.match(/[0-9]+/)) score++;
    if (password.match(/[$@#&!]+/)) score++;
    setPasswordStrength(score);
  };

  const getPasswordStrengthText = () => {
    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return levels[passwordStrength] || 'Very Weak';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['red-500', 'orange-500', 'yellow-500', 'blue-500', 'green-500'];
    return colors[passwordStrength] || 'red-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!agreeTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    if (formData.password !== formData.password2) {
      setErrors({ password2: 'Passwords do not match' });
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength < 3) {
      toast.error('Please use a stronger password');
      return;
    }

    if (formData.role !== 'admin' && !formData.branch) {
      toast.error('Please select a branch');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending registration data:', formData);
      
      const response = await authAPI.register(formData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        toast.success('Registration successful!');
        
        const tokens = response.data.tokens;
        if (tokens && tokens.access) {
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
          
          toast.success('Welcome to MicroFinance System!');
          navigate('/');
        } else {
          console.log('No tokens in response, trying login...');
          const loginResult = await login({
            username: formData.username,
            password: formData.password
          });
          
          if (loginResult.success) {
            toast.success('Welcome to MicroFinance System!');
            navigate('/');
          } else {
            toast.error('Auto-login failed. Please login manually.');
            navigate('/login');
          }
        }
      } else {
        if (response.data.errors) {
          setErrors(response.data.errors);
          const errorMessages = Object.values(response.data.errors).flat();
          errorMessages.forEach(msg => {
            if (typeof msg === 'string') {
              toast.error(msg);
            }
          });
        } else {
          toast.error(response.data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        const data = error.response.data;
        console.log('Error data:', data);
        
        if (data.errors) {
          setErrors(data.errors);
          const errorMessages = Object.values(data.errors).flat();
          errorMessages.forEach(msg => {
            if (typeof msg === 'string') {
              toast.error(msg);
            }
          });
        } else if (data.message) {
          toast.error(data.message);
        } else if (data.detail) {
          toast.error(data.detail);
        } else {
          toast.error('Registration failed. Please check your information.');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <span className="text-white text-3xl font-bold">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">MicroFinance System</h2>
          <p className="mt-2 text-gray-600">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Create Account</h3>
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Already have an account? Sign in
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="First name"
                />
                {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Last name"
                />
                {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Choose a username"
                />
                {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="officer">Loan Officer</option>
                  <option value="manager">Branch Manager</option>
                  <option value="teller">Teller</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch {formData.role !== 'admin' && '*'}
              </label>
              <select
                name="branch"
                required={formData.role !== 'admin'}
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.region}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs text-${getPasswordStrengthColor()} font-medium`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use 8+ chars with uppercase, lowercase, number & special
                    </p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password2"
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.password2 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password2 && <p className="mt-1 text-sm text-red-500">{errors.password2}</p>}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the Terms and Conditions and Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">2026 MicroFinance System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;