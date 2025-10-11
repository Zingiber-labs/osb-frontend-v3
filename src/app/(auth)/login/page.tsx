"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const router = useRouter();
  const { login, loginAsGuest } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      router.push("/");
    } catch (e: any) {
      setSubmitError(e?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await loginAsGuest();
      router.push("/");
    } catch (error) {
      console.error("Error creating guest session:", error);
      // Handle error - you might want to show a toast notification here
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Section - Branding/Promotional */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/img/menu.png')" }}
        />

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-12">
          {/* Logo */}
          <div className="text-center items-center mb-8">
            <Image
              src="/img/logo_horizontal.svg"
              alt="Outer Sports Ballers"
              width={200}
              height={80}
              className="h-20 w-auto mb-6"
            />
          </div>

          {/* Tagline */}
          {/* <h1 className="text-4xl md:text-5xl font-bold text-white text-center leading-tight">
            ONE MISSION, ONE MATCH, ONE DESTINY!
          </h1> */}
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background with nebula effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-red-900 to-orange-800">
          {/* Star effect */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(500)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Login Form Container */}
        <Card className="w-full max-w-md bg-orange-900/80 backdrop-blur-sm border-orange-700/50 shadow-2xl">
          <CardContent className="p-8">
            {/* Title */}
            <h2 className="text-3xl font-bold text-cyan-300 text-center mb-8">
              LOGIN
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-orange-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  className="bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-orange-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className="bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400 pl-10 pr-10"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-300 hover:text-orange-100"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    className="border-orange-600 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-orange-200 text-sm"
                  >
                    Remember Me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {submitError && (
                <p className="text-red-400 text-sm -mt-2">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 text-lg rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "SIGNING IN..." : "CONTINUE"}
              </Button>
            </form>

            {/* Login as Guest Button */}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGuestLogin}
                disabled={isGuestLoading}
                className="w-full border-orange-600 text-orange-300 hover:bg-orange-800/50 hover:text-orange-200 font-bold py-3 text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGuestLoading
                  ? "CREATING GUEST SESSION..."
                  : "LOGIN AS GUEST"}
              </Button>
            </div>

            {/* Separator */}
            <div className="my-6">
              <Separator className="bg-orange-600" />
              <div className="text-center -mt-3">
                <span className="bg-orange-900/80 px-4 text-orange-300 text-sm">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="w-12 h-12 rounded-full bg-[#FF6B2F3D] hover:bg-red-700 border-red-600 hover:border-red-700"
              >
                <Image
                  src="/img/google.svg"
                  alt="google-icon"
                  width={100}
                  height={100}
                />
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <span className="text-orange-300 text-sm">
                Don&apos;t have an account?{" "}
              </span>
              <button
                type="button"
                className="text-green-400 hover:text-green-300 font-medium text-sm"
              >
                Sign Up
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
