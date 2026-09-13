import { 
  User, 
  Task, 
  TaskAssignee, 
  TaskActivity, 
  Notification, 
  AuditLog, 
  EmailLog, 
  DepartmentKpis, 
  FacultyWorkloadStats,
  TaskStatus,
  TaskPriority,
  ActivityAction,
  NotificationType
} from '@/types';
import { 
  SEED_USERS, 
  SEED_TASKS, 
  SEED_TASK_ASSIGNEES, 
  SEED_ACTIVITIES, 
  SEED_NOTIFICATIONS, 
  SEED_AUDIT_LOGS 
} from './seedData';
import { db, isFirebaseConfigured } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';


// In-Memory/Storage Cache for reactive state
class MemoryStore {
  private users: User[] = [...SEED_USERS];
  private tasks: Task[] = [...SEED_TASKS];
  private assignees: TaskAssignee[] = [...SEED_TASK_ASSIGNEES];
  private activities: TaskActivity[] = [...SEED_ACTIVITIES];
  private notifications: Notification[] = [...SEED_NOTIFICATIONS];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];
  private emailLogs: EmailLog[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedTasks = localStorage.getItem('academiq_tasks_v2');
        if (storedTasks) this.tasks = JSON.parse(storedTasks);

        const storedAssignees = localStorage.getItem('academiq_assignees_v2');
        if (storedAssignees) this.assignees = JSON.parse(storedAssignees);

        const storedActivities = localStorage.getItem('academiq_activities_v2');
        if (storedActivities) this.activities = JSON.parse(storedActivities);

        const storedNotifs = localStorage.getItem('academiq_notifs_v2');
        if (storedNotifs) this.notifications = JSON.parse(storedNotifs);

        const storedAudit = localStorage.getItem('academiq_audit_v2');
        if (storedAudit) this.auditLogs = JSON.parse(storedAudit);
      } catch (e) {
        console.error('Storage parse error:', e);
      }
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('academiq_tasks_v2', JSON.stringify(this.tasks));
        localStorage.setItem('academiq_assignees_v2', JSON.stringify(this.assignees));
        localStorage.setItem('academiq_activities_v2', JSON.stringify(this.activities));
        localStorage.setItem('academiq_notifs_v2', JSON.stringify(this.notifications));
        localStorage.setItem('academiq_audit_v2', JSON.stringify(this.auditLogs));
      } catch (e) {
        console.error('Storage persist error:', e);
      }
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public resetToDefaults() {
    this.users = [...SEED_USERS];
    this.tasks = [...SEED_TASKS];
    this.assignees = [...SEED_TASK_ASSIGNEES];
    this.activities = [...SEED_ACTIVITIES];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.auditLogs = [...SEED_AUDIT_LOGS];
    this.emailLogs = [];
    this.persist();
  }

  // Users
  getUsers(): User[] {
    return this.users;
  }

  getUser(id: string): User | undefined {
    return this.users.find((u) => u.id === id || u.email === id || u.kluid.toLowerCase() === id.toLowerCase());
  }

  // Tasks with relations
  getTasks(): Task[] {
    return this.tasks.map((task) => {
      const taskAssigneeRecords = this.assignees.filter((a) => a.taskId === task.id);
      const assigneeIds = taskAssigneeRecords.map((a) => a.userId);
      const assignees = this.users.filter((u) => assigneeIds.includes(u.id));
      const createdBy = this.users.find((u) => u.id === task.createdById);
      return {
        ...task,
        assigneeIds,
        assignees,
        createdBy,
      };
    });
  }

  getTask(id: string): Task | undefined {
    return this.getTasks().find((t) => t.id === id);
  }

  createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, assigneeUserIds: string[], creator: User): Task {
    const taskId = 'task_' + Date.now();
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: taskId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      assigneeIds: assigneeUserIds,
    };

    this.tasks.unshift(newTask);

    // Add assignees
    assigneeUserIds.forEach((uid) => {
      this.assignees.push({
        id: `asgn_${taskId}_${uid}`,
        taskId,
        userId: uid,
        createdAt: now,
      });

      // Add notification for faculty
      this.notifications.unshift({
        id: `notif_${Date.now()}_${uid}`,
        userId: uid,
        taskId,
        type: 'TASK_ASSIGNED',
        title: `New Assignment: ${data.title}`,
        message: `${creator.name} assigned you a ${data.priority} priority task due ${new Date(data.dueDate).toLocaleDateString()}.`,
        read: false,
        createdAt: now,
      });
    });

    // Add Activity
    const assigneeNames = this.users
      .filter((u) => assigneeUserIds.includes(u.id))
      .map((u) => u.name)
      .join(', ');

    this.activities.unshift({
      id: 'act_' + Date.now(),
      taskId,
      userId: creator.id,
      userName: creator.name,
      userRole: creator.role,
      action: 'TASK_CREATED',
      description: `Task created and assigned to ${assigneeNames}`,
      createdAt: now,
    });

    // Log Audit
    this.auditLogs.unshift({
      id: 'audit_' + Date.now(),
      userId: creator.id,
      userName: creator.name,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: taskId,
      details: { title: data.title, priority: data.priority, assignees: assigneeUserIds },
      createdAt: now,
    });

    this.persist();

    // Sync new task to Firestore
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'tasks', taskId), newTask).catch((e) => {
        console.warn('Firestore createTask error:', e);
      });
    }

    return this.getTask(taskId)!;
  }

  updateTaskStatus(taskId: string, status: TaskStatus, actor: User, comment?: string): Task | null {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    const now = new Date().toISOString();

    let action: ActivityAction = 'TASK_STARTED';
    let activityDesc = `${actor.name} updated status to ${status.replace('_', ' ')}`;

    const updates: Partial<Task> = {
      status,
      updatedAt: now,
    };

    if (status === 'IN_PROGRESS') {
      action = 'TASK_STARTED';
      activityDesc = `${actor.name} started working on this task`;
    } else if (status === 'SUBMITTED') {
      action = 'TASK_SUBMITTED';
      updates.submittedAt = now;
      updates.submittedBy = actor.id;
      activityDesc = `${actor.name} submitted completed work to Google Drive`;

      // Notify HOD
      const hod = this.users.find((u) => u.role === 'ADMIN');
      if (hod) {
        this.notifications.unshift({
          id: `notif_${Date.now()}_${hod.id}`,
          userId: hod.id,
          taskId,
          type: 'SUBMISSION_RECEIVED',
          title: `Submission Received: ${task.title}`,
          message: `${actor.name} has submitted work for review.`,
          read: false,
          createdAt: now,
        });
      }
    } else if (status === 'REVISION_REQUIRED') {
      action = 'REVISION_REQUESTED';
      updates.revisionComment = comment || 'Please review requirements and update submission.';
      activityDesc = `HOD requested revision: ${updates.revisionComment}`;

      // Notify all assignees
      const taskAssigneeRecords = this.assignees.filter((a) => a.taskId === taskId);
      taskAssigneeRecords.forEach((a) => {
        this.notifications.unshift({
          id: `notif_${Date.now()}_${a.userId}`,
          userId: a.userId,
          taskId,
          type: 'REVISION_REQUESTED',
          title: `Revision Requested: ${task.title}`,
          message: `HOD commented: ${updates.revisionComment}`,
          read: false,
          createdAt: now,
        });
      });
    } else if (status === 'COMPLETED') {
      action = 'TASK_COMPLETED';
      updates.completedAt = now;
      activityDesc = `${actor.name} verified submission and marked task completed`;

      // Notify assignees
      const taskAssigneeRecords = this.assignees.filter((a) => a.taskId === taskId);
      taskAssigneeRecords.forEach((a) => {
        this.notifications.unshift({
          id: `notif_${Date.now()}_${a.userId}`,
          userId: a.userId,
          taskId,
          type: 'TASK_COMPLETED',
          title: `Task Approved: ${task.title}`,
          message: `Your submitted work was verified and marked as Completed by HOD.`,
          read: false,
          createdAt: now,
        });
      });
    }

    this.tasks[taskIndex] = { ...task, ...updates };

    // Record activity
    this.activities.unshift({
      id: 'act_' + Date.now(),
      taskId,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      description: activityDesc,
      createdAt: now,
    });

    // Record audit log
    this.auditLogs.unshift({
      id: 'audit_' + Date.now(),
      userId: actor.id,
      userName: actor.name,
      action: `TASK_STATUS_${status}`,
      entity: 'Task',
      entityId: taskId,
      details: { title: task.title, status, comment },
      createdAt: now,
    });

    this.persist();

    // Sync status to Firestore
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'tasks', taskId), { ...task, ...updates }, { merge: true }).catch((e) => {
        console.warn('Firestore updateTaskStatus error:', e);
      });
    }

    return this.getTask(taskId)!;
  }

  updateTask(taskId: string, updates: Partial<Task>, actor?: User): Task | null {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.tasks[taskIndex];
    const now = new Date().toISOString();

    this.tasks[taskIndex] = {
      ...task,
      ...updates,
      updatedAt: now,
    };

    if (actor) {
      this.auditLogs.unshift({
        id: 'audit_' + Date.now(),
        userId: actor.id,
        userName: actor.name,
        action: 'TASK_UPDATED',
        entity: 'Task',
        entityId: taskId,
        details: { updates },
        createdAt: now,
      });
    }

    this.persist();

    // Sync update to Firestore
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'tasks', taskId), { ...task, ...updates }, { merge: true }).catch((e) => {
        console.warn('Firestore updateTask error:', e);
      });
    }

    return this.getTask(taskId)!;
  }

  deleteTask(taskId: string, actor: User): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.assignees = this.assignees.filter((a) => a.taskId !== taskId);
    this.activities = this.activities.filter((a) => a.taskId !== taskId);

    // Audit log
    this.auditLogs.unshift({
      id: 'audit_' + Date.now(),
      userId: actor.id,
      userName: actor.name,
      action: 'TASK_DELETED',
      entity: 'Task',
      entityId: taskId,
      details: { title: task.title, deletedBy: actor.name },
      createdAt: new Date().toISOString(),
    });

    this.persist();

    // Delete from Firestore
    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'tasks', taskId)).catch((e) => {
        console.warn('Firestore deleteTask error:', e);
      });
    }

    return true;
  }

  getActivities(taskId: string): TaskActivity[] {
    return this.activities.filter((a) => a.taskId === taskId);
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  markNotificationRead(notificationId: string): void {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
      this.persist();
    }
  }

  markAllNotificationsRead(userId: string): void {
    this.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    this.persist();
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  logEmail(emailLog: Omit<EmailLog, 'id'>): void {
    this.emailLogs.unshift({
      ...emailLog,
      id: 'email_' + Date.now(),
    });
  }

  getEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }
}

export const memoryStore = new MemoryStore();

// Overdue helper
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'COMPLETED' || task.status === 'SUBMITTED') {
    return false;
  }
  return new Date(task.dueDate).getTime() < new Date().getTime();
}

export function isTaskDueSoon(task: Task): boolean {
  if (task.status === 'COMPLETED' || task.status === 'SUBMITTED') return false;
  const now = new Date().getTime();
  const due = new Date(task.dueDate).getTime();
  const diffHours = (due - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 48;
}

export function formatDueDateRelative(dueDateStr: string, isCompleted: boolean): { text: string; isOverdue: boolean } {
  if (isCompleted) {
    return { text: new Date(dueDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), isOverdue: false };
  }

  const now = new Date();
  const due = new Date(dueDateStr);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOver = Math.abs(diffDays);
    return { text: `${daysOver} ${daysOver === 1 ? 'day' : 'days'} overdue`, isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false };
  }
  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false };
  }
  if (diffDays <= 7) {
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  }
  return { text: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), isOverdue: false };
}

export function getDepartmentKpis(tasks: Task[]): DepartmentKpis {
  const totalTasks = tasks.length;
  let pending = 0;
  let inProgress = 0;
  let submitted = 0;
  let underReview = 0;
  let completed = 0;
  let overdue = 0;
  let highPriorityCount = 0;
  let mediumPriorityCount = 0;
  let lowPriorityCount = 0;

  tasks.forEach((t) => {
    if (t.priority === 'HIGH') highPriorityCount++;
    else if (t.priority === 'MEDIUM') mediumPriorityCount++;
    else if (t.priority === 'LOW') lowPriorityCount++;

    if (t.status === 'PENDING') pending++;
    else if (t.status === 'IN_PROGRESS' || t.status === 'REVISION_REQUIRED') inProgress++;
    else if (t.status === 'SUBMITTED') submitted++;
    else if (t.status === 'UNDER_REVIEW') underReview++;
    else if (t.status === 'COMPLETED') completed++;

    if (isTaskOverdue(t)) overdue++;
  });

  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  return {
    totalTasks,
    pending,
    inProgress,
    submitted,
    underReview,
    completed,
    overdue,
    completionRate,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
  };
}

export function getFacultyWorkload(faculty: User, tasks: Task[]): FacultyWorkloadStats {
  const assignedTasks = tasks.filter((t) => t.assigneeIds?.includes(faculty.id));
  const totalAssigned = assignedTasks.length;

  let pending = 0;
  let inProgress = 0;
  let submitted = 0;
  let completed = 0;
  let overdue = 0;

  assignedTasks.forEach((t) => {
    if (t.status === 'PENDING') pending++;
    else if (t.status === 'IN_PROGRESS' || t.status === 'REVISION_REQUIRED') inProgress++;
    else if (t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW') submitted++;
    else if (t.status === 'COMPLETED') completed++;

    if (isTaskOverdue(t)) overdue++;
  });

  const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

  return {
    faculty,
    totalAssigned,
    pending,
    inProgress,
    submitted,
    completed,
    overdue,
    completionRate,
  };
}

/**
 * Looks up user in Firestore by email or local seed records.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();

  if (isFirebaseConfigured && db) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', normalized));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docData = snap.docs[0].data() as User;
        return { ...docData, id: snap.docs[0].id };
      }
    } catch (err) {
      console.warn('Firestore getUserByEmail error:', err);
    }
  }

  // Check in-memory/seeded users
  const localMatch = memoryStore.getUsers().find((u) => u.email.toLowerCase() === normalized);
  return localMatch || null;
}

/**
 * Seeds initial official EEE faculty roster into Firestore if empty
 */
export async function seedInitialUsersToFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);

    if (snap.empty) {
      for (const user of SEED_USERS) {
        await setDoc(doc(db, 'users', user.id), user);
      }
      console.log('Seeded official EEE faculty roster to Firestore successfully.');
    }
  } catch (err) {
    console.warn('Note on Firestore user seeding:', err);
  }
}

