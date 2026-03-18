"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });
      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
    justCreated && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-green-500/30 bg-green-500/5 p-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-green-600 dark:text-green-400", children: "Account created. Sign in with your new credentials." }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: "Login to your account" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Enter your email below to login to your account" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                placeholder: "m@example.com",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "password",
                type: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                required: true
              }
            )
          ] }),
          error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: error }),
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Signing in..." : "Login" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 text-center text-sm text-muted-foreground", children: [
          "Don't have an account?",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/login", className: "underline underline-offset-4 hover:text-foreground", children: "Sign up" })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  LoginForm
};
