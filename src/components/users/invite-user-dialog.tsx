"use client";

import { useState, useEffect } from "react";
import { X, UserPlus,  Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/users";
import { ROLE_DEFINITIONS } from "@/constants/roles";

export interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (name: string, email: string, role: UserRole, department: string) => void;
}

export function InviteUserDialog({
  isOpen,
  onClose,
  onSendInvite,
}: InviteUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [department, setDepartment] = useState("Property Custodian Office");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setEmail("");
      setRole("staff");
      setDepartment("Property Custodian Office");
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the staff member's full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid hospital email address.");
      return;
    }

    onSendInvite(name.trim(), email.trim(), role, department.trim());
    setSuccessMessage(`Invitation sent to ${email.trim()}`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-dialog-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 id="invite-dialog-title" className="text-base font-bold text-text leading-tight">
                Invite Staff Member
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Send an account activation invitation to staff email
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="invite-name-input" className="block text-xs font-semibold text-text">
                Full Name <span className="text-accent">*</span>
              </label>
              <input
                id="invite-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Maria Santos"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="invite-email-input" className="block text-xs font-semibold text-text">
                Hospital Email <span className="text-accent">*</span>
              </label>
              <input
                id="invite-email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. m.santos@crmc.gov.ph"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label htmlFor="invite-dept-input" className="block text-xs font-semibold text-text">
              Department
            </label>
            <input
              id="invite-dept-input"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Property Custodian Office, IT, Finance"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Predefined Role Selector with Inline Descriptions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
              Select Predefined System Role <span className="text-accent">*</span>
            </label>

            <div className="space-y-2" role="radiogroup" aria-label="System role selection">
              {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map((rKey) => {
                const rDef = ROLE_DEFINITIONS[rKey];
                const isSelected = role === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRole(rKey)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer outline-none w-full",
                      "focus-visible:ring-2 focus-visible:ring-accent",
                      isSelected
                        ? "bg-bg-subtle border-primary ring-1 ring-primary shadow-2xs"
                        : "bg-bg border-border hover:bg-bg-subtle/60"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border shrink-0",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      )}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text">{rDef.title} Role</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                        {rDef.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs font-bold text-status-outofservice-text">{error}</p>}
          {successMessage && (
            <div className="p-2.5 rounded bg-status-active-bg/20 border border-status-active-bg/30 text-status-active-text font-bold text-xs flex items-center gap-1.5">
              <Send className="h-4 w-4 shrink-0 animate-bounce" />
              {successMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
