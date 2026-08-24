import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthLayout } from './AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      login(data.token, data.user);
      toast.success('Account created successfully! Welcome to DispatchPro.');
      // Direct user to verify their email
      navigate('/verify', { replace: true });
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
      } else {
        toast.error(getErrorMessage(err, 'Failed to create account. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-1">
            Create Account
          </h1>
          <p className="text-sm text-ink-variant">
            Sign up to start booking and tracking shipments across Delhi NCR.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            error={fieldErrors.fullName}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={fieldErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={fieldErrors.phone}
            leftIcon={<Phone className="w-4 h-4" />}
            numericOnly
            autoComplete="tel"
            helperText="10-digit mobile number"
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-ink-variant/60 hover:text-ink cursor-pointer p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            helperText="Must be at least 8 characters"
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 text-center text-xs text-ink-variant">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary font-bold hover:underline transition-colors ml-1"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
