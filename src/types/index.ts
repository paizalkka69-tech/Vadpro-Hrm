export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  roleId: number;
  companyId: number;
  branchId?: number;
  employeeId?: number;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Employee {
  id: number;
  empCode: string;
  nameEn: string;
  nameAr?: string;
  departmentName?: string;
  branchName?: string;
  designationName?: string;
  gradeName?: string;
  statusName?: string;
  statusId: number;
  doj: string;
  gender?: string;
  phone?: string;
  basicSalary: number;
  totalSalary: number;
}

export interface EmployeeDetail extends Employee {
  dob?: string;
  maritalStatus?: string;
  nationalityName?: string;
  religionName?: string;
  email?: string;
  personalEmail?: string;
  mobile?: string;
  address1?: string;
  city?: string;
  photoPath?: string;
  companyId: number;
  branchId: number;
  departmentId?: number;
  sectionId?: number;
  designationId?: number;
  gradeId?: number;
  categoryId?: number;
  nationalityId?: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  absentToday: number;
  newHiresThisMonth: number;
  departmentDistribution: { departmentName: string; count: number }[];
  expiringDocuments: { employeeName: string; documentType: string; expiryDate: string }[];
}

export interface LookupItem {
  id: number;
  nameEn: string;
  nameAr?: string;
  [key: string]: unknown;
}
