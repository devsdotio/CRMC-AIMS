"use client";

import { useState, useMemo } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import type {
  UserAccount,
  UserFilterState,
  UserRole,
} from "@/components/users/types";
import { UserFilters } from "@/components/users/user-filters";
import { UserTable } from "@/components/users/user-table";
import { UserDetailPanel } from "@/components/users/user-detail-panel";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeactivateUserDialog } from "@/components/users/deactivate-user-dialog";
import {
  useCreateUserMutation,
  useDeactivateUserMutation,
  useMeQuery,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/client";

export default function UsersPage() {
  const { data: me, isLoading: meLoading, error: meError } = useMeQuery();
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
    isFetching,
  } = useUsersQuery();

  const createUser = useCreateUserMutation();
  const updateUser = useUpdateUserMutation();
  const deactivateUser = useDeactivateUserMutation();

  const currentUserId = me?.id ?? "";
  const canInviteAdmin = me?.role === "superadmin";
  const isLoading = meLoading || usersLoading;

  const [filters, setFilters] = useState<UserFilterState>({
    searchQuery: "",
    role: "all",
    status: "all",
  });

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogUser, setEditDialogUser] = useState<UserAccount | null>(null);
  const [deactivateDialogUser, setDeactivateDialogUser] =
    useState<UserAccount | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(query);
        const matchEmail = u.email.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }

      if (filters.role && filters.role !== "all" && u.role !== filters.role) {
        return false;
      }

      if (filters.status && filters.status !== "all" && u.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [users, filters]);

  // Keep detail panel in sync with query updates
  const selectedSynced = useMemo(() => {
    if (!selectedUser) return null;
    return users.find((u) => u.id === selectedUser.id) ?? selectedUser;
  }, [users, selectedUser]);

  const handleFilterChange = (updated: Partial<UserFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      role: "all",
      status: "all",
    });
  };

  const handleCreateUser = async (input: {
    name: string;
    email: string;
    role: UserRole;
    department: string;
    password: string;
  }) => {
    setPageError(null);
    if (input.role === "superadmin") {
      throw new Error("Superadmin accounts can only be created via seed script.");
    }

    await createUser.mutateAsync({
      name: input.name,
      email: input.email,
      role: input.role,
      department: input.department || undefined,
      password: input.password,
    });
  };

  const handleSaveUser = async (updatedUser: UserAccount) => {
    setPageError(null);
    if (updatedUser.role === "superadmin") {
      throw new Error("Cannot assign superadmin via this form.");
    }

    const saved = await updateUser.mutateAsync({
      id: updatedUser.id,
      payload: {
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department || null,
        status: updatedUser.status,
      },
    });

    setSelectedUser((prev) => (prev?.id === saved.id ? saved : prev));
  };

  const handleConfirmDeactivate = async (userToDeactivate: UserAccount) => {
    setPageError(null);
    if (userToDeactivate.id === currentUserId) {
      throw new Error("You cannot deactivate your own account.");
    }

    const saved = await deactivateUser.mutateAsync(userToDeactivate.id);
    setSelectedUser((prev) => (prev?.id === saved.id ? saved : prev));
  };

  const loadError =
    meError?.message ||
    usersError?.message ||
    pageError ||
    (me && me.role !== "superadmin" && me.role !== "admin"
      ? "Only admins can manage user accounts."
      : null);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Users & Roles Management
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {filteredUsers.length} of {users.length} accounts
              {isFetching && !isLoading ? " · updating…" : ""}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Provision accounts without self-signup. Admins set email and initial
            password for staff and borrowers; superadmins may also create admins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setInviteDialogOpen(true)}
            disabled={Boolean(loadError) || !me}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            Create User
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mx-4 md:mx-6 mt-3 flex items-start gap-2 rounded-lg border border-status-outofservice-bg/40 bg-status-outofservice-bg/10 px-3 py-2 text-xs text-status-outofservice-text">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      <UserFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalUsersCount={users.length}
      />

      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        <UserTable
          users={filteredUsers}
          currentUserId={currentUserId}
          loading={isLoading}
          onSelect={setSelectedUser}
          onEdit={setEditDialogUser}
          onDeactivate={setDeactivateDialogUser}
        />
      </main>

      <UserDetailPanel
        user={selectedSynced}
        currentUserId={currentUserId}
        isOpen={Boolean(selectedSynced)}
        onClose={() => setSelectedUser(null)}
        onEdit={(u) => {
          setSelectedUser(null);
          setEditDialogUser(u);
        }}
        onDeactivate={(u) => {
          setSelectedUser(null);
          setDeactivateDialogUser(u);
        }}
      />

      <InviteUserDialog
        isOpen={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onCreateUser={handleCreateUser}
        canInviteAdmin={canInviteAdmin}
      />

      <EditUserDialog
        user={editDialogUser}
        currentUserId={currentUserId}
        isOpen={Boolean(editDialogUser)}
        onClose={() => setEditDialogUser(null)}
        onSave={handleSaveUser}
        canInviteAdmin={canInviteAdmin}
      />

      <DeactivateUserDialog
        user={deactivateDialogUser}
        isOpen={Boolean(deactivateDialogUser)}
        onClose={() => setDeactivateDialogUser(null)}
        onConfirmDeactivate={handleConfirmDeactivate}
      />
    </div>
  );
}
