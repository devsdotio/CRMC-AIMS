"use client";

import type { SystemBackupStatus } from "./types";
import { DataExportCard } from "./data-export-card";
import { BackupStatusCard } from "./backup-status-card";

export interface SystemSectionProps {
  backupStatus: SystemBackupStatus;
}

export function SystemSection({ backupStatus }: SystemSectionProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <DataExportCard />
      <BackupStatusCard backupStatus={backupStatus} />
    </div>
  );
}
