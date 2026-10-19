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
  /** Avatar illustré unique (combinaison de traits) et son style. */
  avatar: string | null;
  avatar_style: "neutral" | "masculine" | "feminine";
  /** Disposition personnelle du tableau de bord : ordre des cartes par colonne (vide = par défaut). */
  dashboard_layout: { main?: string[]; side?: string[] };
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
  milestones: {
    id: number;
    name: string;
    date: string;
    /** Début de la période du jalon : échéance du jalon précédent, ou début du projet. */
    start: string;
    achieved: boolean;
    overdue: boolean;
    depends_on: number[];
    /** Activités rattachées au jalon et avancement de leurs tâches. */
    activities: number;
    tasks_total: number;
    tasks_complete: number;
    progress: number;
    /** Personne la plus impliquée (le plus de tâches), sinon le responsable du projet. */
    lead: { name: string; initials: string };
    /** Membres du jalon, les plus impliqués d'abord. */
    members: { name: string; initials: string }[];
  }[];
  activities: GanttActivity[];
  /** Dates clés renseignées par le gestionnaire (revue, rencontre, lancement…), distinctes des jalons. */
  key_dates: { label: string; date: string }[];
}

export interface WeekItem {
  kind: "event" | "project" | "activity" | "milestone" | "task" | "keydate" | "deliverable";
  title: string;
  subtitle: string;
  time?: string;
  done?: boolean;
  late?: boolean;
  task_id?: number;
  project_id?: number | null;
  /** Participants d'une réunion ou personnes chargées de l'échéance (peut être vide). */
  people?: { initials: string; name: string }[];
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

/** Actions à traiter : total, décompte par gravité (toutes) et liste (éventuellement limitée). */
export interface CriticalActions {
  total: number;
  counts: Record<CriticalItem["severity"], number>;
  items: CriticalItem[];
}

export interface ActivityEntry {
  id: number;
  message: string;
  actor_initials: string;
  actor_name: string;
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
  team: { name: string; initials: string }[];
  deliverables_done: number;
  deliverables_total: number;
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
  critical_actions: CriticalActions;
  recent_activity: ActivityEntry[];
  projects: ProjectRow[];
  teams: { available: number; total: number; members: Member[] };
  /** Avatars illustrés : nom affiché -> combinaison de traits. */
  avatars: Record<string, string>;
}

/** Écran « Projets ». */
export interface ProjectsList {
  as_of: string;
  now: string;
  projects: ProjectRow[];
  avatars: Record<string, string | null>;
}

export interface ProjectTask {
  id: number;
  title: string;
  status: string;
  status_label: string;
  due: string;
  overdue: boolean;
  priority: "n" | "h";
  assignee: { name: string; initials: string } | null;
  activity: string;
  can_edit: boolean;
}

/** Écran de détail d'un projet. */
export interface ProjectDetail {
  as_of: string;
  now: string;
  project: ProjectRow & { description: string; status_label: string };
  can_manage: boolean;
  statuses: { key: string; label: string }[];
  tasks: ProjectTask[];
  milestones: GanttProject["milestones"];
  activities: {
    id: number;
    name: string;
    start: string;
    end: string;
    milestone: string;
    tasks_total: number;
    tasks_complete: number;
    progress: number;
  }[];
  deliverables: { id: number; name: string; due: string; delivered_on: string | null; late: boolean }[];
  key_dates: { label: string; date: string }[];
  team: { name: string; initials: string; job_title: string; is_owner: boolean; open_tasks: number; overdue_tasks: number }[];
  log: { id: number; message: string; actor_name: string; actor_initials: string; created_at: string }[];
  avatars: Record<string, string | null>;
}

/** Écran « Mes tâches ». */
export interface MyTask extends ProjectTask {
  complete: boolean;
  project: { id: number; name: string };
  can_approve: boolean;
}

export interface MyTasks {
  as_of: string;
  now: string;
  scope: "mine" | "projects";
  can_see_projects: boolean;
  mine_count: number;
  statuses: { key: string; label: string }[];
  tasks: MyTask[];
  avatars: Record<string, string | null>;
}

/** Écran « Calendrier » : grille d'un mois. */
export interface CalendarMonth {
  as_of: string;
  year: number;
  month: number;
  projects: { id: number; name: string }[];
  days: { date: string; in_month: boolean; is_today: boolean; items: WeekItem[] }[];
  avatars: Record<string, string | null>;
}

/** Écran « Équipes ». */
export interface TeamMember extends Member {
  projects: { id: number; name: string; owner: boolean }[];
  due_soon: number;
  until: string | null;
  role_label: string;
}

export interface TeamScreen {
  as_of: string;
  available: number;
  total: number;
  members: TeamMember[];
  avatars: Record<string, string | null>;
}

/** Écran « Notifications ». */
export interface Notifications {
  as_of: string;
  now: string;
  to_handle: CriticalActions;
  feed: {
    id: number;
    message: string;
    actor_name: string;
    actor_initials: string;
    project: { id: number; name: string };
    created_at: string;
    unread: boolean;
    for_me: boolean;
    mine: boolean;
  }[];
  unread: number;
  avatars: Record<string, string | null>;
}

/** Écran « Rapports ». */
export interface Report {
  as_of: string;
  period: { key: Period; start: string; end: string };
  kpis: Omit<Kpis, "overdue_tasks">;
  projects: (ProjectRow & { tasks_overdue: number })[];
  by_country: {
    country: string;
    projects: number;
    active: number;
    late: number;
    risk: number;
    completed: number;
    tasks_total: number;
    tasks_complete: number;
    tasks_overdue: number;
    progress: number;
  }[];
  trend: TrendMonth[];
}

/** Écran « Administration ». */
export interface AdminUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  role_label: string;
  job_title: string;
  country: string;
  is_active: boolean;
  last_login: string | null;
  avatar: string | null;
}

export interface AdminProject {
  id: number;
  name: string;
  description: string;
  country: string;
  owner: number;
  owner_name: string;
  start_date: string;
  end_date: string;
  status: string;
  status_label: string;
}

export interface AdminOverview {
  users: AdminUser[];
  projects: AdminProject[];
  countries: { code: string; name: string; users: number; projects: number }[];
  roles: { key: Role; label: string }[];
  statuses: { key: string; label: string }[];
}
