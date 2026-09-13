export type UserRole = 'ADMIN' | 'FACULTY';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'COMPLETED' 
  | 'REVISION_REQUIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  mobile: string;
  kluid: string;
  eduid: string;
  designation: string;
  role: UserRole;
  departmentId: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hodId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO String
  driveUrl: string; // Google Drive folder url
  createdById: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  submittedBy?: string;
  completedAt?: string;
  revisionComment?: string;
  // Populated fields for UI convenience
  assignees?: User[];
  assigneeIds?: string[];
  createdBy?: User;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  createdAt: string;
}

export type ActivityAction = 
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_STARTED'
  | 'TASK_SUBMITTED'
  | 'TASK_REVIEWED'
  | 'REVISION_REQUESTED'
  | 'TASK_COMPLETED'
  | 'TASK_REOPENED';

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  userRole?: UserRole;
  action: ActivityAction;
  description: string;
  createdAt: string;
}

export type NotificationType = 
  | 'TASK_ASSIGNED'
  | 'STATUS_CHANGE'
  | 'REVISION_REQUESTED'
  | 'SUBMISSION_RECEIVED'
  | 'TASK_COMPLETED'
  | 'REMINDER';

export interface Notification {
  id: string;
  userId: string;
  taskId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  taskId?: string;
  eventType: string;
  type?: string; // alias for backwards compatibility
  recipient: string;
  sender: string;
  timestamp: string;
  sentAt?: string; // alias for backwards compatibility
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  errorMessage?: string;
  error?: string; // alias for backwards compatibility
  messageId?: string;
}

export interface GmailIntegrationConfig {
  connected: boolean;
  senderEmail: string;
  connectedAt?: string;
  provider: string;
  scope: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface FacultyWorkloadStats {
  faculty: User;
  totalAssigned: number;
  pending: number;
  inProgress: number;
  submitted: number;
  completed: number;
  overdue: number;
  completionRate: number; // percentage 0-100
}

export interface DepartmentKpis {
  totalTasks: number;
  pending: number;
  inProgress: number;
  submitted: number;
  underReview: number;
  completed: number;
  overdue: number;
  completionRate: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}
