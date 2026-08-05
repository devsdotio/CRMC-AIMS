"use client";

import { useState, useMemo, useEffect } from "react";
import { UserPlus } from "lucide-react";
import type { UserAccount, UserFilterState, UserRole } from "@/types/users";
import { INITIAL_MOCK_USERS, CURRENT_USER_ID } from "@/components/users/mock-data";
import { UserFilters } from "@/components/users/user-filters";
import { UserTable } from "@/components/users/user-table";
import { UserDetailPanel } from "@/components/users/user-detail-panel";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { DeactivateUserDialog } from "@/components/users/deactivate-user-dialog";

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_MOCK_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [filters, setFilters] = useState<UserFilterState>({
    searchQuery: "",
    role: "all",
    status: "all",
  });

  // Modal / Drawer States
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogUser, setEditDialogUser] = useState<UserAccount | null>(null);
  const [deactivateDialogUser, setDeactivateDialogUser] = useState<UserAccount | null>(null);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(query);
        const matchEmail = u.email.toLowerCase().includes(query);
        if (!matchName && !matchEmail) return false;
      }

      // 2. Role Filter
      if (filters.role && filters.role !== "all" && u.role !== filters.role) {
        return false;
      }

      // 3. Status Filter
      if (filters.status && filters.status !== "all" && u.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [users, filters]);

  // Handlers
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

  const handleSendInvite = (name: string, email: string, role: UserRole, department: string) => {
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      status: "active",
      department,
      dateAdded: new Date().toISOString().split("T")[0],
      lastActive: "Invited (Pending login)",
      activitySummary: "Account invitation sent",
    };

    setUsers((prev) => [newUser, ...prev]);
  };

  const handleSaveUser = (updatedUser: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (selectedUser?.id === updatedUser.id) {
      setSelectedUser(updatedUser);
    }
  };

  const handleConfirmDeactivate = (userToDeactivate: UserAccount) => {
    // Self-action protection safety check
    if (userToDeactivate.id === CURRENT_USER_ID) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToDeactivate.id
          ? {
              ...u,
              status: "deactivated",
              lastActive: `Deactivated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
            }
          : u
      )
    );

    if (selectedUser?.id === userToDeactivate.id) {
      setSelectedUser((prev) => (prev ? { ...prev, status: "deactivated" } : null));
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Users & Roles Management
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {filteredUsers.length} of {users.length} accounts
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage staff accounts and predefined access boundaries (Admin, Staff, Borrower / Requester).
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setInviteDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.5} />
            Invite Staff Member
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <UserFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalUsersCount={users.length}
      />

      {/* ── Internal Scrollable Table Region ──────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        <UserTable
          users={filteredUsers}
          currentUserId={CURRENT_USER_ID}
          loading={isLoading}
          onSelect={setSelectedUser}
          onEdit={setEditDialogUser}
          onDeactivate={setDeactivateDialogUser}
        />
      </main>

      {/* ── Detail Slide-over Panel ──────────────────────────────────── */}
      <UserDetailPanel
        user={selectedUser}
        currentUserId={CURRENT_USER_ID}
        isOpen={Boolean(selectedUser)}
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

      {/* ── Invite User Dialog ───────────────────────────────────────── */}
      <InviteUserDialog
        isOpen={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onSendInvite={handleSendInvite}
      />

      {/* ── Edit User Dialog ─────────────────────────────────────────── */}
      <EditUserDialog
        user={editDialogUser}
        currentUserId={CURRENT_USER_ID}
        isOpen={Boolean(editDialogUser)}
        onClose={() => setEditDialogUser(null)}
        onSave={handleSaveUser}
      />

      {/* ── Deactivate User Dialog ───────────────────────────────────── */}
      <DeactivateUserDialog
        user={deactivateDialogUser}
        isOpen={Boolean(deactivateDialogUser)}
        onClose={() => setDeactivateDialogUser(null)}
        onConfirmDeactivate={handleConfirmDeactivate}
      />
    </div>
  );
}
