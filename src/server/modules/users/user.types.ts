import type { AppRole, ProfileStatus } from "@/server/shared/roles";
import type { ActorContext } from "@/server/shared/auth";

export interface ProfileDTO {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  status: ProfileStatus;
  department: string | null;
  dateAdded: string;
  lastActive: string | null;
  createdByUserId: string | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: AppRole;
  department?: string;
  /** Required initial password set by the admin at provision time. */
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: AppRole;
  department?: string | null;
  status?: ProfileStatus;
}

export interface ListUsersFilters {
  role?: AppRole;
  status?: ProfileStatus;
  search?: string;
}

export interface IProfileRepository {
  findByUserId(userId: string): Promise<import("@/server/db/schema").ProfileRow | null>;
  findByEmail(email: string): Promise<import("@/server/db/schema").ProfileRow | null>;
  list(filters?: ListUsersFilters): Promise<import("@/server/db/schema").ProfileRow[]>;
  create(
    data: import("@/server/db/schema").NewProfileRow
  ): Promise<import("@/server/db/schema").ProfileRow>;
  update(
    userId: string,
    data: Partial<
      Omit<import("@/server/db/schema").ProfileRow, "userId" | "createdAt">
    >
  ): Promise<import("@/server/db/schema").ProfileRow | null>;
}

export type { ActorContext };
