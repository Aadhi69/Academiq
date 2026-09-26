import { NextRequest, NextResponse } from 'next/server';
import { 
  Task, 
  User, 
  TaskActivity, 
  Notification, 
  AuditLog, 
  EmailLog, 
  TaskStatus 
} from '@/types';
import { SEED_USERS, SEED_TASKS, SEED_ACTIVITIES, SEED_NOTIFICATIONS, SEED_AUDIT_LOGS } from '@/lib/firebase/seedData';
import { adminDb } from '@/lib/firebase/admin';
import fs from 'fs';
import path from 'path';

interface ServerStoreData {
  users: User[];
  tasks: Task[];
  activities: TaskActivity[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  emailLogs: EmailLog[];
  lastUpdated: string;
}

// In-Memory Cloud Store for fast responses
let serverStore: ServerStoreData = {
  users: [...SEED_USERS],
  tasks: [...SEED_TASKS],
  activities: [...SEED_ACTIVITIES],
  notifications: [...SEED_NOTIFICATIONS],
  auditLogs: [...SEED_AUDIT_LOGS],
  emailLogs: [],
  lastUpdated: new Date().toISOString(),
};

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'academiq_cloud_store.json');

// Helper to load persisted store from disk
function loadPersistedStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.tasks)) {
        serverStore = {
          ...serverStore,
          ...parsed,
        };
        // Ensure SEED_USERS defaults exist
        const userMap = new Map<string, User>();
        SEED_USERS.forEach((su) => userMap.set(su.id, su));
        (parsed.users || []).forEach((pu: User) => {
          if (pu && pu.id) {
            const existing = userMap.get(pu.id);
            if (existing) {
              userMap.set(pu.id, { ...existing, password: pu.password || existing.password, mobile: pu.mobile || existing.mobile });
            } else {
              userMap.set(pu.id, pu);
            }
          }
        });
        serverStore.users = Array.from(userMap.values());
      }
    }
  } catch (e) {
    console.warn('[Sync API] Disk store load notice:', e);
  }
}

// Helper to save store to disk
function savePersistedStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    serverStore.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(serverStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Sync API] Disk store save notice:', e);
  }
}

// Initial load
loadPersistedStore();

export async function GET(req: NextRequest) {
  loadPersistedStore();

  // If Firebase Admin is available, attempt to read tasks from remote Firestore as well
  if (adminDb) {
    try {
      const tasksSnap = await adminDb.collection('tasks').get();
      if (!tasksSnap.empty) {
        const remoteTasks: Task[] = [];
        tasksSnap.forEach((doc) => {
          remoteTasks.push({ ...(doc.data() as Task), id: doc.id });
        });
        remoteTasks.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        serverStore.tasks = remoteTasks;
      }
    } catch (e) {
      console.warn('[Sync API] Firestore Admin read notice:', e);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      tasks: serverStore.tasks,
      users: serverStore.users,
      activities: serverStore.activities,
      notifications: serverStore.notifications,
      auditLogs: serverStore.auditLogs,
      emailLogs: serverStore.emailLogs,
      lastUpdated: serverStore.lastUpdated,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, task, taskId, status, actor, comment, updates, userId, newPassword, bulkData } = body;
    const now = new Date().toISOString();

    loadPersistedStore();

    switch (type) {
      case 'CREATE_TASK': {
        if (!task || !task.id) {
          return NextResponse.json({ success: false, error: 'Invalid task payload' }, { status: 400 });
        }

        // Deduplicate
        serverStore.tasks = serverStore.tasks.filter((t) => t.id !== task.id);
        serverStore.tasks.unshift(task);

        // Add activity
        const assigneeNames = serverStore.users
          .filter((u) => task.assigneeIds?.includes(u.id))
          .map((u) => u.name)
          .join(', ');

        const newActivity: TaskActivity = {
          id: 'act_' + Date.now(),
          taskId: task.id,
          userId: actor?.id || task.createdById || 'user_hodeee',
          userName: actor?.name || 'Dr. K. Vijayakumar (HOD)',
          userRole: actor?.role || 'ADMIN',
          action: 'TASK_CREATED',
          description: `Task created and assigned to ${assigneeNames || 'faculty'}`,
          createdAt: now,
        };
        serverStore.activities.unshift(newActivity);

        // Add notifications for each assignee
        task.assigneeIds?.forEach((uid: string) => {
          serverStore.notifications.unshift({
            id: `notif_${Date.now()}_${uid}`,
            userId: uid,
            taskId: task.id,
            type: 'TASK_ASSIGNED',
            title: `New Assignment: ${task.title}`,
            message: `${actor?.name || 'HOD'} assigned you a ${task.priority} priority task due ${new Date(task.dueDate).toLocaleDateString()}.`,
            read: false,
            createdAt: now,
          });
        });

        // Audit log
        serverStore.auditLogs.unshift({
          id: 'audit_' + Date.now(),
          userId: actor?.id || task.createdById || 'user_hodeee',
          userName: actor?.name || 'Dr. K. Vijayakumar (HOD)',
          action: 'TASK_CREATED',
          entity: 'Task',
          entityId: task.id,
          details: { title: task.title, priority: task.priority, assignees: task.assigneeIds },
          createdAt: now,
        });

        // Save to Firebase Admin if available
        if (adminDb) {
          adminDb.collection('tasks').doc(task.id).set(task).catch(() => {});
          adminDb.collection('activities').doc(newActivity.id).set(newActivity).catch(() => {});
        }

        savePersistedStore();
        return NextResponse.json({ success: true, task });
      }

      case 'UPDATE_TASK_STATUS': {
        const taskIndex = serverStore.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
          return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        const currentTask = serverStore.tasks[taskIndex];
        const statusUpdates: Partial<Task> = {
          status: status as TaskStatus,
          updatedAt: now,
        };

        if (status === 'SUBMITTED') {
          statusUpdates.submittedAt = now;
          statusUpdates.submittedBy = actor?.id;
        } else if (status === 'COMPLETED') {
          statusUpdates.completedAt = now;
        } else if (status === 'REVISION_REQUIRED') {
          statusUpdates.revisionComment = comment;
        }

        serverStore.tasks[taskIndex] = { ...currentTask, ...statusUpdates };

        const newActivity: TaskActivity = {
          id: 'act_' + Date.now(),
          taskId,
          userId: actor?.id || 'system',
          userName: actor?.name || 'Faculty Member',
          userRole: actor?.role || 'FACULTY',
          action: status === 'SUBMITTED' ? 'TASK_SUBMITTED' : (status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_STARTED'),
          description: `${actor?.name || 'User'} updated status to ${status}`,
          createdAt: now,
        };
        serverStore.activities.unshift(newActivity);

        // Save to Firebase Admin
        if (adminDb) {
          adminDb.collection('tasks').doc(taskId).set({ ...currentTask, ...statusUpdates }, { merge: true }).catch(() => {});
          adminDb.collection('activities').doc(newActivity.id).set(newActivity).catch(() => {});
        }

        savePersistedStore();
        return NextResponse.json({ success: true, task: serverStore.tasks[taskIndex] });
      }

      case 'UPDATE_TASK': {
        const taskIndex = serverStore.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
          return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
        }

        serverStore.tasks[taskIndex] = {
          ...serverStore.tasks[taskIndex],
          ...updates,
          updatedAt: now,
        };

        if (adminDb) {
          adminDb.collection('tasks').doc(taskId).set(serverStore.tasks[taskIndex], { merge: true }).catch(() => {});
        }

        savePersistedStore();
        return NextResponse.json({ success: true, task: serverStore.tasks[taskIndex] });
      }

      case 'DELETE_TASK': {
        serverStore.tasks = serverStore.tasks.filter((t) => t.id !== taskId);
        serverStore.activities = serverStore.activities.filter((a) => a.taskId !== taskId);

        if (adminDb) {
          adminDb.collection('tasks').doc(taskId).delete().catch(() => {});
        }

        savePersistedStore();
        return NextResponse.json({ success: true });
      }

      case 'UPDATE_PASSWORD': {
        const uIndex = serverStore.users.findIndex((u) => u.id === userId);
        if (uIndex !== -1) {
          serverStore.users[uIndex] = {
            ...serverStore.users[uIndex],
            password: newPassword,
            updatedAt: now,
          };
          if (adminDb) {
            adminDb.collection('users').doc(userId).set({ password: newPassword, updatedAt: now }, { merge: true }).catch(() => {});
          }
          savePersistedStore();
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      case 'BULK_SYNC': {
        if (bulkData && Array.isArray(bulkData.tasks)) {
          const taskMap = new Map<string, Task>();
          serverStore.tasks.forEach((t) => taskMap.set(t.id, t));
          bulkData.tasks.forEach((t: Task) => {
            if (t && t.id) taskMap.set(t.id, t);
          });
          const merged = Array.from(taskMap.values());
          merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          serverStore.tasks = merged;
          savePersistedStore();
        }
        return NextResponse.json({ success: true, tasks: serverStore.tasks });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown sync action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Sync API] Server error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Sync failed' }, { status: 500 });
  }
}
