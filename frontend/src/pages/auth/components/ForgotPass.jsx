import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

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
  const handleRequestOtp = async () => {
    try {
      const res = await apiClient.post("/api/forgetpassword/request-reset-otp", {
        identifier: forgotIdentifier,
      });
      toast.success(res.data.message || "OTP sent!", { duration: 10000 });
      setForgotOtp("")
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await apiClient.post("/api/forgetpassword/verify-reset-otp", {
        identifier: forgotIdentifier,
        otppass: forgotOtp,
      });
      if (res.status ===200) {
        setForgotStep(3);
        toast.success("OTP verified");
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err) {
      toast.error("OTP verification failed");
      console.log(err)
    }
  };

  const handleResetPassword = async () => {
    if (newForgotPassword !== confirmForgotPassword) {
      toast.error("Passwords must be same");
      return;
    }

    try {
      await apiClient.post("/api/forgetpassword/reset-password", {
        identifier: forgotIdentifier,
        password: newForgotPassword,
      });
      toast.success("Password reset successful! Please login.");
      setShowForgotPassword(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {forgotStep === 1 && (
        <>
          <Input
            placeholder="Enter Email or Phone"
            value={forgotIdentifier}
            onChange={(e) => setForgotIdentifier(e.target.value)}
            className="rounded-full px-6 py-4"
          />
          <Button className="rounded-full p-6" onClick={handleRequestOtp}>
            Request OTP
          </Button>
        </>
      )}

      {forgotStep === 2 && (
        <>
          <Input
            placeholder="Enter OTP"
            value={forgotOtp}
            onChange={(e) => setForgotOtp(e.target.value)}
            className="rounded-full px-6 py-4"
          />
          <Button className="rounded-full p-6" onClick={handleVerifyOtp}>
            Verify OTP
          </Button>
        </>
      )}

      {forgotStep === 3 && (
        <>
          <Input
            placeholder="New Password"
            value={newForgotPassword}
            onChange={(e) => setNewForgotPassword(e.target.value)}
            type="password"
            className="rounded-full px-6 py-4"
          />
          <Input
            placeholder="Confirm New Password"
            value={confirmForgotPassword}
            onChange={(e) => setConfirmForgotPassword(e.target.value)}
            type="password"
            className="rounded-full px-6 py-4"
          />
          <Button className="rounded-full p-6" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </>
      )}

      <button
        className="text-xs underline text-gray-500 hover:text-gray-700 mt-2"
        onClick={() => setShowForgotPassword(false)}
      >
        Back to login
      </button>
    </div>
  );
};

export default ForgotPasswordForm
