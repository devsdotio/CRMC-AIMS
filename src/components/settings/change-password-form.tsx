"use client";

import { useState } from "react";
import { KeyRound, Check, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live password checklist validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const isValid =
    Boolean(currentPassword) &&
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    isMatching;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-bg space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-base font-bold text-text flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-text-secondary" />
          Change Account Password
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Update your system login password for account security
        </p>
      </div>

      <div className="space-y-4">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="block text-xs font-bold text-text">
            Current Password <span className="text-accent">*</span>
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-xs font-bold text-text">
            New Password <span className="text-accent">*</span>
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-xs font-bold text-text">
            Confirm New Password <span className="text-accent">*</span>
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Live Password Requirements Checklist */}
        <div className="p-3.5 rounded-xl border border-border bg-bg-subtle space-y-1 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block mb-1">
            Password Security Checklist:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div className={cn("flex items-center gap-1.5 text-[11px]", hasMinLength ? "text-status-active-text font-bold" : "text-text-secondary")}>
              {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
              <span>At least 8 characters</span>
            </div>
            <div className={cn("flex items-center gap-1.5 text-[11px]", hasUppercase ? "text-status-active-text font-bold" : "text-text-secondary")}>
              {hasUppercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
              <span>One uppercase letter (A-Z)</span>
            </div>
            <div className={cn("flex items-center gap-1.5 text-[11px]", hasNumber ? "text-status-active-text font-bold" : "text-text-secondary")}>
              {hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
              <span>One number (0-9)</span>
            </div>
            <div className={cn("flex items-center gap-1.5 text-[11px]", isMatching ? "text-status-active-text font-bold" : "text-text-secondary")}>
              {isMatching ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-40" />}
              <span>Passwords match</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {savedSuccess ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-status-active-text bg-status-active-bg/15 px-3 py-1.5 rounded-md">
            <Check className="h-4 w-4" />
            Password updated successfully
          </span>
        ) : (
          <span className="text-xs text-text-secondary">Fill all requirements above</span>
        )}

        <button
          type="submit"
          disabled={!isValid}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 shadow-xs",
            isValid
              ? "bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
              : "bg-bg-subtle text-text-secondary/40 border border-border/40 cursor-not-allowed opacity-60"
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          Update Password
        </button>
      </div>
    </form>
  );
}
