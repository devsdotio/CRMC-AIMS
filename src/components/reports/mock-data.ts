import type {
  SimpleAssetItem,
  SimpleBorrowingEntry,
  SimpleFrequentBorrowed,
  SimpleMaintenanceLog,
  SimpleDamagedLostItem,
  SimpleAcquisitionItem,
  SimpleDisposalItem,
} from "./types";

// ─── 1. Asset Inventory Summary Mock Data ────────────────────────────────────

export const MOCK_SIMPLE_ASSETS: SimpleAssetItem[] = [
  {
    id: "ast-01",
    tagNumber: "CRMC-EQ-001",
    serialNumber: "SN-984210",
    name: "High-Resolution LCD Projector",
    category: "AV Equipment",
    department: "Communications",
    location: "AV Hall 1",
    acquisitionDate: "2024-01-15",
    cost: 45000,
    condition: "Good",
    status: "In Use",
  },
  {
    id: "ast-02",
    tagNumber: "CRMC-CP-044",
    serialNumber: "SN-PC-77491",
    name: "Workstation PC i7 32GB RAM",
    category: "Computing",
    department: "Computer Science",
    location: "ICT Lab A",
    acquisitionDate: "2023-06-10",
    cost: 65000,
    condition: "Good",
    status: "In Storage",
  },
  {
    id: "ast-03",
    tagNumber: "CRMC-LB-008",
    serialNumber: "SN-MIC-1049",
    name: "Binocular Optical Microscope",
    category: "Lab Tools",
    department: "Medical Technology",
    location: "Bio Lab 2",
    acquisitionDate: "2020-02-14",
    cost: 38000,
    condition: "Poor",
    status: "Under Repair",
  },
  {
    id: "ast-04",
    tagNumber: "CRMC-FN-089",
    serialNumber: "N/A",
    name: "Ergonomic Office Chair",
    category: "Furniture",
    department: "Nursing",
    location: "Dean Office",
    acquisitionDate: "2024-04-05",
    cost: 12000,
    condition: "Fair",
    status: "In Use",
  },
  {
    id: "ast-05",
    tagNumber: "CRMC-AV-012",
    serialNumber: "SN-CAM-3310",
    name: "Digital SLR Camera Kit",
    category: "AV Equipment",
    department: "Communications",
    location: "Media Storage",
    acquisitionDate: "2022-11-20",
    cost: 55000,
    condition: "Damaged",
    status: "Disposed",
  },
];

// ─── 2. Borrowing & Lending Mock Data ─────────────────────────────────────────

export const MOCK_SIMPLE_BORROWINGS: SimpleBorrowingEntry[] = [
  {
    id: "bw-01",
    borrowerName: "Maria Santos",
    borrowerType: "Faculty",
    department: "Nursing",
    assetTag: "CRMC-EQ-001",
    assetName: "High-Resolution LCD Projector",
    borrowedDate: "2026-07-28",
    dueDate: "2026-07-30",
    status: "Active",
    isOverdue: false,
  },
  {
    id: "bw-02",
    borrowerName: "Ben Aquino",
    borrowerType: "Staff",
    department: "Communications",
    assetTag: "CRMC-AV-012",
    assetName: "Digital SLR Camera Kit",
    borrowedDate: "2026-07-21",
    dueDate: "2026-07-24",
    status: "Overdue",
    isOverdue: true,
  },
  {
    id: "bw-03",
    borrowerName: "Juan dela Cruz",
    borrowerType: "Student",
    department: "Computer Science",
    assetTag: "CRMC-CP-044",
    assetName: "Workstation PC i7",
    borrowedDate: "2026-07-25",
    dueDate: "2026-07-27",
    returnedDate: "2026-07-27",
    status: "Returned",
    isOverdue: false,
  },
];

export const MOCK_SIMPLE_FREQUENT_BORROWED: SimpleFrequentBorrowed[] = [
  { assetName: "Portable LCD Projector", category: "AV Equipment", borrowCount: 42, primaryDepartment: "Communications" },
  { assetName: "Wireless Presenter Pointer", category: "AV Equipment", borrowCount: 38, primaryDepartment: "Nursing" },
  { assetName: "Digital Multimeter Kit", category: "Lab Tools", borrowCount: 29, primaryDepartment: "Engineering" },
];

// ─── 3. Maintenance & Condition Mock Data ────────────────────────────────────

export const MOCK_SIMPLE_MAINTENANCE: SimpleMaintenanceLog[] = [
  {
    id: "mnt-01",
    assetTag: "CRMC-LB-008",
    assetName: "Binocular Optical Microscope",
    department: "Medical Technology",
    serviceType: "Repair",
    issue: "Lens alignment loose & bulb replace",
    repairCost: 4500,
    serviceDate: "2026-07-15",
    isDueForMaintenance: true,
    status: "Due Soon",
  },
  {
    id: "mnt-02",
    assetTag: "CRMC-EQ-001",
    assetName: "High-Resolution LCD Projector",
    department: "Communications",
    serviceType: "Routine Check",
    issue: "Filter cleaning & lamp check",
    repairCost: 1500,
    serviceDate: "2026-06-02",
    isDueForMaintenance: false,
    status: "Completed",
  },
];

export const MOCK_SIMPLE_DAMAGED_LOST: SimpleDamagedLostItem[] = [
  {
    id: "dmg-01",
    assetTag: "CRMC-AV-099",
    assetName: "VGA Extension Cable 15m",
    department: "Communications",
    type: "Condemned",
    reportedDate: "2026-05-18",
    costImpact: 1200,
    reason: "Internal wire fracture beyond repair",
  },
];

// ─── 4. Procurement & Acquisition Mock Data ─────────────────────────────────

export const MOCK_SIMPLE_ACQUISITIONS: SimpleAcquisitionItem[] = [
  {
    id: "acq-01",
    assetName: "Core i7 Workstation PCs",
    category: "Computing",
    department: "Computer Science",
    quantity: 10,
    totalCost: 450000,
    acquisitionDate: "2026-06-20",
    supplier: "Silicon Tech Philippines",
  },
  {
    id: "acq-02",
    assetName: "Ergonomic Lab Stool Chairs",
    category: "Furniture",
    department: "Nursing",
    quantity: 15,
    totalCost: 90000,
    acquisitionDate: "2026-05-10",
    supplier: "OfficeWorks Furniture Corp",
  },
];

// ─── 5. Disposal & Write-off Mock Data ──────────────────────────────────────

export const MOCK_SIMPLE_DISPOSALS: SimpleDisposalItem[] = [
  {
    id: "dsp-01",
    assetTag: "CRMC-AV-012",
    assetName: "Digital SLR Camera Kit",
    category: "AV Equipment",
    department: "Communications",
    disposalDate: "2026-06-01",
    disposalReason: "Beyond Economic Repair",
    originalCost: 55000,
    salvageValue: 3500,
    approvedBy: "Dave Custodio (Admin)",
  },
];
