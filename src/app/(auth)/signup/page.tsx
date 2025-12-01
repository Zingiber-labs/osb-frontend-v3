"use client";

import Starfield from "@/components/commons/Starfield";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const MIN_PASSWORD = 6;

export default function Signup() {
  const router = useRouter();
  const { registerUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirmPassword");
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const email = watch("email");

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordValue?.length >= MIN_PASSWORD) score++;
    if (/[A-Z]/.test(passwordValue)) score++;
    if (/[a-z]/.test(passwordValue)) score++;
    if (/[0-9]/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;
    return score; // 0 - 5
  }, [passwordValue]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPasswordValue) return true;
    return passwordValue === confirmPasswordValue;
  }, [passwordValue, confirmPasswordValue]);

  const isFormValid = useMemo(() => {
    return (
      firstName?.trim().length >= 3 &&
      lastName?.trim().length >= 3 &&
      email?.trim().length > 0 &&
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email) &&
      passwordValue?.length >= MIN_PASSWORD &&
      confirmPasswordValue?.length > 0 &&
      passwordsMatch
    );
  }, [firstName, lastName, email, passwordValue, confirmPasswordValue, passwordsMatch]);

  const onSubmit = async (data: SignupFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await registerUser(
        data.firstName,
        data.lastName,
        data.email,
        data.password
      );
      router.push("/login");
    } catch (e: any) {
      setSubmitError(e?.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    console.log("Google signup clicked");
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Section - Branding/Promotional */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/img/menu.png')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-12">
          <div className="text-center items-center mb-8">
            <Image
              src="/img/logo_horizontal.svg"
              alt="Outer Sports Ballers"
              width={200}
              height={80}
              className="h-20 w-auto mb-6 cursor-pointer"
              onClick={() => router.push("/")}
            />
          </div>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-red-900 to-orange-800">
          <Starfield />
        </div>

        <Card className="w-full max-w-md bg-orange-900/80 backdrop-blur-sm border-orange-700/50 shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-cyan-300 text-center mb-8">
              Sign Up
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Firstname */}
              <div className="space-y-2">
                <Label
                  htmlFor="firstname"
                  className="font-helvetica text-orange-200"
                >
                  Firstname
                </Label>
                <Input
                  id="firstname"
                  placeholder="Your firstname"
                  className="font-helvetica bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400"
                  {...register("firstName", {
                    required: "Firstname is required",
                    minLength: { value: 3, message: "At least 3 characters" },
                  })}
                />
                {errors.firstName && (
                  <p className="text-red-400 font-helvetica text-sm">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Lastname */}
              <div className="space-y-2">
                <Label
                  htmlFor="lastname"
                  className="font-helvetica text-orange-200"
                >
                  Lastname
                </Label>
                <Input
                  id="lastname"
                  placeholder="Your lastname"
                  className="font-helvetica bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400"
                  {...register("lastName", {
                    required: "Lastname is required",
                    minLength: { value: 3, message: "At least 3 characters" },
                  })}
                />
                {errors.lastName && (
                  <p className="text-red-400 font-helvetica text-sm">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-helvetica text-orange-200"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  className="font-helvetica bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-400 font-helvetica text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-helvetica text-orange-200"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className="font-helvetica bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400 pl-10 pr-10"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: MIN_PASSWORD,
                        message: `Password must be at least ${MIN_PASSWORD} characters`,
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-300 hover:text-orange-100"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password strength (simple) */}
                <div className="mt-1 h-1.5 w-full bg-orange-800/60 rounded">
                  <div
                    className="h-1.5 rounded transition-all"
                    style={{
                      width: `${(passwordScore / 5) * 100}%`,
                      background:
                        passwordScore <= 2
                          ? "#f87171"
                          : passwordScore === 3
                          ? "#fbbf24"
                          : "#34d399",
                    }}
                  />
                </div>
                <p className="text-xs text-orange-200/80 font-helvetica">
                  Use upper/lowercase, numbers, and a symbol for a stronger
                  password.
                </p>

                {errors.password && (
                  <p className="text-red-400 font-helvetica text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="font-helvetica text-orange-200"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="font-helvetica bg-orange-800/50 border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400 pl-10 pr-10"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === passwordValue || "Passwords do not match",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-300 hover:text-orange-100"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {!passwordsMatch && confirmPasswordValue && (
                  <p className="text-red-400 font-helvetica text-sm">
                    Passwords do not match
                  </p>
                )}

                {errors.confirmPassword && (
                  <p className="text-red-400 font-helvetica text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <p className="font-helvetica text-card-bg text-sm font-extralight">
                By signing up you agree to our{" "}
                <Link
                  className="font-helvetica underline hover:text-secondary"
                  href={"#"}
                >
                  Terms & Condition
                </Link>{" "}
                and{" "}
                <Link
                  className="font-helvetica underline hover:text-secondary"
                  href={"#"}
                >
                  Privacy Policy.
                </Link>
                <span className="text-secondary">*</span>
              </p>

              {submitError && (
                <p className="text-red-400 text-sm -mt-2">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </form>

            {/* Separator */}
            <div className="my-6">
              <Separator className="bg-orange-600" />
              <div className="text-center -mt-3">
                <span className="font-helvetica bg-orange-900/80 px-4 text-orange-300 text-sm">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Signup */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignup}
                className="w-12 h-12 rounded-full bg-[#FF6B2F3D] hover:bg-red-700 border-red-600 hover:border-red-700"
                aria-label="Sign up with Google"
              >
                <Image
                  src="/img/google.svg"
                  alt="google-icon"
                  width={100}
                  height={100}
                />
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <span className="text-orange-300 text-sm font-helvetica">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-green-400 font-helvetica hover:text-green-300 font-medium text-sm"
              >
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
