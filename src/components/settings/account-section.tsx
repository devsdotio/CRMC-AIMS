"use client";

import type { UserProfile } from "@/types/settings";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

export interface AccountSectionProps {
  profile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
}

export function AccountSection({ profile, onSaveProfile }: AccountSectionProps) {
  return (
    <div className="w-full space-y-6">
      <ProfileForm profile={profile} onSaveProfile={onSaveProfile} />
      <ChangePasswordForm />
    </div>
  );
}
