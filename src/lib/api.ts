import axios, { AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5020';

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hrms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ═══════════════ DEMO MODE — mock data by URL ═══════════════
const EMPLOYEES = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', nameAr: 'أحمد العتيبي', gender: 'M', nationality: 'Saudi', nationalityName: 'Saudi', departmentName: 'Finance', designationName: 'Accountant', branchName: 'Riyadh HO', gradeName: 'G3', statusId: 1, statusName: 'Active', email: 'ahmed@vadpro.com', mobile: '+966 501 234 567', basicSalary: 9500, totalSalary: 12500, doj: '2021-03-15', dob: '1990-05-12' },
  { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', nameAr: 'فاطمة السليمان', gender: 'F', nationality: 'Saudi', nationalityName: 'Saudi', departmentName: 'HR', designationName: 'HR Manager', branchName: 'Riyadh HO', gradeName: 'G5', statusId: 1, statusName: 'Active', email: 'fatimah@vadpro.com', mobile: '+966 502 111 222', basicSalary: 14500, totalSalary: 18800, doj: '2019-07-01', dob: '1987-11-03' },
  { id: 3, empCode: 'E-1003', nameEn: 'Rahul Kumar', nameAr: 'راهول كومار', gender: 'M', nationality: 'Indian', nationalityName: 'Indian', departmentName: 'IT', designationName: 'Senior Developer', branchName: 'Jeddah', gradeName: 'G4', statusId: 1, statusName: 'Active', email: 'rahul@vadpro.com', mobile: '+966 503 777 888', basicSalary: 11000, totalSalary: 14200, doj: '2022-01-10', dob: '1992-09-25' },
  { id: 4, empCode: 'E-1004', nameEn: 'Mohammed Al-Qahtani', nameAr: 'محمد القحطاني', gender: 'M', nationality: 'Saudi', nationalityName: 'Saudi', departmentName: 'Sales', designationName: 'Sales Executive', branchName: 'Dammam', gradeName: 'G2', statusId: 1, statusName: 'Active', email: 'mohammed@vadpro.com', mobile: '+966 504 333 444', basicSalary: 7500, totalSalary: 10100, doj: '2023-06-20', dob: '1995-02-18' },
  { id: 5, empCode: 'E-1005', nameEn: 'Priya Sharma', nameAr: 'بريا شارما', gender: 'F', nationality: 'Indian', nationalityName: 'Indian', departmentName: 'IT', designationName: 'UI/UX Designer', branchName: 'Jeddah', gradeName: 'G3', statusId: 1, statusName: 'Active', email: 'priya@vadpro.com', mobile: '+966 505 666 555', basicSalary: 9000, totalSalary: 11700, doj: '2022-11-05', dob: '1993-07-14' },
  { id: 6, empCode: 'E-1006', nameEn: 'Khalid Al-Harbi', nameAr: 'خالد الحربي', gender: 'M', nationality: 'Saudi', nationalityName: 'Saudi', departmentName: 'Operations', designationName: 'Warehouse Supervisor', branchName: 'Riyadh HO', gradeName: 'G3', statusId: 1, statusName: 'Active', email: 'khalid@vadpro.com', mobile: '+966 506 222 111', basicSalary: 8500, totalSalary: 11000, doj: '2020-09-14', dob: '1988-04-22' },
  { id: 7, empCode: 'E-1007', nameEn: 'Aisha Al-Mutairi', nameAr: 'عائشة المطيري', gender: 'F', nationality: 'Saudi', nationalityName: 'Saudi', departmentName: 'Finance', designationName: 'Senior Accountant', branchName: 'Riyadh HO', gradeName: 'G4', statusId: 1, statusName: 'Active', email: 'aisha@vadpro.com', mobile: '+966 507 888 999', basicSalary: 12000, totalSalary: 15500, doj: '2020-02-17', dob: '1989-12-01' },
  { id: 8, empCode: 'E-1008', nameEn: 'Sunil Nair', nameAr: 'سونيل ناير', gender: 'M', nationality: 'Indian', nationalityName: 'Indian', departmentName: 'Sales', designationName: 'Sales Manager', branchName: 'Dammam', gradeName: 'G5', statusId: 1, statusName: 'Active', email: 'sunil@vadpro.com', mobile: '+966 508 444 333', basicSalary: 13500, totalSalary: 17800, doj: '2018-05-08', dob: '1985-06-30' },
];

const BRANCHES    = [
  { id: 1, branchCode: 'B01', nameEn: 'Riyadh HO', nameAr: 'الرياض', isActive: true },
  { id: 2, branchCode: 'B02', nameEn: 'Jeddah', nameAr: 'جدة', isActive: true },
  { id: 3, branchCode: 'B03', nameEn: 'Dammam', nameAr: 'الدمام', isActive: true },
];
const DEPARTMENTS = [
  { id: 1, deptCode: 'D01', nameEn: 'Finance', nameAr: 'المالية', isActive: true },
  { id: 2, deptCode: 'D02', nameEn: 'HR', nameAr: 'الموارد البشرية', isActive: true },
  { id: 3, deptCode: 'D03', nameEn: 'IT', nameAr: 'تقنية المعلومات', isActive: true },
  { id: 4, deptCode: 'D04', nameEn: 'Sales', nameAr: 'المبيعات', isActive: true },
  { id: 5, deptCode: 'D05', nameEn: 'Operations', nameAr: 'العمليات', isActive: true },
];
const DESIGNATIONS= [
  { id: 1, desigCode: 'DG01', nameEn: 'Accountant', nameAr: 'محاسب', isActive: true },
  { id: 2, desigCode: 'DG02', nameEn: 'HR Manager', nameAr: 'مدير الموارد البشرية', isActive: true },
  { id: 3, desigCode: 'DG03', nameEn: 'Senior Developer', nameAr: 'مطور أول', isActive: true },
  { id: 4, desigCode: 'DG04', nameEn: 'Sales Executive', nameAr: 'تنفيذي مبيعات', isActive: true },
  { id: 5, desigCode: 'DG05', nameEn: 'UI/UX Designer', nameAr: 'مصمم واجهات', isActive: true },
  { id: 6, desigCode: 'DG06', nameEn: 'Warehouse Supervisor', nameAr: 'مشرف مستودع', isActive: true },
  { id: 7, desigCode: 'DG07', nameEn: 'Senior Accountant', nameAr: 'محاسب أول', isActive: true },
  { id: 8, desigCode: 'DG08', nameEn: 'Sales Manager', nameAr: 'مدير مبيعات', isActive: true },
];
const GRADES      = [
  { id: 1, gradeCode: 'G1', nameEn: 'Grade 1', nameAr: 'الدرجة 1', isActive: true },
  { id: 2, gradeCode: 'G2', nameEn: 'Grade 2', nameAr: 'الدرجة 2', isActive: true },
  { id: 3, gradeCode: 'G3', nameEn: 'Grade 3', nameAr: 'الدرجة 3', isActive: true },
  { id: 4, gradeCode: 'G4', nameEn: 'Grade 4', nameAr: 'الدرجة 4', isActive: true },
  { id: 5, gradeCode: 'G5', nameEn: 'Grade 5', nameAr: 'الدرجة 5', isActive: true },
];
const SECTIONS    = [
  { id: 1, sectionCode: 'S01', nameEn: 'Accounts Receivable', nameAr: 'الذمم المدينة', isActive: true },
  { id: 2, sectionCode: 'S02', nameEn: 'Accounts Payable', nameAr: 'الذمم الدائنة', isActive: true },
  { id: 3, sectionCode: 'S03', nameEn: 'Recruitment', nameAr: 'التوظيف', isActive: true },
];
const CATEGORIES  = [
  { id: 1, categoryCode: 'C01', nameEn: 'Full-time', nameAr: 'دوام كامل', isActive: true },
  { id: 2, categoryCode: 'C02', nameEn: 'Part-time', nameAr: 'دوام جزئي', isActive: true },
  { id: 3, categoryCode: 'C03', nameEn: 'Contract', nameAr: 'عقد', isActive: true },
];
const NATIONS     = [{ id: 1, name: 'Saudi' }, { id: 2, name: 'Indian' }, { id: 3, name: 'Egyptian' }, { id: 4, name: 'Pakistani' }, { id: 5, name: 'Filipino' }];
const LEAVE_TYPES = [{ id: 1, name: 'Annual' }, { id: 2, name: 'Sick' }, { id: 3, name: 'Emergency' }, { id: 4, name: 'Hajj' }, { id: 5, name: 'Maternity' }];

const ATTENDANCE = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', date: '2026-04-23', checkIn: '08:02', checkOut: '17:15', hoursWorked: 9.2, status: 'Present' },
  { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', date: '2026-04-23', checkIn: '07:55', checkOut: '17:05', hoursWorked: 9.2, status: 'Present' },
  { id: 3, empCode: 'E-1003', nameEn: 'Rahul Kumar', date: '2026-04-23', checkIn: '09:11', checkOut: '18:25', hoursWorked: 9.2, status: 'Late' },
  { id: 4, empCode: 'E-1004', nameEn: 'Mohammed Al-Qahtani', date: '2026-04-23', checkIn: null, checkOut: null, hoursWorked: 0, status: 'Absent' },
  { id: 5, empCode: 'E-1005', nameEn: 'Priya Sharma', date: '2026-04-23', checkIn: '08:30', checkOut: '17:30', hoursWorked: 9.0, status: 'Present' },
];

const LEAVE_APPS = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', leaveType: 'Annual', fromDate: '2026-05-01', toDate: '2026-05-07', days: 7, status: 'Pending' },
  { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', leaveType: 'Sick', fromDate: '2026-04-10', toDate: '2026-04-11', days: 2, status: 'Approved' },
  { id: 3, empCode: 'E-1005', nameEn: 'Priya Sharma', leaveType: 'Emergency', fromDate: '2026-04-15', toDate: '2026-04-15', days: 1, status: 'Approved' },
  { id: 4, empCode: 'E-1007', nameEn: 'Aisha Al-Mutairi', leaveType: 'Annual', fromDate: '2026-06-15', toDate: '2026-06-25', days: 11, status: 'Pending' },
];

const PAYROLL = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', month: '2026-03', basic: 9500, allowances: 3000, deductions: 950, gosi: 855, netSalary: 10695, status: 'Paid' },
  { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', month: '2026-03', basic: 14500, allowances: 4300, deductions: 1450, gosi: 1305, netSalary: 16045, status: 'Paid' },
  { id: 3, empCode: 'E-1003', nameEn: 'Rahul Kumar', month: '2026-03', basic: 11000, allowances: 3200, deductions: 1100, gosi: 0, netSalary: 13100, status: 'Paid' },
  { id: 4, empCode: 'E-1004', nameEn: 'Mohammed Al-Qahtani', month: '2026-03', basic: 7500, allowances: 2600, deductions: 750, gosi: 675, netSalary: 8675, status: 'Processing' },
  { id: 5, empCode: 'E-1005', nameEn: 'Priya Sharma', month: '2026-03', basic: 9000, allowances: 2700, deductions: 900, gosi: 0, netSalary: 10800, status: 'Paid' },
];

const LOANS = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', loanType: 'Personal Loan', amount: 20000, emi: 2000, remaining: 12000, status: 'Active' },
  { id: 2, empCode: 'E-1006', nameEn: 'Khalid Al-Harbi', loanType: 'Advance', amount: 5000, emi: 500, remaining: 2500, status: 'Active' },
];

const CONTRACTS = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', contractType: 'Fixed Term', startDate: '2021-03-15', endDate: '2027-03-14', status: 'Active' },
  { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', contractType: 'Unlimited', startDate: '2019-07-01', endDate: null, status: 'Active' },
  { id: 3, empCode: 'E-1003', nameEn: 'Rahul Kumar', contractType: 'Fixed Term', startDate: '2022-01-10', endDate: '2028-01-09', status: 'Active' },
];

const EOS = [
  { id: 1, empCode: 'E-2099', nameEn: 'Former Employee', reason: 'Resignation', eosDate: '2026-02-28', serviceYears: 4.5, gratuity: 18500, status: 'Settled' },
];

const INSURANCE = [
  { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', policyNo: 'MEDGULF-2026-001', insurer: 'MedGulf', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
  { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', policyNo: 'BUPA-2026-002', insurer: 'BUPA', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
];

const DASHBOARD_STATS = { totalEmployees: 8, activeEmployees: 8, onLeaveToday: 2, pendingApprovals: 3, thisMonthPayroll: 105420, avgAttendance: 93.5 };

const mockData = (url: string): unknown => {
  const u = url.toLowerCase();
  if (u.includes('/dashboard/stats')) return DASHBOARD_STATS;
  if (u.match(/\/employees\/\d+$/)) { const id = parseInt(u.match(/\/employees\/(\d+)/)![1]); return EMPLOYEES.find(e => e.id === id) || EMPLOYEES[0]; }
  if (u.includes('/employees')) return EMPLOYEES;
  if (u.includes('/lookups/branches') || u.includes('/organization/branches')) return BRANCHES;
  if (u.includes('/lookups/departments') || u.includes('/organization/departments')) return DEPARTMENTS;
  if (u.includes('/lookups/designations') || u.includes('/organization/designations')) return DESIGNATIONS;
  if (u.includes('/lookups/grades') || u.includes('/organization/grades')) return GRADES;
  if (u.includes('/organization/sections')) return SECTIONS;
  if (u.includes('/organization/categories')) return CATEGORIES;
  if (u.includes('/lookups/nationalities')) return NATIONS;
  if (u.includes('/lookups/leave') || u.includes('/leave/policies')) return LEAVE_TYPES;
  if (u.includes('/attendances')) return ATTENDANCE;
  if (u.includes('/leave/applications')) return LEAVE_APPS;
  if (u.includes('/leave/balances')) return EMPLOYEES.map(e => ({ empCode: e.empCode, nameEn: e.nameEn, annual: 30, taken: Math.floor(Math.random() * 10), remaining: 30 - Math.floor(Math.random() * 10) }));
  if (u.includes('/payroll')) return PAYROLL;
  if (u.includes('/loans')) return LOANS;
  if (u.includes('/contracts')) return CONTRACTS;
  if (u.includes('/eos')) return EOS;
  if (u.includes('/insurance')) return INSURANCE;
  if (u.includes('/documents')) return [
    { id: 1, empCode: 'E-1001', nameEn: 'Ahmed Al-Otaibi', documentType: 'Passport', documentNo: 'A12345678', issueDate: '2020-01-10', expiryDate: '2030-01-09', status: 'Valid' },
    { id: 2, empCode: 'E-1002', nameEn: 'Fatimah Al-Sulaiman', documentType: 'Iqama', documentNo: '2301234567', issueDate: '2024-05-15', expiryDate: '2026-05-14', status: 'Expiring Soon' },
    { id: 3, empCode: 'E-1003', nameEn: 'Rahul Kumar', documentType: 'Driving License', documentNo: 'DL-11223344', issueDate: '2023-03-20', expiryDate: '2028-03-19', status: 'Valid' },
  ];
  if (u.includes('/settings/audit')) return [
    { id: 1, user: 'admin', action: 'Login', timestamp: '2026-04-24 09:15', ip: '192.168.1.10' },
    { id: 2, user: 'demo', action: 'Create Employee', timestamp: '2026-04-24 10:02', ip: '192.168.1.12' },
  ];
  if (u.includes('/self')) return { empCode: 'E-1001', nameEn: 'Demo User', departmentName: 'Finance', designationName: 'Accountant', branchName: 'Riyadh HO', doj: '2021-03-15', email: 'demo@vadpro.com' };
  if (u.includes('/settings/users')) return [ { id: 1, username: 'admin', fullName: 'Administrator', role: 'Admin', isActive: true }, { id: 2, username: 'demo', fullName: 'Demo User', role: 'User', isActive: true } ];
  if (u.includes('/settings/roles')) return [ { id: 1, name: 'Admin', permissions: 48 }, { id: 2, name: 'Manager', permissions: 32 }, { id: 3, name: 'User', permissions: 12 } ];
  return [];
};

// DEMO MODE response interceptor
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error?.config?.url || '';
    const data = mockData(url);
    return Promise.resolve({
      data: {
        success: true,
        message: 'Demo mode — offline data',
        data,
        pagination: Array.isArray(data)
          ? { totalCount: (data as unknown[]).length, page: 1, pageSize: 20, totalPages: 1, hasPrevious: false, hasNext: false }
          : undefined,
      },
    });
  }
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  errors?: string[];
}
