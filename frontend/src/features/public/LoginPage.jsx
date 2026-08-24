import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { AuthLayout } from './AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { OtpInput } from '../../components/ui/OtpInput.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { ROLE_HOME_MAP, OTP_PURPOSES } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';

export function LoginPage() {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (!email.trim()) {
      setFieldErrors({ email: 'Email address is required' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.fullName || data.user.email}!`);

      const targetPath = location.state?.from?.pathname || ROLE_HOME_MAP[data.user.role] || '/app';
      navigate(targetPath, { replace: true });
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
      } else {
        toast.error(getErrorMessage(err, 'Invalid email or password'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setFieldErrors({});
    if (!email.trim()) {
      setFieldErrors({ email: 'Enter your email address to receive an OTP' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.requestOtp({ email: email.trim(), purpose: OTP_PURPOSES.LOGIN });
      setOtpRequested(true);
      setOtp('');
      setOtpError(false);
      toast.info('If that account exists, a 6-digit code has been sent to your email.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setFieldErrors({});
    setOtpError(false);

    if (otp.length < 6) {
      setOtpError(true);
      toast.error('Please enter the full 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.verifyOtp({
        email: email.trim(),
        otp,
        purpose: OTP_PURPOSES.LOGIN,
      });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.fullName || data.user.email}!`);

      const targetPath = location.state?.from?.pathname || ROLE_HOME_MAP[data.user.role] || '/app';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setOtpError(true);
      toast.error(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-ink-variant">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        {mode === 'password' ? (
          /* Password Form */
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="manager@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-container-lowest px-3 text-ink-variant/70 label-caps font-semibold">
                  OR
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              leftIcon={<KeyRound className="w-4 h-4" />}
              onClick={() => {
                setMode('otp');
                setFieldErrors({});
              }}
            >
              Login with OTP
            </Button>
          </form>
        ) : (
          /* OTP Form */
          <div className="space-y-5">
            {!otpRequested ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="manager@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  helperText="We'll send a 6-digit single-use login code."
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Verification Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="bg-container-low hairline rounded p-3 text-center">
                  <span className="text-xs text-ink-variant">
                    Enter the 6-digit code sent to{' '}
                    <strong className="text-ink font-semibold">{email}</strong>
                  </span>
                </div>

                <div className="py-2">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    hasError={otpError}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify & Sign In
                </Button>

                <div className="flex items-center justify-between text-xs text-ink-variant">
                  <button
                    type="button"
                    onClick={() => setOtpRequested(false)}
                    className="hover:text-ink underline cursor-pointer"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="hover:text-ink underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-container-lowest px-3 text-ink-variant/70 label-caps font-semibold">
                  OR
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              leftIcon={<Lock className="w-4 h-4" />}
              onClick={() => {
                setMode('password');
                setOtpRequested(false);
                setFieldErrors({});
              }}
            >
              Sign In with Password
            </Button>
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-4 text-center text-xs text-ink-variant">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary font-bold hover:underline transition-colors ml-1"
          >
            Register here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
