"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Starfield from "@/components/commons/Starfield";
import {
  useGuestLogin,
  useLogin,
  startGoogleLogin,
} from "@/lib/auth/client";
import { LoginInputSchema, type LoginInput } from "@/lib/auth/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const login = useLogin();
  const guestLogin = useGuestLogin();
  const isAnyLoading = login.isPending || guestLogin.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    if (isAnyLoading) return;
    try {
      await login.mutateAsync(data);
      router.replace("/");
      router.refresh();
    } catch {
      // error surfaced via login.error
    }
  };

  const onGuest = async () => {
    if (isAnyLoading) return;
    try {
      await guestLogin.mutateAsync();
      router.replace("/");
      router.refresh();
    } catch {
      // error surfaced via guestLogin.error
    }
  };

  const submitError =
    (login.error instanceof Error && login.error.message) ||
    (guestLogin.error instanceof Error && guestLogin.error.message) ||
    null;

  return (
    <div className="h-screen flex overflow-hidden">
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-red-900 to-orange-800">
          <Starfield />
        </div>

        <Card className="w-full max-w-md bg-orange-900/80 backdrop-blur-sm border-orange-700/50 shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-cyan-300 text-center mb-8">
              LOGIN
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-helvetica text-orange-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  className="bg-orange-800/50 font-helvetica border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400"
                  disabled={isAnyLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 font-helvetica text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-orange-200 font-helvetica">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className="bg-orange-800/50 font-helvetica border-orange-600 text-orange-100 placeholder:text-orange-300 focus:border-cyan-400 focus:ring-cyan-400 pl-10 pr-10"
                    disabled={isAnyLoading}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isAnyLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-300 hover:text-orange-100 disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm font-helvetica">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-red-400 text-sm font-helvetica">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isAnyLoading}
                className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 text-lg rounded-lg transition-colors disabled:opacity-50"
              >
                {login.isPending ? "SIGNING IN..." : "CONTINUE"}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onGuest}
                disabled={isAnyLoading}
                className="w-full border-orange-600 text-orange-300 hover:bg-orange-800/50 hover:text-orange-200 font-bold py-3 text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guestLogin.isPending
                  ? "CREATING GUEST SESSION..."
                  : "LOGIN AS GUEST"}
              </Button>
            </div>

            <div className="my-6">
              <Separator className="bg-orange-600" />
              <div className="text-center -mt-3">
                <span className="bg-orange-900/80 font-helvetica px-4 text-orange-300 text-sm">
                  or continue with
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={startGoogleLogin}
                disabled={isAnyLoading}
                className="w-12 h-12 rounded-full bg-[#FF6B2F3D] hover:bg-red-700 border-red-600 hover:border-red-700 disabled:opacity-50"
                aria-label="Continue with Google"
              >
                <Image
                  src="/img/google.svg"
                  alt="google-icon"
                  width={100}
                  height={100}
                />
              </Button>
            </div>

            <div className="text-center mt-6">
              <span className="text-orange-300 text-sm font-helvetica">
                Don&apos;t have an account?{" "}
              </span>
              <Link
                href="/signup"
                className="text-green-400 font-helvetica hover:text-green-300 font-medium text-sm"
              >
                Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
