import type { Session, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/server/shared/errors";
import { ProfileRepository } from "@/server/modules/users/user.repository";
import type { IProfileRepository } from "@/server/modules/users/user.types";
import type { ProfileWithDepartment } from "@/server/modules/users/user.types";

import type {
  AuthProfileDTO,
  AuthSessionDTO,
  OAuth2TokenResponse,
  SignInInput,
  SignInResultDTO,
} from "./auth.types";
import { signInSchema, tokenPasswordSchema } from "./auth.validation";

function toAuthProfile(row: ProfileWithDepartment): AuthProfileDTO {
  return {
    id: row.userId,
    email: row.email,
    name: row.fullName,
    role: row.role,
    status: row.status,
    department: row.linkedDepartmentName ?? row.department,
    departmentId: row.departmentId ?? null,
  };
}

function toAuthSession(session: Session): AuthSessionDTO {
  const expiresAt = session.expires_at ?? null;
  const expiresIn =
    expiresAt != null
      ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
      : (session.expires_in ?? null);

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt,
    expiresIn,
    tokenType: "bearer",
  };
}

/**
 * Authentication & session lifecycle against Supabase Auth + app profiles.
 *
 * Identity and role always come from verified session + `profiles` row —
 * never from client-supplied claims.
 */
export class AuthService {
  constructor(
    private readonly profileRepository: IProfileRepository = new ProfileRepository()
  ) {}

  /**
   * Email/password sign-in. Sets Supabase auth cookies on the response via
   * `createClient()` cookie bridge, and returns tokens for Bearer clients
   * (Swagger Authorize, scripts, mobile).
   */
  async signIn(raw: unknown): Promise<SignInResultDTO> {
    const input = signInSchema.parse(raw);
    return this.authenticate(input);
  }

  /**
   * OAuth2 resource-owner password grant for Swagger UI.
   * Same gates as JSON sign-in; response follows RFC 6749 token shape.
   */
  async issuePasswordToken(raw: unknown): Promise<OAuth2TokenResponse> {
    const input = tokenPasswordSchema.parse(raw);
    const result = await this.authenticate({
      email: input.username,
      password: input.password,
    });

    const response: OAuth2TokenResponse = {
      access_token: result.session.accessToken,
      token_type: "bearer",
    };

    if (result.session.expiresIn != null) {
      response.expires_in = result.session.expiresIn;
    }
    if (result.session.refreshToken) {
      response.refresh_token = result.session.refreshToken;
    }

    return response;
  }

  async signOut(): Promise<void> {
    const supabase = await createClient();
    // Local scope is enough — we only need to clear this browser/API session.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      // Idempotent: already signed out is not a failure for the client.
      console.warn("[auth] signOut:", error.message);
    }
  }

  /**
   * Shared credential + profile gate used by sign-in and OAuth2 token flows.
   */
  private async authenticate(input: SignInInput): Promise<SignInResultDTO> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedError(
        "Invalid email or password. Please verify your credentials and try again."
      );
    }

    try {
      const profile = await this.assertActiveProfile(data.user);
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? profile.email,
        },
        profile: toAuthProfile(profile),
        session: toAuthSession(data.session),
      };
    } catch (gateError) {
      // Drop partial cookies so a deactivated/missing profile cannot stick.
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      throw gateError;
    }
  }

  private async assertActiveProfile(user: User): Promise<ProfileWithDepartment> {
    const profile = await this.profileRepository.findByUserId(user.id);

    if (!profile) {
      throw new ForbiddenError(
        "No application profile is linked to this account. Contact an administrator."
      );
    }

    if (profile.status !== "active") {
      throw new ForbiddenError("This account has been deactivated.");
    }

    // Best-effort presence stamp — never block sign-in on a slow UPDATE.
    void this.profileRepository.touchLastActive(user.id).catch(() => undefined);

    return profile;
  }
}
