"use client";

import type { UserProfile } from "./types";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

export interface AccountSectionProps {
  profile: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
}

export function AccountSection({ profile, onSaveProfile }: AccountSectionProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <ProfileForm profile={profile} onSaveProfile={onSaveProfile} />
      <ChangePasswordForm />
    </div>
  );
}
