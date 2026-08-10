import type { Project, ProjectStatus } from "@/types/projects";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type CreateProjectPayload = {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  location?: string | null;
  department?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | number | null;
  notes?: string | null;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export const projectsApi = {
  async list(params?: {
    search?: string;
    status?: ProjectStatus;
  }): Promise<Project[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    const path = qs ? `/api/projects?${qs}` : "/api/projects";
    const response = await fetchJson<ApiResponse<Project[]>>(path, {
      method: "GET",
    });
    return response.data;
  },

  async get(id: string): Promise<Project> {
    const response = await fetchJson<ApiResponse<Project>>(
      `/api/projects/${id}`,
      { method: "GET" }
    );
    return response.data;
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    const response = await fetchJson<ApiResponse<Project>>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const response = await fetchJson<ApiResponse<Project>>(
      `/api/projects/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await fetchJson<void>(`/api/projects/${id}`, { method: "DELETE" });
  },
};
