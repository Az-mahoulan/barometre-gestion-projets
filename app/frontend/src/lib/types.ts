// Types de la réponse de GET /api/v1/dashboard/ (voir apps/dashboard/services.py).

export type Health = "ok" | "risk" | "late" | "completed";
export type Role = "admin" | "responsable" | "membre";
export type Period = "month" | "quarter" | "year";

export interface Me {
  id: number;
  username: string;
  name: string;
  initials: string;
  role: Role;
  role_label: string;
  job_title: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface NextMilestone {
  name: string;
  date: string;
  overdue: boolean;
}

export interface Kpis {
  active_projects: number;
  at_risk_projects: number;
  late_projects: number;
  late_milestones: number;
  completed_projects: number;
  milestones_total: number;
  milestones_achieved: number;
  milestones_pct: number;
  overdue_tasks: number;
}

export interface GanttActivity {
  id: number;
  name: string;
  start: string;
  end: string;
  tasks_total: number;
  tasks_complete: number;
  progress: number;
}

export interface GanttProject {
  id: number;
  name: string;
  status: string;
  health: Health;
  start: string;
  end: string;
  progress: number;
  next_milestone: NextMilestone | null;
  milestones: { name: string; date: string; achieved: boolean; overdue: boolean }[];
  activities: GanttActivity[];
}

export interface WeekItem {
  kind: "event" | "milestone" | "task";
  title: string;
  subtitle: string;
  time?: string;
  done?: boolean;
  late?: boolean;
  task_id?: number;
}

export interface Week {
  start: string;
  end: string;
  offset: number;
  days: { date: string; is_today: boolean; items: WeekItem[] }[];
}

export interface TrendMonth {
  month: string;
  label: string;
  state: "past" | "current" | "future";
  total: number;
  achieved: number;
  pct: number | null;
}

export interface TaskStatusCount {
  key: "todo" | "doing" | "done" | "review" | "approved";
  label: string;
  count: number;
  pct: number;
}

export interface CriticalItem {
  severity: "late" | "risk" | "info";
  kind: string;
  title: string;
  subtitle: string;
  action: "remind" | "approve" | "reschedule" | null;
  task_id?: number;
  project_id?: number;
}

export interface ActivityEntry {
  id: number;
  message: string;
  actor_initials: string;
  project: string;
  created_at: string;
}

export interface ProjectRow {
  id: number;
  name: string;
  country: string;
  owner: string;
  owner_initials: string;
  start: string;
  end: string;
  status: string;
  health: Health;
  progress: number;
  tasks_complete: number;
  tasks_total: number;
  activities: number;
  milestones_achieved: number;
  milestones_total: number;
  performance: number | null;
  next_milestone: NextMilestone | null;
}

export interface Member {
  id: number;
  name: string;
  initials: string;
  job_title: string;
  country: string;
  status: "available" | "meeting" | "mission" | "training" | "leave";
  status_label: string;
  reason: string;
  place: string;
  place_label: string;
  open_tasks: number;
  overdue_tasks: number;
}

export interface Dashboard {
  as_of: string;
  now: string;
  user: { name: string; role: Role; role_label: string };
  scope: "all" | "owned" | "assigned";
  filters: { country: string | null; period: Period };
  kpis: Kpis;
  gantt: GanttProject[];
  week: Week;
  trend: TrendMonth[];
  task_progress: { total: number; overdue: number; in_review: number; statuses: TaskStatusCount[] };
  critical_actions: { total: number; items: CriticalItem[] };
  recent_activity: ActivityEntry[];
  projects: ProjectRow[];
  teams: { available: number; total: number; members: Member[] };
}
