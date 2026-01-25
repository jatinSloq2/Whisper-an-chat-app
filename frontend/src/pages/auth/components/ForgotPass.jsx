import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ForgotPasswordForm = ({
  forgotStep,
  setForgotStep,
  forgotIdentifier,
  setForgotIdentifier,
  forgotOtp,
  setForgotOtp,
  newForgotPassword,
  setNewForgotPassword,
  confirmForgotPassword,
  setConfirmForgotPassword,
  setShowForgotPassword,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!forgotIdentifier.trim()) {
      toast.error("Please enter email or phone number");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post("/api/forgetpassword/request-reset-otp", {
        identifier: forgotIdentifier,
      });
      toast.success(res.data.message || "OTP sent!", { duration: 10000 });
      setForgotOtp("");
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim()) {
      toast.error("Please enter OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post("/api/forgetpassword/verify-reset-otp", {
        identifier: forgotIdentifier,
        otppass: forgotOtp,
      });
      if (res.status === 200) {
        setForgotStep(3);
        setForgotOtp("");
        toast.success("OTP verified");
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newForgotPassword.trim() || !confirmForgotPassword.trim()) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newForgotPassword !== confirmForgotPassword) {
      toast.error("Passwords must be same");
      return;
    }

    if (newForgotPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/api/forgetpassword/reset-password", {
        identifier: forgotIdentifier,
        password: newForgotPassword,
      });
      setNewForgotPassword("");
      setConfirmForgotPassword("");
      toast.success("Password reset successful! Please login.");
      setShowForgotPassword(false);
      setForgotStep(1); // Reset to step 1
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Step 1: Request OTP */}
      {forgotStep === 1 && (
        <>
          <Input
            placeholder="Enter Email or Phone"
            value={forgotIdentifier}
            onChange={(e) => setForgotIdentifier(e.target.value)}
            className="rounded-full px-6 py-4"
            disabled={isLoading}
          />
          <Button
            className="rounded-full p-6"
            onClick={handleRequestOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Request OTP"
            )}
          </Button>
        </>
      )}

      {/* Step 2: Verify OTP */}
      {forgotStep === 2 && (
        <>
          <p className="text-center text-sm text-gray-600">
            Enter the OTP sent to your email
          </p>
          <Input
            placeholder="Enter OTP"
            value={forgotOtp}
            onChange={(e) => setForgotOtp(e.target.value)}
            className="rounded-full px-6 py-4"
            disabled={isLoading}
            maxLength={6}
          />
          <Button
            className="rounded-full p-6"
            onClick={handleVerifyOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>
          {isLoading && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Verifying OTP...</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="text-xs text-purple-500 hover:text-purple-600"
            onClick={() => setForgotStep(1)}
            disabled={isLoading}
          >
            Resend OTP
          </Button>
        </>
      )}

      {/* Step 3: Reset Password */}
      {forgotStep === 3 && (
        <>
          <p className="text-center text-sm text-green-600 font-medium">
            ✓ OTP Verified! Set your new password
          </p>
          <Input
            placeholder="New Password"
            value={newForgotPassword}
            onChange={(e) => setNewForgotPassword(e.target.value)}
            type="password"
            className="rounded-full px-6 py-4"
            disabled={isLoading}
          />
          <Input
            placeholder="Confirm New Password"
            value={confirmForgotPassword}
            onChange={(e) => setConfirmForgotPassword(e.target.value)}
            type="password"
            className="rounded-full px-6 py-4"
            disabled={isLoading}
          />
          <Button
            className="rounded-full p-6"
            onClick={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
          {isLoading && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">
                Resetting your password...
              </p>
            </div>
          )}
        </>
      )}

      {/* Back to Login Button */}
      <button
        className="text-xs underline text-gray-500 hover:text-gray-700 mt-2 transition-colors disabled:opacity-50"
        onClick={() => {
          setShowForgotPassword(false);
          setForgotStep(1); // Reset step when going back
        }}
        disabled={isLoading}
      >
        Back to login
      </button>
    </div>
  );
};

export default ForgotPasswordForm;