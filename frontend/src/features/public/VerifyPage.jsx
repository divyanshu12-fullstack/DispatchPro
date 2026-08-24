import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthLayout } from './AuthLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { OtpInput } from '../../components/ui/OtpInput.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { OTP_PURPOSES, ROLE_HOME_MAP } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export function VerifyPage() {
  const { user, login, refreshUser } = useAuth();
  const [typedEmail, setTypedEmail] = useState('');
  const email = user?.email || typedEmail;
  const setEmail = setTypedEmail;

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.requestOtp({ email: email.trim(), purpose: OTP_PURPOSES.VERIFY_EMAIL });
      setOtpSent(true);
      setOtp('');
      setOtpError(false);
      toast.info('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setOtpError(false);

    if (otp.length < 6) {
      setOtpError(true);
      toast.error('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.verifyOtp({
        email: email.trim(),
        otp,
        purpose: OTP_PURPOSES.VERIFY_EMAIL,
      });

      login(data.token, data.user);
      await refreshUser();
      toast.success('Email verified successfully!');

      const homePath = ROLE_HOME_MAP[data.user.role] || '/app';
      navigate(homePath, { replace: true });
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
        <div className="text-center sm:text-left">
          <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-1">
            Verify Your Email
          </h1>
          <p className="text-sm text-ink-variant">
            Confirm your email address to enable priority delivery notifications.
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="manager@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              helperText="We will send a 6-digit verification code to this address."
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
            <div className="bg-container-low hairline rounded p-3.5 text-center">
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
              Verify Email
            </Button>

            <div className="flex items-center justify-between text-xs text-ink-variant pt-1">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="hover:text-ink underline cursor-pointer"
              >
                Change Email
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="hover:text-ink underline cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Skip action for logged in users */}
        {user && (
          <div className="pt-3 border-t border-hairline text-center">
            <Link
              to={ROLE_HOME_MAP[user.role] || '/app'}
              className="text-xs text-ink-variant hover:text-ink transition-colors"
            >
              Skip verification for now →
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
