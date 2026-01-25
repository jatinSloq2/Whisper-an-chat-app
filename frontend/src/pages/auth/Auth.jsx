import React, { useState } from "react";
import LoginVisual from "../../assets/login2.png";
import SignupVisual from "@/assets/signup.png";
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
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo, fetchUserInfo } = useAppStore();

  const [showOtpForm, setShowOtpForm] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  
  // for login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // for signup
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [isLoadingVerify, setIsLoadingVerify] = useState(false);
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
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      toast.error("Email or phone is required");
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
    setIsLoadingLogin(true);
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
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;
    setIsLoadingSignup(true);

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
      setIsLoadingSignup(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoadingVerify(true);
    try {
      const res = await apiClient.post(OTP_VERIFY_ROUTES, {
        email: signupEmail,
        emailOTP: emailOtp,
      });

      if (res.status === 201) {
        await fetchUserInfo();
        toast.success("Signup completed!");
        navigate("/profile");
      } else {
        toast.error("OTP verification failed");
      }
    } catch (error) {
      console.error("OTP verify error:", error);
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setIsLoadingVerify(false);
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gray-100">
      <div className="h-[80vh] w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] bg-white shadow-2xl rounded-3xl grid xl:grid-cols-2 overflow-hidden">
        {/* Left: Form Side */}
        <div className="flex flex-col gap-6 items-center justify-center px-6">
          <div className="text-center space-y-2 md:space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold transition-all duration-300">
              {activeTab === "login" ? "Welcome" : "Join Us"}{" "}
              <span className="text-5xl">✌️</span>
            </h1>

            <p className="text-gray-600 text-sm md:text-base font-medium">
              {activeTab === "login"
                ? "Enter your details to login"
                : "Fill in the details to sign up"}
            </p>
          </div>

          <Tabs
            className="w-full max-w-[90%]"
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full grid grid-cols-2 gap-2 bg-transparent mb-4">
              <TabsTrigger
                value="login"
                className="p-3 text-center border-b-2 border-transparent rounded-full transition-colors duration-200 
               data-[state=active]:border-purple-500 data-[state=active]:font-semibold 
               hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="p-3 text-center border-b-2 border-transparent rounded-full transition-colors duration-200 
               data-[state=active]:border-purple-500 data-[state=active]:font-semibold 
               hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="flex flex-col gap-4">
              {!showForgotPassword ? (
                <>
                  <Input
                    placeholder="Enter your email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    type="text"
                    className="rounded-full px-6 py-4"
                    disabled={isLoadingLogin}
                  />
                  <Input
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    type="password"
                    className="rounded-full px-6 py-4"
                    disabled={isLoadingLogin}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoadingLogin) {
                        handleLogin();
                      }
                    }}
                  />
                  <Button 
                    className="rounded-full p-6" 
                    onClick={handleLogin}
                    disabled={isLoadingLogin}
                  >
                    {isLoadingLogin ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging you in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  <button
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotStep(1);
                    }}
                    disabled={isLoadingLogin}
                    className="text-xs font-medium text-purple-500 hover:text-purple-600 transition-colors duration-200 cursor-pointer disabled:opacity-50"
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
                    placeholder="Phone (10 digits)"
                    value={signupPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) setSignupPhone(value);
                    }}
                    type="tel"
                    className="rounded-full px-6 py-4"
                    disabled={isLoadingSignup}
                    maxLength={10}
                  />
                  <Input
                    placeholder="Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    className="rounded-full px-6 py-4"
                    disabled={isLoadingSignup}
                  />
                  <Input
                    placeholder="Password (min 6 characters)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    type="password"
                    className="rounded-full px-6 py-4"
                    disabled={isLoadingSignup}
                  />
                  <Input
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="rounded-full px-6 py-4"
                    disabled={isLoadingSignup}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoadingSignup) {
                        handleSignup();
                      }
                    }}
                  />
                  <Button
                    className="rounded-full p-6"
                    onClick={handleSignup}
                    disabled={isLoadingSignup}
                  >
                    {isLoadingSignup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Requesting OTP...
                      </>
                    ) : (
                      "Request OTP"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-center text-sm text-gray-600">
                    Enter the 6-digit OTP sent to{" "}
                    <span className="font-semibold text-purple-600">
                      {signupEmail}
                    </span>
                  </p>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={emailOtp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 6) setEmailOtp(value);
                    }}
                    className="rounded-full px-6 py-4 text-center text-lg tracking-widest"
                    disabled={isLoadingVerify}
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoadingVerify) {
                        handleVerifyOtp();
                      }
                    }}
                  />
                  <Button
                    className="rounded-full p-6"
                    onClick={handleVerifyOtp}
                    disabled={isLoadingVerify}
                  >
                    {isLoadingVerify ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Sign Up"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs bg-white hover:bg-white text-purple-500 hover:text-purple-600 cursor-pointer duration-300 transition-all"
                    onClick={() => {
                      setShowOtpForm(false);
                      setEmailOtp("");
                    }}
                    disabled={isLoadingVerify}
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