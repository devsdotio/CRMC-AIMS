import type { UserAccount, UserRole, UserStatus } from "@/components/users/types";

export type ProfileDTO = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  dateAdded: string;
  lastActive: string | null;
  createdByUserId: string | null;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  role: Exclude<UserRole, "superadmin">;
  department?: string;
  password: string;
};

export type UpdateUserPayload = {
  name?: string;
  role?: Exclude<UserRole, "superadmin">;
  department?: string | null;
  status?: UserStatus;
};

export type MeProfile = ProfileDTO;

export function toUserAccount(profile: ProfileDTO): UserAccount {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    department: profile.department ?? "",
    dateAdded: profile.dateAdded,
    lastActive: profile.lastActive ?? "—",
    activitySummary:
      profile.status === "active" ? undefined : "Account deactivated",
  };
}

type ApiResponse<T> = { data: T };
type ApiErrorResponse = { error?: string };

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as ApiErrorResponse;
      if (payload.error) message = payload.error;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const usersApi = {
  async getMe(): Promise<ProfileDTO> {
    const response = await fetchJson<ApiResponse<ProfileDTO>>("/api/me", {
      method: "GET",
    });
    return response.data;
  },

  async listUsers(params?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }): Promise<ProfileDTO[]> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set("role", params.role);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    const path = qs ? `/api/users?${qs}` : "/api/users";
    const response = await fetchJson<ApiResponse<ProfileDTO[]>>(path, {
      method: "GET",
    });
    return response.data;
  },

  async createUser(payload: CreateUserPayload): Promise<ProfileDTO> {
    const response = await fetchJson<ApiResponse<ProfileDTO>>("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<ProfileDTO> {
    const response = await fetchJson<ApiResponse<ProfileDTO>>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async deactivateUser(id: string): Promise<ProfileDTO> {
    const response = await fetchJson<ApiResponse<ProfileDTO>>(`/api/users/${id}`, {
      method: "DELETE",
    });
    return response.data;
  },
};
