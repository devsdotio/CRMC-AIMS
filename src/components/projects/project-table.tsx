"use client";

import { FolderKanban } from "lucide-react";
import type { Project } from "@/types/projects";
import { ProjectTableRow } from "./project-table-row";

export interface ProjectTableProps {
  projects: Project[];
  loading?: boolean;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-border bg-bg animate-pulse">
      <td className="px-5 py-4">
        <div className="h-4 w-40 bg-border rounded mb-1" />
        <div className="h-3 w-28 bg-border rounded" />
      </td>
      <td className="px-3 py-4">
        <div className="h-5 w-16 bg-border rounded-full" />
      </td>
      <td className="px-3 py-4 hidden md:table-cell">
        <div className="h-3.5 w-24 bg-border rounded" />
      </td>
      <td className="px-3 py-4 hidden lg:table-cell">
        <div className="h-3.5 w-20 bg-border rounded" />
      </td>
      <td className="px-3 py-4 hidden sm:table-cell">
        <div className="h-3.5 w-16 bg-border rounded" />
      </td>
      <td className="px-3 py-4 hidden sm:table-cell">
        <div className="h-3.5 w-16 bg-border rounded" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          <div className="h-7 w-14 bg-border rounded" />
          <div className="h-7 w-14 bg-border rounded" />
        </div>
      </td>
    </tr>
  );
}

export function ProjectTable({
  projects,
  loading = false,
  onSelect,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Projects loading">
          <thead>
            <tr className="border-b border-border bg-bg-subtle text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              <th scope="col" className="px-5 py-3">
                Project
              </th>
              <th scope="col" className="px-3 py-3">
                Status
              </th>
              <th scope="col" className="px-3 py-3 hidden md:table-cell">
                Location
              </th>
              <th scope="col" className="px-3 py-3 hidden lg:table-cell">
                Department
              </th>
              <th scope="col" className="px-3 py-3 hidden sm:table-cell">
                Budget
              </th>
              <th scope="col" className="px-3 py-3 hidden sm:table-cell">
                Spent
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle border border-border mb-3">
          <FolderKanban className="h-6 w-6 text-text-secondary" />
        </div>
        <p className="text-sm font-bold text-text">No projects found</p>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">
          Create a project for renovations, construction, or other custodian-managed
          work. Materials and expenses will attach in later phases.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label="Projects table">
        <thead>
          <tr className="border-b border-border bg-bg-subtle text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            <th scope="col" className="px-5 py-3">
              Project
            </th>
            <th scope="col" className="px-3 py-3">
              Status
            </th>
            <th scope="col" className="px-3 py-3 hidden md:table-cell">
              Location
            </th>
            <th scope="col" className="px-3 py-3 hidden lg:table-cell">
              Department
            </th>
            <th scope="col" className="px-3 py-3 hidden sm:table-cell">
              Budget
            </th>
            <th scope="col" className="px-3 py-3 hidden sm:table-cell">
              Spent
            </th>
            <th scope="col" className="px-5 py-3 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
