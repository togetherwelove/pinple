"use client";

import { DndContext, DragOverlay, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Download, GripVertical, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { parseRosterText } from "@/lib/roster/parse-roster";
import { readRosterFile } from "@/lib/roster/read-roster-file";
import type { Group, GroupResultMembers } from "@/lib/types/domain";

type Person = { age: number; gender: "M" | "F"; id: string; name: string };
type Project = { id: string; people: Person[]; title: string };
type Props = { initialGroups: GroupResultMembers | null; initialResultId: string | null; project: Project | null };

function defaultGroupSizes(total: number, count: number) {
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => base + (index < total % count ? 1 : 0));
}

function formatRosterText(people: Person[]) {
  return people
    .map((person) => `${person.name}, ${person.gender === "M" ? "남" : "여"}, ${person.age}`)
    .join("\n");
}

function MemberCard({ member }: { member: Person }) {
  /* eslint-disable react-hooks/refs */
  const sortable = useSortable({ id: member.id });
  return <li ref={sortable.setNodeRef} {...sortable.attributes} {...sortable.listeners} className="flex cursor-grab items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm active:cursor-grabbing"><GripVertical size={14} className="text-[var(--muted)]" /><span>{member.name}</span><span className="ml-auto text-xs text-[var(--muted)]">{member.gender === "M" ? "male" : "female"} · {member.age}</span></li>;
}

function GroupColumn({ group }: { group: Group }) {
  /* eslint-disable react-hooks/refs */
  const droppable = useDroppable({ id: group.id });
  return <section ref={droppable.setNodeRef} className="min-h-40 border border-[var(--border)] bg-[var(--surface)]"><header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2"><strong className="text-sm">{group.name}</strong><span className="text-xs text-[var(--muted)]">{group.members.length} / {group.targetSize}</span></header><SortableContext items={group.members.map((member) => member.id)} strategy={verticalListSortingStrategy}><ul>{group.members.map((member) => <MemberCard key={member.id} member={member} />)}</ul></SortableContext></section>;
}

export function Workspace({ initialGroups, initialResultId, project }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initialGroups?.groups ?? []);
  const [resultId, setResultId] = useState(initialResultId);
  const [projectTitle, setProjectTitle] = useState("");
  const [rosterText, setRosterText] = useState(() => formatRosterText(project?.people ?? []));
  const [groupCount, setGroupCount] = useState(2);
  const [groupSizes, setGroupSizes] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const capacity = useMemo(() => groupSizes.reduce((sum, size) => sum + size, 0), [groupSizes]);
  const personCount = project?.people.length ?? 0;

  function showError(message: string) { setNotice(message); }
  async function jsonRequest<T>(url: string, method: "POST" | "PATCH" | "PUT", body: unknown): Promise<T> {
    const response = await fetch(url, { body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, method });
    if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "요청을 처리하지 못했습니다.");
    return response.json() as Promise<T>;
  }
  async function createProject() {
    try {
      const created = await jsonRequest<{ id: string }>("/api/projects", "POST", { title: projectTitle });
      router.push(`/dashboard?project=${created.id}`);
    } catch (error) { showError(error instanceof Error ? error.message : "프로젝트를 만들지 못했습니다."); }
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
      const result = await jsonRequest<{ id: string; members: GroupResultMembers }>(`/api/projects/${project.id}/group-results`, "POST", { groupSizes });
      setGroups(result.members.groups); setResultId(result.id); router.refresh();
    } catch (error) { showError(error instanceof Error ? error.message : "그룹화에 실패했습니다."); }
  }
  async function onDragEnd(event: DragEndEvent) {
    const memberId = String(event.active.id); const targetId = event.over ? String(event.over.id) : "";
    const fromIndex = groups.findIndex((group) => group.members.some((member) => member.id === memberId));
    const toIndex = groups.findIndex((group) => group.id === targetId);
    setActiveName(""); if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || !resultId) return;
    const previous = groups; const next = groups.map((group) => ({ ...group, members: [...group.members] }));
    const member = next[fromIndex].members.find((item) => item.id === memberId); if (!member) return;
    next[fromIndex].members = next[fromIndex].members.filter((item) => item.id !== memberId); next[toIndex].members.push(member); setGroups(next);
    try { await jsonRequest(`/api/group-results/${resultId}`, "PATCH", { groups: next }); } catch (error) { setGroups(previous); showError(error instanceof Error ? error.message : "변경 사항을 저장하지 못했습니다."); }
  }
  function exportExcel() {
    const rows = groups.flatMap((group) => group.members.map((member) => ({ "그룹명": group.name, "나이": member.age, "성별": member.gender === "M" ? "male" : "female", "이름": member.name })));
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "그룹 결과"); XLSX.writeFile(workbook, `${project?.title ?? "프로젝트"}_그룹결과.xlsx`);
  }
  if (!project) return <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-6"><section className="w-full max-w-md text-center"><p className="text-sm text-[var(--muted)]">새 작업을 시작하세요</p><h1 className="mt-3 text-2xl font-semibold">첫 프로젝트를 만들어 보세요.</h1><p className="mt-2 text-sm text-[var(--muted)]">명단을 붙여넣고 균형 잡힌 그룹을 바로 구성할 수 있습니다.</p><div className="mt-6 border border-[var(--border)] bg-[var(--surface)] p-5 text-left"><input className="w-full border border-[var(--border)] p-3" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="프로젝트 이름" /><button className="mt-3 flex items-center gap-2 bg-[var(--accent)] px-4 py-3 text-white" onClick={createProject} type="button"><Plus size={16} />새 프로젝트 시작</button></div></section></main>;
  return <main className="min-h-screen bg-[var(--canvas)] p-4 md:p-8"><div className="mx-auto max-w-7xl"><header className="mb-6 flex justify-between"><div><p className="text-sm text-[var(--muted)]">GroupFlow</p><h1 className="text-2xl font-semibold">{project.title}</h1></div><span className="text-sm text-[var(--muted)]">{personCount}명</span></header>{notice && <div role="alert" className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{notice}</div>}<div className="grid gap-5 lg:grid-cols-[360px_1fr]"><aside className="space-y-5"><section className="border border-[var(--border)] bg-[var(--surface)] p-4"><h2 className="font-semibold">명단 입력</h2><textarea className="mt-3 min-h-48 w-full border border-[var(--border)] p-3 text-sm" value={rosterText} onChange={(event) => setRosterText(event.target.value)} placeholder="이름, 성별, 나이" /><label className="mt-3 flex cursor-pointer items-center gap-2 text-sm"><Upload size={16} />Excel 또는 CSV 불러오기<input className="hidden" accept=".csv,.xls,.xlsx" type="file" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0])} /></label><button className="mt-3 w-full bg-[var(--accent)] py-2 text-sm text-white" onClick={saveRoster} type="button">명단 저장</button></section><section className="border border-[var(--border)] bg-[var(--surface)] p-4"><h2 className="font-semibold">그룹 설정</h2><input className="mt-3 w-full border border-[var(--border)] p-2" min="1" max={personCount || 1} type="number" value={groupCount} onChange={(event) => setGroupCount(Number(event.target.value))} /><button className="mt-2 border border-[var(--border)] px-3 py-2 text-sm" onClick={() => setGroupSizes(defaultGroupSizes(personCount, groupCount))} type="button">기본 정원 만들기</button>{groupSizes.map((size, index) => <label className="mt-2 flex justify-between text-sm" key={index}>그룹 {index + 1}<input className="w-16 border border-[var(--border)] p-1" min="1" type="number" value={size} onChange={(event) => setGroupSizes(groupSizes.map((item, itemIndex) => itemIndex === index ? Number(event.target.value) : item))} /></label>)}{groupSizes.length > 0 && <><p className="mt-3 text-xs text-[var(--muted)]">정원 합계: {capacity} / {personCount}</p><button className="mt-3 w-full bg-[var(--ink)] py-2 text-sm text-black disabled:opacity-40 border" disabled={capacity !== personCount} onClick={runGrouping} type="button">자동 그룹화</button></>}</section></aside><section className="min-w-0 border border-[var(--border)] bg-[var(--surface)] p-4"><div className="flex justify-between"><h2 className="font-semibold">그룹 결과</h2><button className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm" onClick={exportExcel} type="button"><Download size={16} />내보내기</button></div>{groups.length === 0 ? <p className="py-16 text-center text-sm text-[var(--muted)]">그룹 설정 후 자동 그룹화를 실행하세요.</p> : <DndContext onDragEnd={onDragEnd} onDragStart={(event) => { const member = groups.flatMap((group) => group.members).find((item) => item.id === event.active.id); setActiveName(member?.name ?? ""); }}><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <GroupColumn key={group.id} group={group} />)}</div><DragOverlay>{activeName && <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow">{activeName}</div>}</DragOverlay></DndContext>}</section></div></div></main>;
}
