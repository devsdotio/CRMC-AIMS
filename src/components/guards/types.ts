export type MockRole = 'admin' | 'borrower';

export interface GuardConfig {
  allowedRoles: MockRole[];
  /** 
   * Safe fallback route when no mock_role cookie is present or role is indeterminate 
   * @default "/sign-in"
   */
  fallbackRoute?: string;
}
