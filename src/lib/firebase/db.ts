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


/**
 * Recursively sanitizes objects for Firestore by omitting `undefined` properties
 * while safely preserving Date, Timestamp, DocumentReference, FieldValue, and primitives.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Preserve Date instances
  if (data instanceof Date) {
    return data;
  }

  // Preserve Firestore Timestamp, FieldValue, DocumentReference, GeoPoint
  if (
    typeof data === 'object' &&
    ('toMillis' in data || 'toDate' in data || '_methodName' in data || 'isEqual' in data || 'latitude' in data)
  ) {
    return data;
  }

  // Handle Arrays recursively
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  // Handle plain objects recursively
  if (typeof data === 'object' && data.constructor && data.constructor.name === 'Object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }

  return data;
}

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
  private isFirestoreInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = localStorage.getItem('academiq_users_custom_pwd');
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge parsed with SEED_USERS so user_hodeee is ALWAYS present as ADMIN and user_klu1043 as FACULTY
            const userMap = new Map<string, User>();
            SEED_USERS.forEach((su) => userMap.set(su.id, su));
            parsed.forEach((pu: User) => {
              if (pu && pu.id) {
                const existing = userMap.get(pu.id);
                if (existing) {
                  userMap.set(pu.id, {
                    ...existing,
                    password: pu.password || existing.password,
                    mobile: pu.mobile || existing.mobile,
                  });
                } else if (pu.id !== 'user_hodeee') {
                  userMap.set(pu.id, pu);
                }
              }
            });
            this.users = Array.from(userMap.values());
          }
        }

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

        const storedEmails = localStorage.getItem('academiq_email_logs_v2');
        if (storedEmails) this.emailLogs = JSON.parse(storedEmails);
      } catch (e) {
        console.error('Storage parse error:', e);
      }

      // Initialize real-time Cloud Firestore synchronization
      this.initFirestoreListeners();
    }
  }

  public async pullCloudSync() {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          const remoteData = json.data;

          if (Array.isArray(remoteData.tasks) && remoteData.tasks.length > 0) {
            const taskMap = new Map<string, Task>();
            // Keep existing
            this.tasks.forEach((t) => taskMap.set(t.id, t));
            // Merge remote
            remoteData.tasks.forEach((t: Task) => {
              if (t && t.id) taskMap.set(t.id, t);
            });
            const merged = Array.from(taskMap.values());
            merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.tasks = merged;

            // Rebuild assignees
            const newAssignees: TaskAssignee[] = [];
            merged.forEach((t) => {
              t.assigneeIds?.forEach((uid) => {
                newAssignees.push({
                  id: `asgn_${t.id}_${uid}`,
                  taskId: t.id,
                  userId: uid,
                  createdAt: t.createdAt || new Date().toISOString(),
                });
              });
            });
            this.assignees = newAssignees;
          }

          if (Array.isArray(remoteData.users) && remoteData.users.length > 0) {
            const userMap = new Map<string, User>();
            SEED_USERS.forEach((su) => userMap.set(su.id, su));
            remoteData.users.forEach((ru: User) => {
              if (ru && ru.id) {
                const existing = userMap.get(ru.id);
                if (existing) {
                  userMap.set(ru.id, { ...existing, password: ru.password || existing.password, mobile: ru.mobile || existing.mobile });
                } else {
                  userMap.set(ru.id, ru);
                }
              }
            });
            this.users = Array.from(userMap.values());
          }

          if (Array.isArray(remoteData.activities) && remoteData.activities.length > 0) {
            const actMap = new Map<string, TaskActivity>();
            this.activities.forEach((a) => actMap.set(a.id, a));
            remoteData.activities.forEach((a: TaskActivity) => {
              if (a && a.id) actMap.set(a.id, a);
            });
            const mergedAct = Array.from(actMap.values());
            mergedAct.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.activities = mergedAct;
          }

          if (Array.isArray(remoteData.notifications) && remoteData.notifications.length > 0) {
            const notifMap = new Map<string, Notification>();
            this.notifications.forEach((n) => notifMap.set(n.id, n));
            remoteData.notifications.forEach((n: Notification) => {
              if (n && n.id) notifMap.set(n.id, n);
            });
            const mergedNotifs = Array.from(notifMap.values());
            mergedNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.notifications = mergedNotifs;
          }

          this.persist();
        }
      }
    } catch (e) {
      // Non-blocking sync attempt
    }
  }

  public initFirestoreListeners() {
    if (typeof window === 'undefined' || this.isFirestoreInitialized) return;
    this.isFirestoreInitialized = true;

    // 1. Immediate Cloud Sync pull from /api/sync
    this.pullCloudSync();

    // 2. Set periodic background cloud sync polling & visibility hooks
    if (typeof window !== 'undefined') {
      setInterval(() => this.pullCloudSync(), 6000);
      window.addEventListener('focus', () => this.pullCloudSync());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.pullCloudSync();
      });
    }

    if (!isFirebaseConfigured || !db) return;

    try {
      // Tasks initial fetch & real-time sync
      getDocs(collection(db, 'tasks')).then((snapshot) => {
        const remoteMap = new Map<string, Task>();
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Task;
            remoteMap.set(docSnap.id, { ...data, id: docSnap.id });
          });
        }

        this.tasks.forEach((lt) => {
          if (!remoteMap.has(lt.id)) {
            remoteMap.set(lt.id, lt);
            if (db) {
              setDoc(doc(db, 'tasks', lt.id), sanitizeForFirestore(lt)).catch(() => {});
            }
          }
        });

        const mergedTasks = Array.from(remoteMap.values());
        mergedTasks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        this.tasks = mergedTasks;

        const newAssignees: TaskAssignee[] = [];
        mergedTasks.forEach((t) => {
          t.assigneeIds?.forEach((uid) => {
            newAssignees.push({
              id: `asgn_${t.id}_${uid}`,
              taskId: t.id,
              userId: uid,
              createdAt: t.createdAt || new Date().toISOString(),
            });
          });
        });
        this.assignees = newAssignees;
        this.persist();
      }).catch(() => {});

      onSnapshot(
        collection(db, 'tasks'),
        (snapshot) => {
          const remoteMap = new Map<string, Task>();
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Task;
              remoteMap.set(docSnap.id, { ...data, id: docSnap.id });
            });
          }

          this.tasks.forEach((lt) => {
            if (!remoteMap.has(lt.id)) {
              remoteMap.set(lt.id, lt);
              if (db) {
                setDoc(doc(db, 'tasks', lt.id), sanitizeForFirestore(lt)).catch(() => {});
              }
            }
          });

          const mergedTasks = Array.from(remoteMap.values());
          mergedTasks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          this.tasks = mergedTasks;

          const newAssignees: TaskAssignee[] = [];
          mergedTasks.forEach((t) => {
            t.assigneeIds?.forEach((uid) => {
              newAssignees.push({
                id: `asgn_${t.id}_${uid}`,
                taskId: t.id,
                userId: uid,
                createdAt: t.createdAt || new Date().toISOString(),
              });
            });
          });
          this.assignees = newAssignees;
          this.persist();
        },
        (err) => console.warn('Tasks onSnapshot note:', err)
      );

      // Users initial fetch & real-time sync
      getDocs(collection(db, 'users')).then((snapshot) => {
        if (!snapshot.empty) {
          const remoteMap = new Map<string, User>();
          snapshot.forEach((docSnap) => {
            const uData = docSnap.data() as User;
            remoteMap.set(docSnap.id, { ...uData, id: docSnap.id });
          });

          SEED_USERS.forEach((su) => {
            const existing = remoteMap.get(su.id);
            if (!existing) {
              remoteMap.set(su.id, su);
              if (db) setDoc(doc(db, 'users', su.id), sanitizeForFirestore(su)).catch(() => {});
            }
          });

          this.users = Array.from(remoteMap.values());
          this.notify();
        }
      }).catch(() => {});

      onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMap = new Map<string, User>();
            snapshot.forEach((docSnap) => {
              const uData = docSnap.data() as User;
              remoteMap.set(docSnap.id, { ...uData, id: docSnap.id });
            });

            SEED_USERS.forEach((su) => {
              if (!remoteMap.has(su.id)) {
                remoteMap.set(su.id, su);
                if (db) setDoc(doc(db, 'users', su.id), sanitizeForFirestore(su)).catch(() => {});
              }
            });

            this.users = Array.from(remoteMap.values());
            this.notify();
          }
        },
        (err) => console.warn('Users onSnapshot note:', err)
      );

      // Activities initial fetch & real-time sync
      getDocs(collection(db, 'activities')).then((snapshot) => {
        if (!snapshot.empty) {
          const remoteActivities: TaskActivity[] = [];
          snapshot.forEach((docSnap) => {
            remoteActivities.push({ ...(docSnap.data() as TaskActivity), id: docSnap.id });
          });
          remoteActivities.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          this.activities = remoteActivities;
          this.persist();
        }
      }).catch(() => {});

      onSnapshot(
        collection(db, 'activities'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteActivities: TaskActivity[] = [];
            snapshot.forEach((docSnap) => {
              remoteActivities.push({ ...(docSnap.data() as TaskActivity), id: docSnap.id });
            });
            remoteActivities.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.activities = remoteActivities;
            this.persist();
          }
        },
        () => {}
      );

      // Notifications initial fetch & real-time sync
      getDocs(collection(db, 'notifications')).then((snapshot) => {
        if (!snapshot.empty) {
          const remoteNotifs: Notification[] = [];
          snapshot.forEach((docSnap) => {
            remoteNotifs.push({ ...(docSnap.data() as Notification), id: docSnap.id });
          });
          remoteNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          this.notifications = remoteNotifs;
          this.persist();
        }
      }).catch(() => {});

      onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteNotifs: Notification[] = [];
            snapshot.forEach((docSnap) => {
              remoteNotifs.push({ ...(docSnap.data() as Notification), id: docSnap.id });
            });
            remoteNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.notifications = remoteNotifs;
            this.persist();
          }
        },
        () => {}
      );

      // Audit logs real-time sync
      onSnapshot(
        collection(db, 'audit_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteLogs: AuditLog[] = [];
            snapshot.forEach((docSnap) => {
              remoteLogs.push({ ...(docSnap.data() as AuditLog), id: docSnap.id });
            });
            remoteLogs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            this.auditLogs = remoteLogs;
            this.persist();
          }
        },
        () => {}
      );
    } catch (err) {
      console.warn('Error establishing Firestore snapshot listeners:', err);
    }
  }

  public updateUserPassword(userId: string, newPassword: string): boolean {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return false;

    this.users[userIndex] = {
      ...this.users[userIndex],
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('academiq_users_custom_pwd', JSON.stringify(this.users));
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'UPDATE_PASSWORD', userId, newPassword }),
      }).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'users', userId), sanitizeForFirestore({ password: newPassword }), { merge: true }).catch((e) => {
        console.warn('Firestore password update error:', e);
      });
    }

    this.notify();
    return true;
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('academiq_tasks_v2', JSON.stringify(this.tasks));
        localStorage.setItem('academiq_assignees_v2', JSON.stringify(this.assignees));
        localStorage.setItem('academiq_activities_v2', JSON.stringify(this.activities));
        localStorage.setItem('academiq_notifs_v2', JSON.stringify(this.notifications));
        localStorage.setItem('academiq_audit_v2', JSON.stringify(this.auditLogs));
        localStorage.setItem('academiq_email_logs_v2', JSON.stringify(this.emailLogs));
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
    const clean = (id || '').trim().toLowerCase();
    if (!clean) return undefined;

    // Admin / HOD aliases
    if (
      clean === 'user_hodeee' ||
      clean === 'hodeee@klu.ac.in' ||
      clean === 'hodee@klu.ac.in' ||
      clean === 'hodeee' ||
      clean === 'hodee' ||
      clean === 'admin' ||
      clean === 'hod' ||
      clean === 'kvkhod'
    ) {
      return this.users.find((u) => u.id === 'user_hodeee' || u.role === 'ADMIN');
    }

    // Dr. K. Vijayakumar (Faculty) aliases
    if (
      clean === 'user_klu1043' ||
      clean === 'k.vijayakumar@klu.ac.in' ||
      clean === 'klu1043' ||
      clean === '1043' ||
      clean === 'kvkeee'
    ) {
      return this.users.find((u) => u.id === 'user_klu1043' || u.kluid.toLowerCase() === 'klu1043');
    }

    // Direct and numeric / KLU ID matches
    return this.users.find((u) => {
      const uEmail = u.email.toLowerCase();
      const uKlu = u.kluid.toLowerCase();
      const uId = u.id.toLowerCase();
      const uEdu = (u.eduid || '').toLowerCase();
      return (
        uId === clean ||
        uEmail === clean ||
        uKlu === clean ||
        uKlu === `klu${clean}` ||
        (clean.startsWith('klu') && uKlu === clean.replace(/^klu/, '')) ||
        uEdu === clean
      );
    });
  }

  // Tasks with relations
  getTasks(): Task[] {
    return this.tasks.map((task) => {
      const taskAssigneeRecords = this.assignees.filter((a) => a.taskId === task.id);
      const recordAssigneeIds = taskAssigneeRecords.map((a) => a.userId);
      const assigneeIds = recordAssigneeIds.length > 0 ? recordAssigneeIds : (task.assigneeIds || []);
      
      const assignees = this.users.filter((u) => 
        assigneeIds.some((id) => {
          const clean = (id || '').trim().toLowerCase();
          return (
            clean === u.id.toLowerCase() ||
            clean === u.email.toLowerCase() ||
            clean === u.kluid.toLowerCase()
          );
        })
      );
      const createdBy = this.users.find((u) => u.id === task.createdById || u.email.toLowerCase() === (task.createdById || '').toLowerCase());
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

    // Add assignees and notifications
    const newNotifs: Notification[] = [];
    assigneeUserIds.forEach((uid) => {
      this.assignees.push({
        id: `asgn_${taskId}_${uid}`,
        taskId,
        userId: uid,
        createdAt: now,
      });

      // Add notification for faculty
      const notifItem: Notification = {
        id: `notif_${Date.now()}_${uid}`,
        userId: uid,
        taskId,
        type: 'TASK_ASSIGNED',
        title: `New Assignment: ${data.title}`,
        message: `${creator.name} assigned you a ${data.priority} priority task due ${new Date(data.dueDate).toLocaleDateString()}.`,
        read: false,
        createdAt: now,
      };
      this.notifications.unshift(notifItem);
      newNotifs.push(notifItem);
    });

    // Add Activity
    const assigneeNames = this.users
      .filter((u) => assigneeUserIds.includes(u.id))
      .map((u) => u.name)
      .join(', ');

    const newActivity: TaskActivity = {
      id: 'act_' + Date.now(),
      taskId,
      userId: creator.id,
      userName: creator.name,
      userRole: creator.role,
      action: 'TASK_CREATED',
      description: `Task created and assigned to ${assigneeNames}`,
      createdAt: now,
    };
    this.activities.unshift(newActivity);

    // Log Audit
    const newAuditLog: AuditLog = {
      id: 'audit_' + Date.now(),
      userId: creator.id,
      userName: creator.name,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: taskId,
      details: { title: data.title, priority: data.priority, assignees: assigneeUserIds },
      createdAt: now,
    };
    this.auditLogs.unshift(newAuditLog);

    this.persist();

    // 1. Sync to Next.js universal /api/sync relay
    if (typeof window !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CREATE_TASK',
          task: newTask,
          actor: creator,
        }),
      }).catch(() => {});
    }

    // 2. Sync all new records directly to Firestore
    if (isFirebaseConfigured && db) {
      const firestoreDb = db;
      setDoc(doc(firestoreDb, 'tasks', taskId), sanitizeForFirestore(newTask)).catch(() => {});
      setDoc(doc(firestoreDb, 'activities', newActivity.id), sanitizeForFirestore(newActivity)).catch(() => {});
      setDoc(doc(firestoreDb, 'audit_logs', newAuditLog.id), sanitizeForFirestore(newAuditLog)).catch(() => {});
      newNotifs.forEach((n) => {
        setDoc(doc(firestoreDb, 'notifications', n.id), sanitizeForFirestore(n)).catch(() => {});
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

    const newNotifs: Notification[] = [];

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
        const notif: Notification = {
          id: `notif_${Date.now()}_${hod.id}`,
          userId: hod.id,
          taskId,
          type: 'SUBMISSION_RECEIVED',
          title: `Submission Received: ${task.title}`,
          message: `${actor.name} has submitted work for review.`,
          read: false,
          createdAt: now,
        };
        this.notifications.unshift(notif);
        newNotifs.push(notif);
      }
    } else if (status === 'REVISION_REQUIRED') {
      action = 'REVISION_REQUESTED';
      updates.revisionComment = comment || 'Please review requirements and update submission.';
      activityDesc = `HOD requested revision: ${updates.revisionComment}`;

      // Notify all assignees
      const taskAssigneeRecords = this.assignees.filter((a) => a.taskId === taskId);
      taskAssigneeRecords.forEach((a) => {
        const notif: Notification = {
          id: `notif_${Date.now()}_${a.userId}`,
          userId: a.userId,
          taskId,
          type: 'REVISION_REQUESTED',
          title: `Revision Requested: ${task.title}`,
          message: `HOD commented: ${updates.revisionComment}`,
          read: false,
          createdAt: now,
        };
        this.notifications.unshift(notif);
        newNotifs.push(notif);
      });
    } else if (status === 'COMPLETED') {
      action = 'TASK_COMPLETED';
      updates.completedAt = now;
      activityDesc = `${actor.name} verified submission and marked task completed`;

      // Notify assignees
      const taskAssigneeRecords = this.assignees.filter((a) => a.taskId === taskId);
      taskAssigneeRecords.forEach((a) => {
        const notif: Notification = {
          id: `notif_${Date.now()}_${a.userId}`,
          userId: a.userId,
          taskId,
          type: 'TASK_COMPLETED',
          title: `Task Approved: ${task.title}`,
          message: `Your submitted work was verified and marked as Completed by HOD.`,
          read: false,
          createdAt: now,
        };
        this.notifications.unshift(notif);
        newNotifs.push(notif);
      });
    }

    this.tasks[taskIndex] = { ...task, ...updates };

    // Record activity
    const newActivity: TaskActivity = {
      id: 'act_' + Date.now(),
      taskId,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      description: activityDesc,
      createdAt: now,
    };
    this.activities.unshift(newActivity);

    // Record audit log
    const newAuditLog: AuditLog = {
      id: 'audit_' + Date.now(),
      userId: actor.id,
      userName: actor.name,
      action: `TASK_STATUS_${status}`,
      entity: 'Task',
      entityId: taskId,
      details: { title: task.title, status, comment },
      createdAt: now,
    };
    this.auditLogs.unshift(newAuditLog);

    this.persist();

    // 1. Sync status to Next.js universal /api/sync relay
    if (typeof window !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPDATE_TASK_STATUS',
          taskId,
          status,
          actor,
          comment,
        }),
      }).catch(() => {});
    }

    // 2. Sync status and relations to Firestore
    if (isFirebaseConfigured && db) {
      const firestoreDb = db;
      setDoc(doc(firestoreDb, 'tasks', taskId), sanitizeForFirestore({ ...task, ...updates }), { merge: true }).catch(() => {});
      setDoc(doc(firestoreDb, 'activities', newActivity.id), sanitizeForFirestore(newActivity)).catch(() => {});
      setDoc(doc(firestoreDb, 'audit_logs', newAuditLog.id), sanitizeForFirestore(newAuditLog)).catch(() => {});
      newNotifs.forEach((n) => {
        setDoc(doc(firestoreDb, 'notifications', n.id), sanitizeForFirestore(n)).catch(() => {});
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

    let newAuditLog: AuditLog | null = null;
    if (actor) {
      newAuditLog = {
        id: 'audit_' + Date.now(),
        userId: actor.id,
        userName: actor.name,
        action: 'TASK_UPDATED',
        entity: 'Task',
        entityId: taskId,
        details: { updates },
        createdAt: now,
      };
      this.auditLogs.unshift(newAuditLog);
    }

    this.persist();

    // 1. Sync to /api/sync
    if (typeof window !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'UPDATE_TASK',
          taskId,
          updates,
          actor,
        }),
      }).catch(() => {});
    }

    // 2. Sync update to Firestore
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'tasks', taskId), sanitizeForFirestore({ ...task, ...updates }), { merge: true }).catch(() => {});
      if (newAuditLog) {
        setDoc(doc(db, 'audit_logs', newAuditLog.id), sanitizeForFirestore(newAuditLog)).catch(() => {});
      }
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
    const newAuditLog: AuditLog = {
      id: 'audit_' + Date.now(),
      userId: actor.id,
      userName: actor.name,
      action: 'TASK_DELETED',
      entity: 'Task',
      entityId: taskId,
      details: { title: task.title, deletedBy: actor.name },
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newAuditLog);

    this.persist();

    // 1. Sync delete to /api/sync
    if (typeof window !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DELETE_TASK',
          taskId,
          actor,
        }),
      }).catch(() => {});
    }

    // 2. Delete from Firestore
    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'tasks', taskId)).catch(() => {});
      setDoc(doc(db, 'audit_logs', newAuditLog.id), sanitizeForFirestore(newAuditLog)).catch(() => {});
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
      if (isFirebaseConfigured && db) {
        setDoc(doc(db, 'notifications', notificationId), sanitizeForFirestore({ read: true }), { merge: true }).catch(() => {});
      }
    }
  }

  markAllNotificationsRead(userId: string): void {
    this.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
        if (isFirebaseConfigured && db) {
          setDoc(doc(db, 'notifications', n.id), sanitizeForFirestore({ read: true }), { merge: true }).catch(() => {});
        }
      }
    });
    this.persist();
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  logEmail(emailLog: Omit<EmailLog, 'id'>): void {
    const logId = 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newEntry: EmailLog = {
      ...emailLog,
      id: logId,
      timestamp: emailLog.timestamp || emailLog.sentAt || new Date().toISOString(),
      sentAt: emailLog.sentAt || emailLog.timestamp || new Date().toISOString(),
      eventType: emailLog.eventType || emailLog.type || 'NOTIFICATION',
      type: emailLog.type || emailLog.eventType || 'NOTIFICATION',
      sender: emailLog.sender || 'k.vijayakumar@klu.ac.in',
    };

    this.emailLogs.unshift(newEntry);
    this.persist();

    // Sync to Firestore emailLogs collection
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'emailLogs', logId), sanitizeForFirestore(newEntry)).catch((e) => {
        console.warn('Firestore logEmail error:', e);
      });
    }
  }

  getEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }
}

export const memoryStore = new MemoryStore();

// Task assignment helper across ID, email, or kluid (case-insensitive and ultra-robust)
export function isTaskAssignedToUser(task: Task, user: User | null | undefined): boolean {
  if (!task || !user) return false;
  const cleanUserId = (user.id || '').trim().toLowerCase();
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanKluId = (user.kluid || '').trim().toLowerCase();
  const cleanEduId = (user.eduid || '').trim().toLowerCase();
  const cleanName = (user.name || '').trim().toLowerCase();

  const ids = task.assigneeIds || [];

  // 1. Direct ID / Email / KLU ID / staff number / alias matching
  const matchesDirectId = ids.some((id) => {
    const clean = (id || '').trim().toLowerCase();
    if (
      clean === cleanUserId ||
      clean === cleanEmail ||
      clean === cleanKluId ||
      clean === cleanEduId ||
      (clean.startsWith('klu') && clean.replace(/^klu/, '') === cleanKluId.replace(/^klu/, '')) ||
      (!clean.startsWith('klu') && `klu${clean}` === cleanKluId)
    ) {
      return true;
    }

    // Resolve assignee ID to user object and match against user
    const resolvedAssignee = memoryStore.getUser(clean);
    if (resolvedAssignee) {
      const rId = resolvedAssignee.id.toLowerCase();
      const rEmail = resolvedAssignee.email.toLowerCase();
      const rKlu = resolvedAssignee.kluid.toLowerCase();
      if (
        rId === cleanUserId ||
        rEmail === cleanEmail ||
        rKlu === cleanKluId ||
        rKlu.replace(/^klu/, '') === cleanKluId.replace(/^klu/, '')
      ) {
        return true;
      }
    }
    return false;
  });

  if (matchesDirectId) return true;

  // 2. Check populated assignees list if available
  if (task.assignees && Array.isArray(task.assignees)) {
    return task.assignees.some((a) => {
      const aId = (a.id || '').trim().toLowerCase();
      const aEmail = (a.email || '').trim().toLowerCase();
      const aKlu = (a.kluid || '').trim().toLowerCase();
      const aEdu = (a.eduid || '').trim().toLowerCase();
      const aName = (a.name || '').trim().toLowerCase();
      return (
        aId === cleanUserId ||
        aEmail === cleanEmail ||
        aKlu === cleanKluId ||
        aEdu === cleanEduId ||
        (aName && cleanName && aName === cleanName) ||
        (aKlu.startsWith('klu') && aKlu.replace(/^klu/, '') === cleanKluId.replace(/^klu/, '')) ||
        (!aKlu.startsWith('klu') && `klu${aKlu}` === cleanKluId)
      );
    });
  }

  return false;
}

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
  const assignedTasks = tasks.filter((t) => isTaskAssignedToUser(t, faculty));
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
 * Looks up user in Firestore or memoryStore by email, KLU ID, or user ID.
 */
export async function getUserByEmail(identifier: string): Promise<User | null> {
  const normalized = (identifier || '').trim().toLowerCase();
  if (!normalized) return null;

  // 1. Check in-memory store using getUser (which contains comprehensive alias maps)
  const localMatch = memoryStore.getUser(normalized);
  if (localMatch) return localMatch;

  // Check aliases for Admin
  if (
    normalized === 'hodeee@klu.ac.in' ||
    normalized === 'hodee@klu.ac.in' ||
    normalized === 'hodeee' ||
    normalized === 'hodee' ||
    normalized === 'admin' ||
    normalized === 'hod' ||
    normalized === 'user_hodeee' ||
    normalized === 'kvkhod'
  ) {
    const adminUser = memoryStore.getUsers().find((u) => u.id === 'user_hodeee' || u.role === 'ADMIN') || SEED_USERS[0];
    if (adminUser) return adminUser;
  }

  // Check aliases for Faculty Dr. Vijayakumar
  if (
    normalized === 'k.vijayakumar@klu.ac.in' ||
    normalized === 'klu1043' ||
    normalized === '1043' ||
    normalized === 'user_klu1043' ||
    normalized === 'kvkeee'
  ) {
    const facultyUser = memoryStore.getUsers().find((u) => u.id === 'user_klu1043') || SEED_USERS[1];
    if (facultyUser) return facultyUser;
  }

  // 2. Query Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const usersRef = collection(db, 'users');
      // Search by email
      const qEmail = query(usersRef, where('email', '==', normalized));
      const snapEmail = await getDocs(qEmail);

      if (!snapEmail.empty) {
        const docData = snapEmail.docs[0].data() as User;
        return { ...docData, id: snapEmail.docs[0].id };
      }

      // Search by kluid
      const qKlu = query(usersRef, where('kluid', '==', normalized));
      const snapKlu = await getDocs(qKlu);
      if (!snapKlu.empty) {
        const docData = snapKlu.docs[0].data() as User;
        return { ...docData, id: snapKlu.docs[0].id };
      }

      // Search by numeric KLU ID with 'klu' prefix
      if (!normalized.startsWith('klu')) {
        const qKluNum = query(usersRef, where('kluid', '==', `klu${normalized}`));
        const snapKluNum = await getDocs(qKluNum);
        if (!snapKluNum.empty) {
          const docData = snapKluNum.docs[0].data() as User;
          return { ...docData, id: snapKluNum.docs[0].id };
        }
      }

      // Check direct document ID
      const directSnap = await getDoc(doc(db, 'users', normalized));
      if (directSnap.exists()) {
        const docData = directSnap.data() as User;
        return { ...docData, id: directSnap.id };
      }
    } catch (err) {
      console.warn('Firestore getUserByEmail error:', err);
    }
  }

  return null;
}

/**
 * Seeds / Syncs official EEE faculty roster into Firestore ensuring all members exist
 */
export async function seedInitialUsersToFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    for (const user of SEED_USERS) {
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, sanitizeForFirestore(user));
      } else {
        const existingData = userDocSnap.data() as User;
        await setDoc(
          userDocRef,
          sanitizeForFirestore({
            ...user,
            password: existingData.password || user.password,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      }
    }
    console.log('Official EEE faculty roster verified & synced to Firestore.');
  } catch (err) {
    console.warn('Note on Firestore user seeding:', err);
  }
}

