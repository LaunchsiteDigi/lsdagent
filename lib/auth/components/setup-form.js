"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { setupAdmin } from "../actions.js";
function SetupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await setupAdmin(email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.push("/login?created=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: "Create an account" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Enter your information below to create your account" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
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
            required: true,
            minLength: 8
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Must be at least 8 characters long." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "confirm-password", children: "Confirm Password" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "confirm-password",
            type: "password",
            value: confirmPassword,
            onChange: (e) => setConfirmPassword(e.target.value),
            required: true,
            minLength: 8
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Please confirm your password." })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: error }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Creating..." : "Create Account" })
    ] }) }) })
  ] });
}
export {
  SetupForm
};
