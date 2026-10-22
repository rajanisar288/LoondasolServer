// Standard Granular Permissions for WorkivLab Multi-Tenant Platform
export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ACTIVATE: 'users.activate',
  USERS_DEACTIVATE: 'users.deactivate',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',
  EMPLOYEES_SALARY_VIEW: 'employees.salary.view',
  EMPLOYEES_SALARY_UPDATE: 'employees.salary.update',

  // Departments
  DEPARTMENTS_VIEW: 'departments.view',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
  DEPARTMENTS_DELETE: 'departments.delete',

  // Roles & Permissions
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_ASSIGN: 'permissions.assign',

  // Leave Management
  LEAVE_VIEW: 'leave.view',
  LEAVE_CREATE: 'leave.create',
  LEAVE_UPDATE: 'leave.update',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_REJECT: 'leave.reject',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_UPDATE: 'attendance.update',

  // Payroll / Salary
  SALARY_VIEW: 'salary.view',
  SALARY_CREATE: 'salary.create',
  SALARY_UPDATE: 'salary.update',

  // Tasks & Projects
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',

  // Chat & Messaging
  MESSAGES_VIEW: 'messages.view',
  MESSAGES_CREATE: 'messages.create',
  CHANNELS_CREATE: 'channels.create',
  CHANNELS_MANAGE: 'channels.manage',

  // Video Meetings
  MEETINGS_VIEW: 'meetings.view',
  MEETINGS_CREATE: 'meetings.create',
  MEETINGS_UPDATE: 'meetings.update',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_GENERATE: 'reports.generate',
  REPORTS_EMPLOYEE_VIEW: 'reports.employee.view',
  REPORTS_EMPLOYEE_GENERATE: 'reports.employee.generate',

  // Email Campaigns
  EMAIL_CAMPAIGNS_VIEW: 'email_campaigns.view',
  EMAIL_CAMPAIGNS_CREATE: 'email_campaigns.create',
  EMAIL_CAMPAIGNS_UPDATE: 'email_campaigns.update',
  EMAIL_CAMPAIGNS_SEND: 'email_campaigns.send',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications.view',

  // Company Settings
  COMPANY_SETTINGS_VIEW: 'company.settings.view',
  COMPANY_SETTINGS_UPDATE: 'company.settings.update',

  // Branches
  BRANCHES_VIEW: 'branches.view',
  BRANCHES_CREATE: 'branches.create',
  BRANCHES_UPDATE: 'branches.update',
  BRANCHES_DELETE: 'branches.delete',

  // AI Tools
  AI_TOOLS_USE: 'ai.tools.use',

  // Payroll
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_GENERATE: 'payroll.generate',
  PAYROLL_UPDATE: 'payroll.update',

  // Resignations
  RESIGNATIONS_VIEW: 'resignations.view',
  RESIGNATIONS_SUBMIT: 'resignations.submit',
  RESIGNATIONS_APPROVE: 'resignations.approve',

  // Expenses
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_DELETE: 'expenses.delete',

  // Marketing Posts
  MARKETING_POSTS_VIEW: 'marketing.posts.view',
  MARKETING_POSTS_CREATE: 'marketing.posts.create',
  MARKETING_POSTS_DELETE: 'marketing.posts.delete',

  // Personal Todos
  TODOS_VIEW: 'todos.view',
  TODOS_MANAGE: 'todos.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);
