"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Crown, Download, GripVertical, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  GROUPING_LIMITS,
  GROUPING_STRATEGIES,
  GROUPING_STRATEGY_LABELS,
  GROUPING_TOGGLE_LABELS,
  GROUP_RESULT_DND_CONTEXT_ID,
  INPUT_DEPENDENT_BUTTON_CLASSES,
  EXCEL_EXPORT,
  GENDER,
  GENDER_LABELS,
  LEADER_SELECTION_MODES,
  LEADER_SELECTION_OPTIONS,
  ROUTES,
  UNKNOWN_AGE_LABEL,
  UI_MESSAGES,
  UI_LABELS,
  displayGroupName,
  formatGroupName,
} from "@/lib/config/app";
import { LeaderConflictDialog } from "@/components/dashboard/leader-conflict-dialog";
import { Spinner } from "@/components/spinner";
import { setGroupLeader } from "@/lib/grouping/leader-assignment";
import { reorderGroupMembers } from "@/lib/grouping/reorder-group-members";
import { parseRosterText } from "@/lib/roster/parse-roster";
import { readRosterFile } from "@/lib/roster/read-roster-file";
import type {
  Group,
  GroupMember,
  GroupResultMembers,
  GroupingStrategy,
  LeaderSelectionMode,
  PersonInput,
} from "@/lib/types/domain";

type Person = PersonInput & { id: string };
type Project = { id: string; people: Person[]; title: string };
type Props = { initialGroups: GroupResultMembers | null; initialResultId: string | null; project: Project | null };
type LeaderConflict = {
  leaderId: string;
  nextGroups: Group[];
  previousGroups: Group[];
  targetGroupId: string;
};

function defaultGroupSizes(total: number, count: number) {
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => base + (index < total % count ? 1 : 0));
}

function normalizeGroupCount(total: number, count: number) {
  return Math.min(
    Math.max(count, GROUPING_LIMITS.minimumGroupCount),
    Math.min(total, GROUPING_LIMITS.maximumGroupCount),
  );
}

function formatRosterText(people: Person[]) {
  return people
    .map((person) =>
      [
        person.name,
        person.gender === GENDER.unknown ? null : GENDER_LABELS[person.gender],
        person.age === null ? null : String(person.age),
      ]
        .filter((value): value is string => value !== null)
        .join(", "),
    )
    .join("\n");
}

function resolveGroupingStrategy(
  useSimilarAge: boolean,
  separateGender: boolean,
): GroupingStrategy {
  if (useSimilarAge && separateGender) {
    return GROUPING_STRATEGIES.genderAgeSimilar;
  }

  if (useSimilarAge) {
    return GROUPING_STRATEGIES.ageSimilar;
  }

  if (separateGender) {
    return GROUPING_STRATEGIES.genderSeparated;
  }

  return GROUPING_STRATEGIES.even;
}

type MemberCardProps = {
  groupId: string;
  member: GroupMember;
  onLeaderAction: (groupId: string, member: GroupMember) => void;
};

function MemberCard({ groupId, member, onLeaderAction }: MemberCardProps) {
  /* eslint-disable react-hooks/refs */
  const sortable = useSortable({ id: member.id });
  const transform = sortable.transform
    ? `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`
    : undefined;

  const leaderActionLabel = member.isLeader ? UI_LABELS.revokeLeader : UI_LABELS.appointLeader;

  return <li ref={sortable.setNodeRef} {...sortable.attributes} {...sortable.listeners} className={`flex touch-none cursor-grab items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm active:cursor-grabbing ${member.isLeader ? "bg-amber-50" : ""}`} style={{ opacity: sortable.isDragging ? 0.35 : undefined, transform, transition: sortable.transition }}><GripVertical size={14} className="text-[var(--muted)]" />{member.isLeader ? <Crown aria-label={UI_LABELS.leader} className="shrink-0 text-amber-600" fill="currentColor" size={14} /> : null}<span>{member.name}</span><span className="ml-auto text-xs text-[var(--muted)]">{GENDER_LABELS[member.gender]} · {member.age ?? UNKNOWN_AGE_LABEL}</span><button aria-label={leaderActionLabel} className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-amber-700" onClick={() => onLeaderAction(groupId, member)} onKeyDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()} title={leaderActionLabel} type="button"><Crown fill={member.isLeader ? "currentColor" : "none"} size={14} /><span className="sr-only">{leaderActionLabel}</span></button></li>;
}

function GroupColumn({ group, onLeaderAction }: { group: Group; onLeaderAction: MemberCardProps["onLeaderAction"] }) {
  /* eslint-disable react-hooks/refs */
  const droppable = useDroppable({ id: group.id });
  return <section ref={droppable.setNodeRef} className="min-h-40 border border-[var(--border)] bg-[var(--surface)]"><header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2"><strong className="text-sm">{displayGroupName(group.name)}</strong><span className="text-xs text-[var(--muted)]">{group.members.length} / {group.targetSize}</span></header><SortableContext items={group.members.map((member) => member.id)} strategy={verticalListSortingStrategy}><ul>{group.members.map((member) => <MemberCard groupId={group.id} key={member.id} member={member} onLeaderAction={onLeaderAction} />)}</ul></SortableContext></section>;
}

export function Workspace({ initialGroups, initialResultId, project }: Props) {
  const router = useRouter();
  const initialPersonCount = project?.people.length ?? 0;
  const initialGroupCount = initialPersonCount > 0
    ? normalizeGroupCount(initialPersonCount, GROUPING_LIMITS.defaultGroupCount)
    : GROUPING_LIMITS.defaultGroupCount;
  const [groups, setGroups] = useState<Group[]>(initialGroups?.groups ?? []);
  const [resultId, setResultId] = useState(initialResultId);
  const [projectTitle, setProjectTitle] = useState("");
  const [rosterText, setRosterText] = useState(() => formatRosterText(project?.people ?? []));
  const [groupCount, setGroupCount] = useState(initialGroupCount);
  const [groupSizes, setGroupSizes] = useState<number[]>(() => initialPersonCount > 0 ? defaultGroupSizes(initialPersonCount, initialGroupCount) : []);
  const initialStrategy = initialGroups?.strategy ?? GROUPING_STRATEGIES.even;
  const [useSimilarAge, setUseSimilarAge] = useState(
    initialStrategy === GROUPING_STRATEGIES.ageSimilar ||
      initialStrategy === GROUPING_STRATEGIES.genderAgeSimilar,
  );
  const [separateGender, setSeparateGender] = useState(
    initialStrategy === GROUPING_STRATEGIES.genderSeparated ||
      initialStrategy === GROUPING_STRATEGIES.genderAgeSimilar,
  );
  const [resultStrategy, setResultStrategy] = useState<GroupingStrategy>(
    initialGroups?.strategy ?? GROUPING_STRATEGIES.even,
  );
  const [leaderSelectionMode, setLeaderSelectionMode] = useState<LeaderSelectionMode>(
    LEADER_SELECTION_MODES.none,
  );
  const [leaderConflict, setLeaderConflict] = useState<LeaderConflict | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [isSavingRoster, setIsSavingRoster] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const capacity = useMemo(() => groupSizes.reduce((sum, size) => sum + size, 0), [groupSizes]);
  const personCount = project?.people.length ?? 0;
  const canCreateProject = projectTitle.trim().length > 0;
  const hasRosterInput = rosterText.trim().length > 0;
  const isValidRosterInput = hasRosterInput && !isSavingRoster;
  const canCreateGroupSizes = personCount > 0;
  const hasGroupSizes = groupSizes.length > 0;
  const displayedGroupSizes = hasGroupSizes ? groupSizes : Array.from({ length: groupCount }, () => "");
  const canRunGrouping = canCreateGroupSizes && hasGroupSizes && capacity === personCount;
  const canExport = groups.length > 0;
  const isGroupingAvailable = canRunGrouping && !isGrouping;
  const isProjectCreationAvailable = canCreateProject && !isCreatingProject;
  const selectedStrategy = resolveGroupingStrategy(useSimilarAge, separateGender);
  const groupSetupMessage = !canCreateGroupSizes
    ? UI_MESSAGES.savedRosterRequired
    : !canRunGrouping
        ? UI_MESSAGES.groupCapacityMismatch
        : `정원 합계: ${capacity} / ${personCount}`;

  function showError(message: string) { setNotice(message); }
  function updateGroupCount(value: number) {
    const normalizedCount = normalizeGroupCount(personCount, value);
    setGroupCount(normalizedCount);
    setGroupSizes(defaultGroupSizes(personCount, normalizedCount));
  }
  async function jsonRequest<T>(url: string, method: "POST" | "PATCH" | "PUT", body: unknown): Promise<T> {
    const response = await fetch(url, { body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, method });
    if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "요청을 처리하지 못했습니다.");
    return response.json() as Promise<T>;
  }
  async function createProject() {
    setIsCreatingProject(true);

    try {
      const created = await jsonRequest<{ id: string }>("/api/projects", "POST", { title: projectTitle });
      router.push(`${ROUTES.rosters}?project=${created.id}`);
    } catch (error) { showError(error instanceof Error ? error.message : "명단을 만들지 못했습니다."); }
    finally { setIsCreatingProject(false); }
  }
  async function saveRoster() {
    if (!project) return;
    setIsSavingRoster(true);

    try {
      const result = await jsonRequest<{ people: Person[] }>(`/api/projects/${project.id}/people`, "PUT", { people: parseRosterText(rosterText) });
      setRosterText(formatRosterText(result.people));
      router.refresh();
    } catch (error) { showError(error instanceof Error ? error.message : "명단을 저장하지 못했습니다."); }
    finally { setIsSavingRoster(false); }
  }
  async function uploadFile(file: File) {
    setIsUploadingFile(true);

    try {
      setRosterText(await readRosterFile(file));
    } catch { showError("파일을 읽지 못했습니다. CSV 또는 Excel 파일인지 확인해 주세요."); }
    finally { setIsUploadingFile(false); }
  }
  async function persistGroupChanges(previousGroups: Group[], nextGroups: Group[]) {
    if (!resultId) return;
    setGroups(nextGroups);
    try {
      await jsonRequest(`/api/group-results/${resultId}`, "PATCH", {
        groups: nextGroups,
        strategy: resultStrategy,
      });
    } catch (error) {
      setGroups(previousGroups);
      showError(error instanceof Error ? error.message : "변경 사항을 저장하지 못했습니다.");
    }
  }
  async function runGrouping() {
    if (!project) return;
    setIsGrouping(true);

    try {
      const result = await jsonRequest<{ id: string; members: GroupResultMembers }>(`/api/projects/${project.id}/group-results`, "POST", { groupSizes, leaderSelectionMode, strategy: selectedStrategy });
      setGroups(result.members.groups); setResultId(result.id); setResultStrategy(result.members.strategy ?? selectedStrategy); router.refresh();
    } catch (error) { showError(error instanceof Error ? error.message : "조 편성에 실패했습니다."); }
    finally { setIsGrouping(false); }
  }
  function handleLeaderAction(groupId: string, member: GroupMember) {
    const nextGroups = setGroupLeader(groups, groupId, member.isLeader ? null : member.id);
    void persistGroupChanges(groups, nextGroups);
  }
  function resolveLeaderConflict(replaceTargetLeader: boolean) {
    if (!leaderConflict) return;
    const targetGroup = leaderConflict.nextGroups.find(
      (group) => group.id === leaderConflict.targetGroupId,
    );
    const targetLeader = targetGroup?.members.find(
      (member) => member.isLeader && member.id !== leaderConflict.leaderId,
    );
    const leaderId = replaceTargetLeader ? leaderConflict.leaderId : targetLeader?.id ?? null;
    const nextGroups = setGroupLeader(
      leaderConflict.nextGroups,
      leaderConflict.targetGroupId,
      leaderId,
    );

    setLeaderConflict(null);
    void persistGroupChanges(leaderConflict.previousGroups, nextGroups);
  }
  async function onDragEnd(event: DragEndEvent) {
    const memberId = String(event.active.id); const targetId = event.over ? String(event.over.id) : "";
    setActiveName(""); if (!resultId) return;
    const previous = groups; const next = reorderGroupMembers(groups, memberId, targetId);
    if (!next) return;
    const targetGroup = next.find((group) => group.members.some((member) => member.id === memberId));
    const movingMember = targetGroup?.members.find((member) => member.id === memberId);

    if (movingMember?.isLeader && targetGroup?.members.filter((member) => member.isLeader).length === 2) {
      setLeaderConflict({ leaderId: memberId, nextGroups: next, previousGroups: previous, targetGroupId: targetGroup.id });
      return;
    }

    await persistGroupChanges(previous, next);
  }
  function exportExcel() {
    const rows = groups.flatMap((group) => group.members.map((member) => ({ "조명": displayGroupName(group.name), "나이": member.age ?? UNKNOWN_AGE_LABEL, "성별": GENDER_LABELS[member.gender], "이름": member.name })));
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), EXCEL_EXPORT.sheetName); XLSX.writeFile(workbook, `${project?.title ?? "명단"}_${EXCEL_EXPORT.fileNameSuffix}.xlsx`);
  }
  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-6">
        <section className="w-full max-w-md text-center">
          <p className="text-sm text-[var(--muted)]">새 작업을 시작하세요</p>
          <h1 className="mt-3 text-2xl font-semibold">첫 명단을 만들어 보세요.</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">명단을 붙여넣고 균형 잡힌 조를 바로 구성할 수 있습니다.</p>
          <div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-5 text-left">
            <input className="w-full border border-[var(--border)] p-3" onChange={(event) => setProjectTitle(event.target.value)} placeholder="명단 이름" value={projectTitle} />
            <button className={`mt-3 flex items-center gap-2 px-4 py-3 ${isProjectCreationAvailable ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`} disabled={!isProjectCreationAvailable} onClick={() => void createProject()} type="button">{isCreatingProject ? <Spinner size="sm" /> : <Plus size={16} />}{isCreatingProject ? UI_LABELS.creatingRoster : "새로운 명단 시작"}</button>
            {!canCreateProject ? <p className="mt-2 text-xs text-[var(--muted)]">{UI_MESSAGES.projectTitleRequired}</p> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex justify-between">
          <div><p className="text-sm text-[var(--muted)]">Pinple</p><h1 className="text-2xl font-semibold">{project.title}</h1></div>
          <span className="text-sm text-[var(--muted)]">{personCount}명</span>
        </header>
        {notice ? <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{notice}</div> : null}
        {leaderConflict ? <LeaderConflictDialog onReplaceTargetLeader={() => resolveLeaderConflict(true)} onRetainTargetLeader={() => resolveLeaderConflict(false)} /> : null}
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">명단 입력</h2>
              <textarea className="mt-3 min-h-48 w-full border border-[var(--border)] p-3 text-sm" onChange={(event) => setRosterText(event.target.value)} placeholder="이름, 성별, 나이" value={rosterText} />
              <label aria-busy={isUploadingFile} className={`mt-3 flex items-center gap-2 text-sm ${isUploadingFile ? "cursor-not-allowed text-[var(--muted)]" : "cursor-pointer"}`}><Upload size={16} />{isUploadingFile ? <><Spinner size="sm" />{UI_LABELS.loadingRosterFile}</> : "Excel 또는 CSV 불러오기"}<input accept=".csv,.xls,.xlsx" className="hidden" disabled={isUploadingFile} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }} type="file" /></label>
              <button className={`mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm ${isValidRosterInput ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`} disabled={!isValidRosterInput} onClick={() => void saveRoster()} type="button">{isSavingRoster ? <Spinner size="sm" /> : null}{isSavingRoster ? UI_LABELS.savingRoster : "명단 저장"}</button>
              {!hasRosterInput ? <p className="mt-2 text-xs text-[var(--muted)]">{UI_MESSAGES.saveRosterRequired}</p> : null}
            </section>
            <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">조 설정</h2>
              <input className="mt-3 w-full border border-[var(--border)] p-2 disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!canCreateGroupSizes} max={personCount || groupCount} min="1" onChange={(event) => updateGroupCount(Number(event.target.value))} type="number" value={groupCount} />
              {displayedGroupSizes.map((size, index) => <label className="mt-2 flex justify-between text-sm" key={index}>{formatGroupName(index)}<input className="w-16 border border-[var(--border)] p-1 disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!hasGroupSizes || !canCreateGroupSizes} min="1" onChange={(event) => setGroupSizes(groupSizes.map((item, itemIndex) => itemIndex === index ? Number(event.target.value) : item))} placeholder="정원" type="number" value={size} /></label>)}
              <fieldset className="mt-4" disabled={!canCreateGroupSizes}>
                <legend className="text-sm font-medium">편성 방식</legend>
                <div className="mt-2 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm disabled:cursor-not-allowed"><input checked={useSimilarAge} disabled={!canCreateGroupSizes} onChange={(event) => setUseSimilarAge(event.target.checked)} type="checkbox" />{GROUPING_TOGGLE_LABELS.ageSimilar}</label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm disabled:cursor-not-allowed"><input checked={separateGender} disabled={!canCreateGroupSizes} onChange={(event) => setSeparateGender(event.target.checked)} type="checkbox" />{GROUPING_TOGGLE_LABELS.genderSeparated}</label>
                </div>
              </fieldset>
              <label className="mt-4 block text-sm font-medium">{UI_LABELS.leaderAssignmentMode}<select className="mt-2 w-full border border-[var(--border)] bg-[var(--surface)] p-2 text-sm disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!canCreateGroupSizes} onChange={(event) => setLeaderSelectionMode(event.target.value as LeaderSelectionMode)} value={leaderSelectionMode}>{LEADER_SELECTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <p className="mt-3 text-xs text-[var(--muted)]">{groupSetupMessage}</p>
              <button className={`mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm ${isGroupingAvailable ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`} disabled={!isGroupingAvailable} onClick={() => void runGrouping()} type="button">{isGrouping ? <Spinner size="sm" /> : null}{isGrouping ? UI_LABELS.grouping : "자동 조 편성"}</button>
            </section>
          </aside>
          <section className="min-w-0 border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold">조 편성 결과</h2>{groups.length > 0 ? <p className="mt-1 text-xs text-[var(--muted)]">{GROUPING_STRATEGY_LABELS[resultStrategy]}</p> : null}</div>
              <button className={`flex items-center gap-2 px-3 py-2 text-sm ${canExport ? INPUT_DEPENDENT_BUTTON_CLASSES.enabled : INPUT_DEPENDENT_BUTTON_CLASSES.disabled}`} disabled={!canExport} onClick={exportExcel} type="button"><Download size={16} />내보내기</button>
            </div>
            {!canExport ? <p className="mt-2 text-xs text-[var(--muted)]">{UI_MESSAGES.groupResultsRequired}</p> : null}
            {groups.length === 0 ? <p className="py-16 text-center text-sm text-[var(--muted)]">조 설정 후 자동 조 편성을 실행하세요.</p> : <DndContext collisionDetection={closestCenter} id={GROUP_RESULT_DND_CONTEXT_ID} onDragEnd={onDragEnd} onDragStart={(event) => { const member = groups.flatMap((group) => group.members).find((item) => item.id === event.active.id); setActiveName(member?.name ?? ""); }}><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <GroupColumn group={group} key={group.id} onLeaderAction={handleLeaderAction} />)}</div><DragOverlay>{activeName ? <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow">{activeName}</div> : null}</DragOverlay></DndContext>}
          </section>
        </div>
      </div>
    </main>
  );
}
