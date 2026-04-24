import type { Translations } from './en';

const ar: Translations = {
  // Common
  app: { name: 'أحلامي', subtitle: 'نظام إدارة الموارد البشرية' },
  common: {
    save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', add: 'إضافة',
    back: 'رجوع', search: 'بحث', filter: 'تصفية', export: 'تصدير',
    active: 'نشط', inactive: 'غير نشط', yes: 'نعم', no: 'لا',
    actions: 'إجراءات', loading: 'جاري التحميل...', noData: 'لا توجد بيانات',
    confirmDelete: 'هل تريد حذف {entity}؟', created: 'تم إنشاء {entity}',
    updated: 'تم تحديث {entity}', deleted: 'تم حذف {entity}',
    failedSave: 'فشل في الحفظ', failedDelete: 'فشل في الحذف',
    comingSoon: 'قريباً', select: 'اختر', all: 'الكل',
  },

  // Auth
  auth: {
    login: 'تسجيل الدخول', logout: 'تسجيل الخروج', username: 'اسم المستخدم', password: 'كلمة المرور',
    loginTitle: 'تسجيل الدخول', loginSubtitle: 'مرحباً بك في نظام أحلامي للموارد البشرية',
    loginButton: 'دخول', invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  },

  // Navigation
  nav: {
    dashboard: 'لوحة القيادة', employees: 'الموظفون',
    organization: 'الهيكل التنظيمي', operations: 'العمليات', finance: 'المالية', system: 'النظام',
    branches: 'الفروع', departments: 'الأقسام', designations: 'المسميات الوظيفية',
    sections: 'الشُعب', grades: 'الدرجات', categories: 'الفئات',
    attendance: 'الحضور', leave: 'الإجازات', documents: 'المستندات', contracts: 'العقود',
    payroll: 'الرواتب', loans: 'القروض', eos: 'نهاية الخدمة', insurance: 'التأمينات والتأمين الاجتماعي',
    reports: 'التقارير', settings: 'الإعدادات',
  },

  // Dashboard
  dashboard: {
    title: 'لوحة القيادة', totalEmployees: 'إجمالي الموظفين', activeEmployees: 'الموظفون النشطون',
    onLeave: 'في إجازة', newHires: 'التعيينات الجديدة (30 يوم)', deptDistribution: 'توزيع الأقسام',
  },

  // Employee
  employee: {
    title: 'الموظفون', addEmployee: 'إضافة موظف', editEmployee: 'تعديل موظف',
    code: 'رقم الموظف', nameEn: 'الاسم (إنجليزي)', nameAr: 'الاسم (عربي)',
    gender: 'الجنس', male: 'ذكر', female: 'أنثى',
    dob: 'تاريخ الميلاد', doj: 'تاريخ التعيين',
    maritalStatus: 'الحالة الاجتماعية', single: 'أعزب', married: 'متزوج', divorced: 'مطلق', widowed: 'أرمل',
    nationality: 'الجنسية', department: 'القسم', branch: 'الفرع',
    designation: 'المسمى الوظيفي', grade: 'الدرجة', status: 'الحالة',
    phone: 'الهاتف', mobile: 'الجوال', email: 'البريد الإلكتروني',
    basicSalary: 'الراتب الأساسي', totalSalary: 'إجمالي الراتب',
    personalInfo: 'المعلومات الشخصية', employmentDetails: 'تفاصيل التوظيف',
    contactSalary: 'الاتصال والراتب', personal: 'شخصي', employment: 'وظيفي', salary: 'الراتب',
    searchPlaceholder: 'البحث بالاسم أو الرقم...',
  },

  // Organization
  org: {
    branchCode: 'رمز الفرع', deptCode: 'رمز القسم', desigCode: 'رمز المسمى',
    sectionCode: 'رمز الشعبة', gradeCode: 'رمز الدرجة', categoryCode: 'رمز الفئة',
    nameEn: 'الاسم (إنجليزي)', nameAr: 'الاسم (عربي)',
    city: 'المدينة', phone: 'الهاتف', headOffice: 'المقر الرئيسي',
    parentDept: 'القسم الرئيسي', minSalary: 'الحد الأدنى للراتب', maxSalary: 'الحد الأقصى للراتب',
  },

  // Modules
  attendance: {
    title: 'إدارة الحضور',
    desc: 'تتبع حضور الموظفين من خلال أجهزة البصمة والجوال والإدخال اليدوي.',
    dailyLog: 'سجل الحضور اليومي', dailyLogDesc: 'عرض وإدارة سجلات الحضور والانصراف اليومية',
    biometric: 'أجهزة البصمة', biometricDesc: 'إعداد أجهزة بصمة الأصبع والتعرف على الوجه',
    shifts: 'إدارة المناوبات', shiftsDesc: 'إنشاء وتعيين مناوبات العمل للموظفين',
    geofence: 'نطاقات الموقع', geofenceDesc: 'تحديد نطاقات جغرافية للحضور',
    mobile: 'الحضور عبر الجوال', mobileDesc: 'تسجيل الحضور عبر GPS من تطبيق الجوال',
  },
  leave: {
    title: 'إدارة الإجازات',
    desc: 'إدارة طلبات الإجازات والأرصدة والسياسات والصرف.',
    applications: 'طلبات الإجازات', applicationsDesc: 'تقديم واعتماد ورفض طلبات الإجازات',
    calendar: 'تقويم الإجازات', calendarDesc: 'عرض تقويمي لغياب الفريق',
    balances: 'أرصدة الإجازات', balancesDesc: 'تتبع رصيد الإجازات المتبقي لكل موظف',
    policies: 'سياسات الإجازات', policiesDesc: 'إعداد أنواع الإجازات وقواعد الاستحقاق والترحيل',
    encashment: 'صرف الإجازات', encashmentDesc: 'صرف قيمة الإجازات غير المستخدمة عند نهاية الخدمة',
  },
  payroll: {
    title: 'إدارة الرواتب',
    desc: 'معالجة الرواتب وإصدار كشوف المرتبات وإدارة هياكل الرواتب وتصدير ملفات حماية الأجور.',
    processing: 'معالجة الرواتب', processingDesc: 'حساب ومعالجة الرواتب الشهرية لجميع الموظفين',
    payslips: 'كشوف المرتبات', payslipsDesc: 'إصدار وتوزيع كشوف مرتبات الموظفين',
    salaryStructure: 'هيكل الرواتب', salaryStructureDesc: 'تحديد بنود الاستحقاقات والخصومات والبدلات',
    wps: 'تصدير حماية الأجور', wpsDesc: 'إنشاء ملفات نظام حماية الأجور للتحويل البنكي',
    revisions: 'مراجعات الرواتب', revisionsDesc: 'تتبع الزيادات والترقيات وتاريخ الرواتب',
  },
  documents: {
    title: 'إدارة المستندات',
    desc: 'تتبع مستندات الموظفين — جوازات السفر والتأشيرات ورخص العمل والإقامات ورخص القيادة.',
    passport: 'تتبع الجوازات', passportDesc: 'تتبع أرقام الجوازات وتواريخ الانتهاء وحالة الحفظ',
    visa: 'إدارة التأشيرات', visaDesc: 'متابعة أنواع التأشيرات والصلاحية ومواعيد التجديد',
    workPermit: 'رخص العمل', workPermitDesc: 'تتبع إصدار رخص العمل وانتهائها',
    residence: 'الإقامات', residenceDesc: 'إدارة تفاصيل الإقامة والتجديد',
    driving: 'رخص القيادة', drivingDesc: 'تتبع تفاصيل رخص قيادة الموظفين',
    alerts: 'تنبيهات الانتهاء', alertsDesc: 'إشعارات تلقائية للمستندات القريبة من الانتهاء',
  },
  contracts: {
    title: 'إدارة العقود',
    desc: 'إدارة عقود الموظفين — الإنشاء والتجديد والإنهاء والتاريخ.',
    active: 'العقود النشطة', activeDesc: 'عرض وإدارة عقود الموظفين الحالية',
    renewal: 'تجديد العقود', renewalDesc: 'تجديد العقود المنتهية بشروط محدثة',
    termination: 'إنهاء العقود', terminationDesc: 'معالجة إنهاء العقد والتسوية النهائية',
    history: 'تاريخ العقود', historyDesc: 'سجل كامل لجميع تغييرات العقود',
  },
  loans: {
    title: 'إدارة القروض',
    desc: 'معالجة قروض الموظفين — الطلب والاعتماد والاسترداد التلقائي من الراتب.',
    applications: 'طلبات القروض', applicationsDesc: 'طلبات قروض الموظفين بالنوع والمبلغ',
    approval: 'اعتماد القروض', approvalDesc: 'سير عمل اعتماد متعدد المستويات لطلبات القروض',
    recovery: 'جدول الاسترداد', recoveryDesc: 'خصم الأقساط الشهرية من الراتب',
    reports: 'تقارير القروض', reportsDesc: 'الأرصدة المستحقة وحالة الاسترداد',
  },
  eos: {
    title: 'نهاية الخدمة',
    desc: 'حساب ومعالجة مكافأة نهاية الخدمة وفقاً لنظام العمل السعودي المادتين 84-85.',
    calculator: 'حاسبة نهاية الخدمة', calculatorDesc: 'حساب مكافأة نهاية الخدمة وفقاً لنظام العمل السعودي',
    settlement: 'معالجة التسوية', settlementDesc: 'معالجة التسوية النهائية شاملة الإجازات والقروض والمكافأة',
    letter: 'خطاب التسوية', letterDesc: 'إصدار خطاب تسوية نهاية الخدمة الرسمي',
    provisions: 'مخصصات نهاية الخدمة', provisionsDesc: 'تتبع الاستحقاق الشهري لالتزام نهاية الخدمة',
  },
  insurance: {
    title: 'التأمينات والتأمين الاجتماعي',
    desc: 'إدارة اشتراكات التأمينات الاجتماعية والتأمين الطبي وتقارير الامتثال.',
    gosi: 'إدارة التأمينات', gosiDesc: 'حساب وتتبع اشتراكات المؤسسة العامة للتأمينات الاجتماعية',
    medical: 'التأمين الطبي', medicalDesc: 'إدارة وثائق التأمين الطبي والمطالبات',
    cards: 'بطاقات التأمين', cardsDesc: 'تتبع إصدار بطاقات التأمين وصلاحيتها',
    reports: 'تقارير التأمين', reportsDesc: 'تقارير الاشتراكات الشهرية وحالة الامتثال',
  },
  reportsPage: {
    title: 'التقارير',
    desc: 'إنشاء وتصدير تقارير الموارد البشرية — الموظفين والرواتب والحضور والامتثال.',
    employee: 'تقارير الموظفين', employeeDesc: 'عدد الموظفين ومعدل الدوران والتركيبة السكانية وتحليلات القوى العاملة',
    payroll: 'تقارير الرواتب', payrollDesc: 'ملخصات الرواتب وتكاليف الأقسام وتقارير حماية الأجور',
    attendance: 'تقارير الحضور', attendanceDesc: 'ملخص الحضور والعمل الإضافي والتأخير والغياب',
    export: 'مركز التصدير', exportDesc: 'تصدير أي تقرير إلى Excel أو PDF أو CSV',
  },
  settingsPage: {
    title: 'الإعدادات',
    desc: 'إدارة المستخدمين والأدوار والصلاحيات وإعدادات النظام.',
    users: 'إدارة المستخدمين', usersDesc: 'إنشاء وإدارة مستخدمي النظام ومستويات الوصول',
    roles: 'الأدوار والصلاحيات', rolesDesc: 'إعداد التحكم في الوصول المبني على الأدوار لجميع الوحدات',
    system: 'إعدادات النظام', systemDesc: 'معلومات الشركة والسنة المالية والعملة والتفضيلات',
    audit: 'سجل المراجعة', auditDesc: 'تتبع جميع إجراءات المستخدمين وتغييرات البيانات',
  },
  // Self-Service
  selfService: {
    dashboard: 'لوحتي', profile: 'ملفي الشخصي', payslips: 'كشوف مرتباتي',
    leave: 'إجازاتي', attendance: 'حضوري', documents: 'مستنداتي',
    leaveBalance: 'رصيد الإجازات', applyLeave: 'طلب إجازة', submitLeave: 'تقديم',
    annualLeaveBalance: 'رصيد الإجازة السنوية', pendingRequests: 'طلبات معلقة',
    lastPayslip: 'آخر كشف مرتبات', presentThisMonth: 'الحضور هذا الشهر',
    documentsExpiring: 'مستندات قاربت الانتهاء', within30Days: 'خلال 30 يوم',
    quickActions: 'إجراءات سريعة', noEmployeeLinked: 'لا يوجد موظف مرتبط بحسابك',
    contactHR: 'يرجى التواصل مع الموارد البشرية لربط سجل الموظف.',
    personalInfo: 'المعلومات الشخصية', employmentDetails: 'تفاصيل التوظيف',
    salaryInfo: 'معلومات الراتب', viewProfile: 'عرض البيانات الشخصية والوظيفية',
    applyForLeave: 'تقديم طلب إجازة جديد', viewPayslips: 'تحميل وعرض كشوف المرتبات',
    viewAttendance: 'عرض سجلات الحضور اليومية', viewDocuments: 'حالة جواز السفر والتأشيرة ورخصة العمل',
    checkBalance: 'التحقق من أرصدة جميع أنواع الإجازات',
  },

  // Notifications
  notifications: {
    title: 'الإشعارات', markAllRead: 'تعيين الكل كمقروء', noNotifications: 'لا توجد إشعارات',
    justNow: 'الآن', minutesAgo: 'منذ {n} دقيقة', hoursAgo: 'منذ {n} ساعة', daysAgo: 'منذ {n} يوم',
  },
};

export default ar;
