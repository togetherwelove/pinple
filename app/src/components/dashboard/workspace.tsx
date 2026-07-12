"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Download, GripVertical, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  GROUPING_LIMITS,
  GROUPING_STRATEGIES,
  GROUPING_STRATEGY_LABELS,
  GROUPING_TOGGLE_LABELS,
  GROUP_RESULT_DND_CONTEXT_ID,
  EXCEL_EXPORT,
  UI_MESSAGES,
  displayGroupName,
  formatGroupName,
} from "@/lib/config/app";
import { reorderGroupMembers } from "@/lib/grouping/reorder-group-members";
import { parseRosterText } from "@/lib/roster/parse-roster";
import { readRosterFile } from "@/lib/roster/read-roster-file";
import type {
  Group,
  GroupResultMembers,
  GroupingStrategy,
} from "@/lib/types/domain";

type Person = { age: number; gender: "M" | "F"; id: string; name: string };
type Project = { id: string; people: Person[]; title: string };
type Props = { initialGroups: GroupResultMembers | null; initialResultId: string | null; project: Project | null };

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
    .map((person) => `${person.name}, ${person.gender === "M" ? "남" : "여"}, ${person.age}`)
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

function MemberCard({ member }: { member: Person }) {
  /* eslint-disable react-hooks/refs */
  const sortable = useSortable({ id: member.id });
  const transform = sortable.transform
    ? `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`
    : undefined;

  return <li ref={sortable.setNodeRef} {...sortable.attributes} {...sortable.listeners} className="flex touch-none cursor-grab items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm active:cursor-grabbing" style={{ opacity: sortable.isDragging ? 0.35 : undefined, transform, transition: sortable.transition }}><GripVertical size={14} className="text-[var(--muted)]" /><span>{member.name}</span><span className="ml-auto text-xs text-[var(--muted)]">{member.gender === "M" ? "male" : "female"} · {member.age}</span></li>;
}

function GroupColumn({ group }: { group: Group }) {
  /* eslint-disable react-hooks/refs */
  const droppable = useDroppable({ id: group.id });
  return <section ref={droppable.setNodeRef} className="min-h-40 border border-[var(--border)] bg-[var(--surface)]"><header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2"><strong className="text-sm">{displayGroupName(group.name)}</strong><span className="text-xs text-[var(--muted)]">{group.members.length} / {group.targetSize}</span></header><SortableContext items={group.members.map((member) => member.id)} strategy={verticalListSortingStrategy}><ul>{group.members.map((member) => <MemberCard key={member.id} member={member} />)}</ul></SortableContext></section>;
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
  const [notice, setNotice] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const capacity = useMemo(() => groupSizes.reduce((sum, size) => sum + size, 0), [groupSizes]);
  const personCount = project?.people.length ?? 0;
  const canCreateProject = projectTitle.trim().length > 0;
  const canSaveRoster = rosterText.trim().length > 0;
  const canCreateGroupSizes = personCount > 0;
  const hasGroupSizes = groupSizes.length > 0;
  const displayedGroupSizes = hasGroupSizes ? groupSizes : Array.from({ length: groupCount }, () => "");
  const canRunGrouping = canCreateGroupSizes && hasGroupSizes && capacity === personCount;
  const canExport = groups.length > 0;
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
    try {
      const created = await jsonRequest<{ id: string }>("/api/projects", "POST", { title: projectTitle });
      router.push(`/dashboard?project=${created.id}`);
    } catch (error) { showError(error instanceof Error ? error.message : "명단을 만들지 못했습니다."); }
  }
  async function saveRoster() {
    if (!project) return;
    try {
      const result = await jsonRequest<{ people: Person[] }>(`/api/projects/${project.id}/people`, "PUT", { people: parseRosterText(rosterText) });
      setRosterText(formatRosterText(result.people));
      router.refresh();
    } catch (error) { showError(error instanceof Error ? error.message : "명단을 저장하지 못했습니다."); }
  }
  async function uploadFile(file: File) {
    try {
      setRosterText(await readRosterFile(file));
    } catch { showError("파일을 읽지 못했습니다. CSV 또는 Excel 파일인지 확인해 주세요."); }
  }
  async function runGrouping() {
    if (!project) return;
    try {
      const result = await jsonRequest<{ id: string; members: GroupResultMembers }>(`/api/projects/${project.id}/group-results`, "POST", { groupSizes, strategy: selectedStrategy });
      setGroups(result.members.groups); setResultId(result.id); setResultStrategy(result.members.strategy ?? selectedStrategy); router.refresh();
    } catch (error) { showError(error instanceof Error ? error.message : "조 편성에 실패했습니다."); }
  }
  async function onDragEnd(event: DragEndEvent) {
    const memberId = String(event.active.id); const targetId = event.over ? String(event.over.id) : "";
    setActiveName(""); if (!resultId) return;
    const previous = groups; const next = reorderGroupMembers(groups, memberId, targetId);
    if (!next) return;
    setGroups(next);
    try { await jsonRequest(`/api/group-results/${resultId}`, "PATCH", { groups: next, strategy: resultStrategy }); } catch (error) { setGroups(previous); showError(error instanceof Error ? error.message : "변경 사항을 저장하지 못했습니다."); }
  }
  function exportExcel() {
    const rows = groups.flatMap((group) => group.members.map((member) => ({ "조명": displayGroupName(group.name), "나이": member.age, "성별": member.gender === "M" ? "male" : "female", "이름": member.name })));
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
            <button className="mt-3 flex items-center gap-2 bg-[var(--accent)] px-4 py-3 text-white disabled:cursor-not-allowed disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!canCreateProject} onClick={createProject} type="button"><Plus size={16} />새로운 명단 시작</button>
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
          <div><p className="text-sm text-[var(--muted)]">GroupFlow</p><h1 className="text-2xl font-semibold">{project.title}</h1></div>
          <span className="text-sm text-[var(--muted)]">{personCount}명</span>
        </header>
        {notice ? <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{notice}</div> : null}
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <section className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">명단 입력</h2>
              <textarea className="mt-3 min-h-48 w-full border border-[var(--border)] p-3 text-sm" onChange={(event) => setRosterText(event.target.value)} placeholder="이름, 성별, 나이" value={rosterText} />
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm"><Upload size={16} />Excel 또는 CSV 불러오기<input accept=".csv,.xls,.xlsx" className="hidden" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0])} type="file" /></label>
              <button className="mt-3 w-full bg-[var(--accent)] py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!canSaveRoster} onClick={saveRoster} type="button">명단 저장</button>
              {!canSaveRoster ? <p className="mt-2 text-xs text-[var(--muted)]">{UI_MESSAGES.saveRosterRequired}</p> : null}
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
              <p className="mt-3 text-xs text-[var(--muted)]">{groupSetupMessage}</p>
              <button className="mt-3 w-full border border-[var(--border)] bg-[var(--ink)] py-2 text-sm text-black disabled:cursor-not-allowed disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!canRunGrouping} onClick={runGrouping} type="button">자동 조 편성</button>
            </section>
          </aside>
          <section className="min-w-0 border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold">조 편성 결과</h2>{groups.length > 0 ? <p className="mt-1 text-xs text-[var(--muted)]">{GROUPING_STRATEGY_LABELS[resultStrategy]}</p> : null}</div>
              <button className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-[var(--canvas)] disabled:text-[var(--muted)]" disabled={!canExport} onClick={exportExcel} type="button"><Download size={16} />내보내기</button>
            </div>
            {!canExport ? <p className="mt-2 text-xs text-[var(--muted)]">{UI_MESSAGES.groupResultsRequired}</p> : null}
            {groups.length === 0 ? <p className="py-16 text-center text-sm text-[var(--muted)]">조 설정 후 자동 조 편성을 실행하세요.</p> : <DndContext collisionDetection={closestCenter} id={GROUP_RESULT_DND_CONTEXT_ID} onDragEnd={onDragEnd} onDragStart={(event) => { const member = groups.flatMap((group) => group.members).find((item) => item.id === event.active.id); setActiveName(member?.name ?? ""); }}><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <GroupColumn group={group} key={group.id} />)}</div><DragOverlay>{activeName ? <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow">{activeName}</div> : null}</DragOverlay></DndContext>}
          </section>
        </div>
      </div>
    </main>
  );
}
