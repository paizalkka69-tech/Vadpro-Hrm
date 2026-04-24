const en = {
  // Common
  app: { name: 'VADPRO HRMS', subtitle: 'Human Resource Management System' },
  common: {
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    back: 'Back', search: 'Search', filter: 'Filter', export: 'Export',
    active: 'Active', inactive: 'Inactive', yes: 'Yes', no: 'No',
    actions: 'Actions', loading: 'Loading...', noData: 'No data found',
    confirmDelete: 'Delete this {entity}?', created: '{entity} created',
    updated: '{entity} updated', deleted: '{entity} deleted',
    failedSave: 'Failed to save', failedDelete: 'Failed to delete',
    comingSoon: 'Coming Soon', select: 'Select', all: 'All',
  },

  // Auth
  auth: {
    login: 'Login', logout: 'Logout', username: 'Username', password: 'Password',
    loginTitle: 'Sign In', loginSubtitle: 'Welcome to VADPRO HRMS',
    loginButton: 'Sign In', invalidCredentials: 'Invalid username or password',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard', employees: 'Employees',
    organization: 'Organization', operations: 'Operations', finance: 'Finance', system: 'System',
    branches: 'Branches', departments: 'Departments', designations: 'Designations',
    sections: 'Sections', grades: 'Grades', categories: 'Categories',
    attendance: 'Attendance', leave: 'Leave', documents: 'Documents', contracts: 'Contracts',
    payroll: 'Payroll', loans: 'Loans', eos: 'End of Service', insurance: 'Insurance & GOSI',
    reports: 'Reports', settings: 'Settings',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard', totalEmployees: 'Total Employees', activeEmployees: 'Active Employees',
    onLeave: 'On Leave', newHires: 'New Hires (30d)', deptDistribution: 'Department Distribution',
  },

  // Employee
  employee: {
    title: 'Employees', addEmployee: 'Add Employee', editEmployee: 'Edit Employee',
    code: 'Employee Code', nameEn: 'Name (English)', nameAr: 'Name (Arabic)',
    gender: 'Gender', male: 'Male', female: 'Female',
    dob: 'Date of Birth', doj: 'Date of Joining',
    maritalStatus: 'Marital Status', single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed',
    nationality: 'Nationality', department: 'Department', branch: 'Branch',
    designation: 'Designation', grade: 'Grade', status: 'Status',
    phone: 'Phone', mobile: 'Mobile', email: 'Email',
    basicSalary: 'Basic Salary', totalSalary: 'Total Salary',
    personalInfo: 'Personal Information', employmentDetails: 'Employment Details',
    contactSalary: 'Contact & Salary', personal: 'Personal', employment: 'Employment', salary: 'Salary',
    searchPlaceholder: 'Search by name or code...',
  },

  // Organization
  org: {
    branchCode: 'Branch Code', deptCode: 'Dept Code', desigCode: 'Desig Code',
    sectionCode: 'Section Code', gradeCode: 'Grade Code', categoryCode: 'Category Code',
    nameEn: 'Name (English)', nameAr: 'Name (Arabic)',
    city: 'City', phone: 'Phone', headOffice: 'Head Office',
    parentDept: 'Parent Department', minSalary: 'Min Salary', maxSalary: 'Max Salary',
  },

  // Modules (placeholder pages)
  attendance: {
    title: 'Attendance Management',
    desc: 'Track employee attendance through biometric devices, mobile GPS, and manual entries.',
    dailyLog: 'Daily Attendance Log', dailyLogDesc: 'View and manage daily check-in/check-out records',
    biometric: 'Biometric Devices', biometricDesc: 'Configure fingerprint and face recognition devices',
    shifts: 'Shift Management', shiftsDesc: 'Create and assign work shifts to employees',
    geofence: 'Geofence Zones', geofenceDesc: 'Set up location-based attendance boundaries',
    mobile: 'Mobile Attendance', mobileDesc: 'GPS-based attendance from employee mobile app',
  },
  leave: {
    title: 'Leave Management',
    desc: 'Manage employee leave applications, balances, policies, and encashment.',
    applications: 'Leave Applications', applicationsDesc: 'Apply, approve, and reject leave requests',
    calendar: 'Leave Calendar', calendarDesc: 'Visual calendar view of team absences',
    balances: 'Leave Balances', balancesDesc: 'Track remaining leave entitlements per employee',
    policies: 'Leave Policies', policiesDesc: 'Configure leave types, accrual rules, and carry-forward',
    encashment: 'Leave Encashment', encashmentDesc: 'Process unused leave payout at end of service',
  },
  payroll: {
    title: 'Payroll Management',
    desc: 'Process payroll, generate payslips, manage salary structures, and export WPS files.',
    processing: 'Payroll Processing', processingDesc: 'Calculate and process monthly salary for all employees',
    payslips: 'Payslips', payslipsDesc: 'Generate and distribute employee payslips',
    salaryStructure: 'Salary Structure', salaryStructureDesc: 'Define earnings, deductions, and allowance heads',
    wps: 'WPS Export', wpsDesc: 'Generate Wage Protection System files for bank transfer',
    revisions: 'Salary Revisions', revisionsDesc: 'Track increments, promotions, and salary history',
  },
  documents: {
    title: 'Document Management',
    desc: 'Track employee documents — passports, visas, work permits, residence IDs, and driving licenses.',
    passport: 'Passport Tracker', passportDesc: 'Track passport numbers, expiry dates, and custody status',
    visa: 'Visa Management', visaDesc: 'Monitor visa types, validity, and renewal deadlines',
    workPermit: 'Work Permits', workPermitDesc: 'Track work permit issuance and expiry',
    residence: 'Residence IDs (Iqama)', residenceDesc: 'Manage residence permit details and renewals',
    driving: 'Driving Licenses', drivingDesc: 'Track employee driving license details',
    alerts: 'Expiry Alerts', alertsDesc: 'Automated notifications for documents nearing expiry',
  },
  contracts: {
    title: 'Contract Management',
    desc: 'Manage employee contracts — creation, renewal, termination, and history.',
    active: 'Active Contracts', activeDesc: 'View and manage current employee contracts',
    renewal: 'Contract Renewal', renewalDesc: 'Renew expiring contracts with updated terms',
    termination: 'Termination', terminationDesc: 'Process contract termination and final settlement',
    history: 'Contract History', historyDesc: 'Full audit trail of all contract changes',
  },
  loans: {
    title: 'Loan Management',
    desc: 'Process employee loans — application, approval, and automated salary recovery.',
    applications: 'Loan Applications', applicationsDesc: 'Employee loan requests with type and amount',
    approval: 'Loan Approval', approvalDesc: 'Multi-level approval workflow for loan requests',
    recovery: 'Recovery Schedule', recoveryDesc: 'Monthly EMI deductions from salary',
    reports: 'Loan Reports', reportsDesc: 'Outstanding balances and recovery status',
  },
  eos: {
    title: 'End of Service (EOS)',
    desc: 'Calculate and process end-of-service benefits per Saudi Labor Law Articles 84-85.',
    calculator: 'EOS Calculator', calculatorDesc: 'Calculate end-of-service benefits per Saudi Labor Law (Art. 84-85)',
    settlement: 'Settlement Processing', settlementDesc: 'Process final settlement including leave, loans, and indemnity',
    letter: 'Settlement Letter', letterDesc: 'Generate official EOS settlement documents',
    provisions: 'EOS Provisions', provisionsDesc: 'Monthly accrual tracking for end-of-service liability',
  },
  insurance: {
    title: 'Insurance & GOSI',
    desc: 'Manage GOSI contributions, medical insurance, and compliance reporting.',
    gosi: 'GOSI Management', gosiDesc: 'Calculate and track General Organization for Social Insurance contributions',
    medical: 'Medical Insurance', medicalDesc: 'Manage employee medical insurance policies and claims',
    cards: 'Insurance Cards', cardsDesc: 'Track insurance card issuance and validity',
    reports: 'Insurance Reports', reportsDesc: 'Monthly contribution reports and compliance status',
  },
  reportsPage: {
    title: 'Reports',
    desc: 'Generate and export HR reports — employee, payroll, attendance, and compliance.',
    employee: 'Employee Reports', employeeDesc: 'Headcount, turnover, demographics, and workforce analytics',
    payroll: 'Payroll Reports', payrollDesc: 'Salary summaries, department-wise costs, and WPS reports',
    attendance: 'Attendance Reports', attendanceDesc: 'Attendance summary, overtime, late-coming, and absence reports',
    export: 'Export Center', exportDesc: 'Export any report to Excel, PDF, or CSV format',
  },
  settingsPage: {
    title: 'Settings',
    desc: 'Manage users, roles, permissions, and system configuration.',
    users: 'User Management', usersDesc: 'Create and manage system users and access levels',
    roles: 'Roles & Permissions', rolesDesc: 'Configure role-based access control for all modules',
    system: 'System Settings', systemDesc: 'Company info, fiscal year, currency, and preferences',
    audit: 'Audit Log', auditDesc: 'Track all user actions and data changes',
  },
  // Self-Service
  selfService: {
    dashboard: 'My Dashboard', profile: 'My Profile', payslips: 'My Payslips',
    leave: 'My Leave', attendance: 'My Attendance', documents: 'My Documents',
    leaveBalance: 'Leave Balance', applyLeave: 'Apply Leave', submitLeave: 'Submit',
    annualLeaveBalance: 'Annual Leave Balance', pendingRequests: 'pending requests',
    lastPayslip: 'Last Payslip', presentThisMonth: 'Present This Month',
    documentsExpiring: 'Documents Expiring', within30Days: 'within 30 days',
    quickActions: 'Quick Actions', noEmployeeLinked: 'No employee linked to your account',
    contactHR: 'Please contact HR to link your employee record.',
    personalInfo: 'Personal Information', employmentDetails: 'Employment Details',
    salaryInfo: 'Salary Information', viewProfile: 'View personal & employment details',
    applyForLeave: 'Submit a new leave application', viewPayslips: 'Download and view salary slips',
    viewAttendance: 'View daily attendance records', viewDocuments: 'Passport, visa, work permit status',
    checkBalance: 'Check all leave type balances',
  },

  // Notifications
  notifications: {
    title: 'Notifications', markAllRead: 'Mark all read', noNotifications: 'No notifications',
    justNow: 'Just now', minutesAgo: '{n}m ago', hoursAgo: '{n}h ago', daysAgo: '{n}d ago',
  },
};

export default en;
export type Translations = typeof en;
