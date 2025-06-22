import React, { useState } from "react";
import LoginVisual from "../../assets/login2.png";
import SignupVisual from "@/assets/signup.png";
import victory from "../../assets/victory.svg";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  LOGIN_ROUTES,
  OTP_VERIFY_ROUTES,
  SIGNUP_REQUEST,
} from "@/utils/constant";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import ForgotPasswordForm from "./components/ForgotPass";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo, fetchUserInfo  } = useAppStore();

  const [showOtpForm, setShowOtpForm] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  // for login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // for signup
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newForgotPassword, setNewForgotPassword] = useState("");
  const [confirmForgotPassword, setConfirmForgotPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1);

  const validateSignup = () => {
    if (signupPhone.length !== 10 || !/^\d{10}$/.test(signupPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    if (!signupEmail.length) {
      toast.error("Email is required");
      return false;
    }
    if (!signupPassword.length) {
      toast.error("Password is required");
      return false;
    }
    if (signupPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateLogin = () => {
    if (!identifier.length) {
      toast.error("Email is required");
      return false;
    }
    if (!loginPassword.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    try {
      const res = await apiClient.post(LOGIN_ROUTES, {
        identifier: identifier,
        password: loginPassword,
      });

      if (res.data.user?.id) {
        setUserInfo(res.data.user);

        if (res.data.user.profileSetup) {
          toast.success("Login successful!");
          navigate("/chat");
        } else {
          toast.success(
            "Login successful! Please complete your profile setup."
          );
          navigate("/profile");
        }
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    }
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;
    setIsLoadingOtp(true);

    try {
      const res = await apiClient.post(SIGNUP_REQUEST, {
        email: signupEmail,
        phoneNo: signupPhone,
        password: signupPassword,
      });

      if (res.data.message) {
        toast.success(res.data.message, { duration: 10000 });
        setShowOtpForm(true);
      }
    } catch (error) {
      console.error("Signup request error:", error);
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!emailOtp || !phoneOtp) {
      toast.error("Please enter both OTPs");
      return;
    }

    try {
      const res = await apiClient.post(OTP_VERIFY_ROUTES, {
        email: signupEmail,
        emailOTP: emailOtp,
        phoneOTP: phoneOtp,
      });

      if (res.status === 201) {
        await fetchUserInfo()
        toast.success("Signup completed!");
        navigate("/profile");
      } else {
        toast.error("OTP verification failed");
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      toast.error(error.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gray-100">
      <div className="h-[80vh] w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] bg-white shadow-2xl rounded-3xl grid xl:grid-cols-2 overflow-hidden">
        {/* Left: Form Side */}
        <div className="flex flex-col gap-6 items-center justify-center px-6">
          <div className="text-center">
            {activeTab === "login" ? (
              <h1 className="text-4xl font-bold md:text-6xl">Welcome</h1>
            ) : (
              <h1 className="text-4xl font-bold md:text-6xl">Join Us</h1>
            )}
            <img
              src={victory}
              alt="Victory"
              className="h-[80px] mx-auto mt-2"
            />
            {activeTab === "login" ? (
              <p className="font-medium text-gray-600 mt-2">
                Enter your details to login
              </p>
            ) : (
              <p className="font-medium text-gray-600 mt-2">
                Fill in the details to Sign up
              </p>
            )}
          </div>

          <Tabs
            className="w-full max-w-[90%]"
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-transparent w-full grid grid-cols-2 mb-4">
              <TabsTrigger
                value="login"
                className="data-[state=active]:border-purple-500 data-[state=active]:font-semibold border-b-2 p-3 rounded-full"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:border-purple-500 data-[state=active]:font-semibold border-b-2 p-3 rounded-full"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="flex flex-col gap-4">
              {!showForgotPassword ? (
                <>
                  <Input
                    placeholder="Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    type="email"
                    className="rounded-full px-6 py-4"
                  />
                  <Input
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    type="password"
                    className="rounded-full px-6 py-4"
                  />
                  <Button className="rounded-full p-6" onClick={handleLogin}>
                    Login
                  </Button>
                  <button
                    className="text-sm text-blue-500 underline mt-2 hover:text-blue-700"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotStep(1);
                    }}
                  >
                    Forgot Password?
                  </button>
                </>
              ) : (
                <ForgotPasswordForm
                  forgotStep={forgotStep}
                  setForgotStep={setForgotStep}
                  forgotIdentifier={forgotIdentifier}
                  setForgotIdentifier={setForgotIdentifier}
                  forgotOtp={forgotOtp}
                  setForgotOtp={setForgotOtp}
                  newForgotPassword={newForgotPassword}
                  setNewForgotPassword={setNewForgotPassword}
                  confirmForgotPassword={confirmForgotPassword}
                  setConfirmForgotPassword={setConfirmForgotPassword}
                  setShowForgotPassword={setShowForgotPassword}
                />
              )}
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup" className="flex flex-col gap-4">
              {!showOtpForm ? (
                <>
                  <Input
                    placeholder="Phone"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    type="tel"
                    className="rounded-full px-6 py-4"
                  />
                  <Input
                    placeholder="Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    className="rounded-full px-6 py-4"
                  />
                  <Input
                    placeholder="Password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    type="password"
                    className="rounded-full px-6 py-4"
                  />
                  <Input
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="rounded-full px-6 py-4"
                  />
                  <Button
                    className="rounded-full p-6"
                    onClick={handleSignup}
                    disabled={isLoadingOtp}
                  >
                    {isLoadingOtp ? "Requesting OTP..." : "Request OTP"}
                  </Button>
                  {isLoadingOtp && (
                    <div className="flex justify-center">
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Sending OTPs... please wait
                      </p>
                      <div className="w-6 h-6 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mt-2" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-center text-sm text-gray-600">
                    Enter the OTPs sent to your email and phone.
                  </p>
                  <Input
                    placeholder="Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="rounded-full px-6 py-4"
                  />
                  <Input
                    placeholder="Phone OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    className="rounded-full px-6 py-4"
                  />
                  <Button
                    className="rounded-full p-6"
                    onClick={handleVerifyOtp}
                  >
                    Verify & Sign Up
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs underline text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setShowOtpForm(false);
                      setIsLoadingOtp(false);
                    }}
                  >
                    Back to edit info
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Image */}
        <div className="hidden xl:flex justify-center items-center bg-gray-50">
          <img
            src={activeTab === "login" ? LoginVisual : SignupVisual}
            alt={activeTab === "login" ? "Login Visual" : "Signup Visual"}
            className="h-[700px] object-contain transition-all duration-500 ease-in-out"
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
