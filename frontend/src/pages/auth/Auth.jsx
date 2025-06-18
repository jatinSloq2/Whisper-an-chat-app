import React, { useState } from "react";
import Background from "../../assets/login2.png";
import victory from "../../assets/victory.svg";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { LOGIN_ROUTES, SIGNUP_ROUTES } from "@/utils/constant";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    const res = await apiClient.post(LOGIN_ROUTES, {
      email,
      password,
    });
    if (res.data.user.id) {
      setUserInfo(res.data.user);
      if (res.data.user.profileSetup) {
        toast.success("Login successful!");
        navigate("/chat");
      } else {
        toast.success("Login successful! Please complete your profile setup.");
        navigate("/profile");
      }
    }
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;
    const res = await apiClient.post(SIGNUP_ROUTES, {
      email,
      password,
    });
    if (res.status === 201) {
      setUserInfo(res.data.user);
      toast.success("Signup successful!");
      navigate("/profile");
    } else {
      toast.error("Signup failed. Please try again.");
    }
    console.log(res);
  };

  return (
    <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gray-100">
      <div className="h-[80vh] w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] bg-white shadow-2xl rounded-3xl grid xl:grid-cols-2 overflow-hidden">
        {/* Left: Form Side */}
        <div className="flex flex-col gap-6 items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold md:text-6xl">Welcome</h1>
            <img
              src={victory}
              alt="Victory"
              className="h-[80px] mx-auto mt-2"
            />
            <p className="font-medium text-gray-600 mt-2">
              Fill in the details to get started with the Chat App
            </p>
          </div>

          <Tabs className="w-full max-w-[90%]" defaultValue="login">
            <TabsList className="bg-transparent w-full grid grid-cols-2 mb-4">
              <TabsTrigger
                value="login"
                className="data-[state=active]:border-b-purple-500 data-[state=active]:font-semibold border-b-2 p-3"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:border-b-purple-500 data-[state=active]:font-semibold border-b-2 p-3"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="flex flex-col gap-4">
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="rounded-full px-6 py-4"
              />
              <Input
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="rounded-full px-6 py-4"
              />
              <Button className="rounded-full p-6" onClick={handleLogin}>
                Login
              </Button>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup" className="flex flex-col gap-4">
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="rounded-full px-6 py-4"
              />
              <Input
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <Button className="rounded-full p-6" onClick={handleSignup}>
                Sign Up
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Image */}
        <div className="hidden xl:flex justify-center items-center bg-gray-50">
          <img
            src={Background}
            alt="Auth Visual"
            className="h-[700px] object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
