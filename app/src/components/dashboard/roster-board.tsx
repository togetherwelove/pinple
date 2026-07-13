"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes render-time bindings through hook return values. */

import { closestCenter, DndContext, DragOverlay, type DragEndEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Crown, Download, GripVertical, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import * as XLSX from "xlsx";
import {
  EXCEL_EXPORT,
  GENDER,
  GENDER_LABELS,
  ROSTER_BOARD,
  ROSTER_BOARD_DND_CONTEXT_ID,
  UNKNOWN_AGE_LABEL,
  UI_LABELS,
  displayGroupName,
} from "@/lib/config/app";
import { LeaderConflictDialog } from "@/components/dashboard/leader-conflict-dialog";
import { setGroupLeader } from "@/lib/grouping/leader-assignment";
import { allBoardPeople } from "@/lib/roster-board/draft";
import { reorderBoardMembers, UNASSIGNED_COLUMN_ID } from "@/lib/roster-board/reorder-board-members";
import { exportRosterToExcel } from "@/lib/roster/export-roster";
import type { Group, GroupMember, PersonInput, RosterBoardDraft } from "@/lib/types/domain";

type LeaderConflict = {
  leaderId: string;
  nextDraft: RosterBoardDraft;
  targetGroupId: string;
};

type RosterBoardProps = {
  draft: RosterBoardDraft;
  leftPanelFooter: ReactNode;
  leftPanelHeader: ReactNode;
  onDraftChange: (draft: RosterBoardDraft) => void;
  onRemovePerson: (personId: string, groupId: string | null) => void;
  onUpdateUnassignedPerson: (personId: string, updates: PersonInput) => void;
  rightPanelHeader: ReactNode;
  rosterTitle: string;
  totalPeople: number;
};

type MemberCardProps = {
  groupId: string | null;
  member: GroupMember;
  onDelete: (personId: string, groupId: string | null) => void;
  onEdit?: (member: GroupMember) => void;
  onLeaderAction?: (groupId: string, member: GroupMember) => void;
};

function SortableMemberCard({
  groupId,
  member,
  onDelete,
  onEdit,
  onLeaderAction,
}: MemberCardProps) {
  const sortable = useSortable({ id: member.id });
  const transform = sortable.transform
    ? `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`
    : undefined;
  const leaderActionLabel = member.isLeader ? UI_LABELS.revokeLeader : UI_LABELS.appointLeader;

  return (
    <li
      className={`flex touch-none items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm ${member.isLeader ? "bg-amber-50" : ""}`}
      ref={sortable.setNodeRef}
      style={{ opacity: sortable.isDragging ? 0.35 : undefined, transform, transition: sortable.transition }}
    >
      <button
        aria-label={ROSTER_BOARD.movePerson}
        className="cursor-grab touch-none text-[var(--muted)] active:cursor-grabbing"
        type="button"
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical size={14} />
      </button>
      {member.isLeader ? (
        <Crown aria-label={UI_LABELS.leader} className="shrink-0 text-amber-600" fill="currentColor" size={14} />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{member.name}</span>
      <span className="shrink-0 text-xs text-[var(--muted)]">
        {GENDER_LABELS[member.gender]} · {member.age ?? UNKNOWN_AGE_LABEL}
      </span>
      {groupId === null && onEdit ? (
        <button
          aria-label={ROSTER_BOARD.editPerson}
          className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
          onClick={() => onEdit(member)}
          type="button"
        >
          <Pencil size={14} />
        </button>
      ) : null}
      {groupId !== null && onLeaderAction ? (
        <button
          aria-label={leaderActionLabel}
          className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-amber-700"
          onClick={() => onLeaderAction(groupId, member)}
          type="button"
        >
          <Crown fill={member.isLeader ? "currentColor" : "none"} size={14} />
        </button>
      ) : null}
      <button
        aria-label={ROSTER_BOARD.removePerson}
        className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-red-50 hover:text-red-700"
        onClick={() => onDelete(member.id, groupId)}
        title={ROSTER_BOARD.removePerson}
        type="button"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function BoardColumn({
  compact = false,
  group,
  members,
  onDelete,
  onEdit,
  onLeaderAction,
  title,
}: {
  compact?: boolean;
  group: Group | null;
  members: GroupMember[];
  onDelete: (personId: string, groupId: string | null) => void;
  onEdit?: (member: GroupMember) => void;
  onLeaderAction?: (groupId: string, member: GroupMember) => void;
  title: string;
}) {
  const columnId = group?.id ?? UNASSIGNED_COLUMN_ID;
  const droppable = useDroppable({ id: columnId });
  const memberCountText = `${members.length}`;

  return (
    <section
      className={
        compact
          ? "min-h-28 w-full border border-[var(--border)] bg-[var(--surface)]"
          : "min-h-48 min-w-0 border border-[var(--border)] bg-[var(--surface)]"
      }
      ref={droppable.setNodeRef}
    >
      <header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <strong className="text-sm">{title}</strong>
        <span className="text-xs text-[var(--muted)]">{memberCountText}</span>
      </header>
      <SortableContext items={members.map((member) => member.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {members.map((member) => (
            <SortableMemberCard
              groupId={group?.id ?? null}
              key={member.id}
              member={member}
              onDelete={onDelete}
              onEdit={onEdit}
              onLeaderAction={onLeaderAction}
            />
          ))}
        </ul>
      </SortableContext>
      {members.length === 0 && group === null ? (
        <p className="px-3 py-6 text-center text-xs text-[var(--muted)]">{ROSTER_BOARD.emptyUnassigned}</p>
      ) : null}
    </section>
  );
}

function PersonEditorDialog({
  member,
  onClose,
  onDelete,
  onSave,
}: {
  member: GroupMember;
  onClose: () => void;
  onDelete: () => void;
  onSave: (updates: PersonInput) => void;
}) {
  const [name, setName] = useState(member.name);
  const [age, setAge] = useState(member.age === null ? "" : String(member.age));
  const [gender, setGender] = useState(member.gender);

  function save() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return;
    }

    onSave({
      age: age === "" ? null : Number(age),
      gender,
      name: normalizedName,
    });
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog">
      <section className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <h2 className="font-semibold">{ROSTER_BOARD.personEditorTitle}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{ROSTER_BOARD.personEditorDescription}</p>
        <label className="mt-4 block text-sm">
          {ROSTER_BOARD.personName}
          <input className="mt-1 w-full border border-[var(--border)] p-2" onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            {ROSTER_BOARD.personAge}
            <input className="mt-1 w-full border border-[var(--border)] p-2" min="0" onChange={(event) => setAge(event.target.value)} type="number" value={age} />
          </label>
          <label className="text-sm">
            {ROSTER_BOARD.personGender}
            <select className="mt-1 w-full border border-[var(--border)] bg-[var(--surface)] p-2" onChange={(event) => setGender(event.target.value as GroupMember["gender"])} value={gender}>
              <option value={GENDER.male}>{GENDER_LABELS[GENDER.male]}</option>
              <option value={GENDER.female}>{GENDER_LABELS[GENDER.female]}</option>
              <option value={GENDER.unknown}>{GENDER_LABELS[GENDER.unknown]}</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-between gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50" onClick={onDelete} type="button">
            <Trash2 size={15} />
            {ROSTER_BOARD.removePerson}
          </button>
          <div className="flex gap-2">
            <button className="border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--canvas)]" onClick={onClose} type="button">
              {UI_LABELS.cancel}
            </button>
            <button className="bg-[var(--ink)] px-3 py-2 text-sm text-[var(--surface)] hover:opacity-90" disabled={!name.trim()} onClick={save} type="button">
              {ROSTER_BOARD.savePerson}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RosterBoard({
  draft,
  leftPanelFooter,
  leftPanelHeader,
  onDraftChange,
  onRemovePerson,
  onUpdateUnassignedPerson,
  rightPanelHeader,
  rosterTitle,
  totalPeople,
}: RosterBoardProps) {
  const [activeName, setActiveName] = useState("");
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [leaderConflict, setLeaderConflict] = useState<LeaderConflict | null>(null);
  const hasGroupMembers = draft.groups.some((group) => group.members.length > 0);
  const hasRosterPeople = totalPeople > 0;

  function handleLeaderAction(groupId: string, member: GroupMember) {
    onDraftChange({
      ...draft,
      groups: setGroupLeader(draft.groups, groupId, member.isLeader ? null : member.id),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const memberId = String(event.active.id);
    const targetId = event.over ? String(event.over.id) : "";
    setActiveName("");

    const nextDraft = reorderBoardMembers(draft, memberId, targetId);

    if (!nextDraft) {
      return;
    }

    const targetGroup = nextDraft.groups.find((group) =>
      group.members.some((member) => member.id === memberId),
    );
    const movedMember = targetGroup?.members.find((member) => member.id === memberId);
    const leaderCount = targetGroup?.members.filter((member) => member.isLeader).length ?? 0;

    if (movedMember?.isLeader && leaderCount > 1 && targetGroup) {
      setLeaderConflict({ leaderId: memberId, nextDraft, targetGroupId: targetGroup.id });
      return;
    }

    onDraftChange(nextDraft);
  }

  function resolveLeaderConflict(replaceTargetLeader: boolean) {
    if (!leaderConflict) {
      return;
    }

    const targetGroup = leaderConflict.nextDraft.groups.find(
      (group) => group.id === leaderConflict.targetGroupId,
    );
    const currentLeader = targetGroup?.members.find(
      (member) => member.isLeader && member.id !== leaderConflict.leaderId,
    );
    const leaderId = replaceTargetLeader ? leaderConflict.leaderId : currentLeader?.id ?? null;

    onDraftChange({
      ...leaderConflict.nextDraft,
      groups: setGroupLeader(leaderConflict.nextDraft.groups, leaderConflict.targetGroupId, leaderId),
    });
    setLeaderConflict(null);
  }

  function exportExcel() {
    const rows = draft.groups.flatMap((group) =>
      group.members.map((member) => ({
        "나이": member.age ?? UNKNOWN_AGE_LABEL,
        "성별": GENDER_LABELS[member.gender],
        "이름": member.name,
        "조명": displayGroupName(group.name),
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), EXCEL_EXPORT.sheetName);
    XLSX.writeFile(workbook, `${rosterTitle}_${EXCEL_EXPORT.fileNameSuffix}.xlsx`);
  }

  function exportRoster() {
    exportRosterToExcel(allBoardPeople(draft), rosterTitle);
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      id={ROSTER_BOARD_DND_CONTEXT_ID}
      onDragEnd={handleDragEnd}
      onDragStart={(event) => {
        const member = [...draft.unassigned, ...draft.groups.flatMap((group) => group.members)].find(
          (item) => item.id === event.active.id,
        );
        setActiveName(member?.name ?? "");
      }}
    >
      {leaderConflict ? (
        <LeaderConflictDialog
          onReplaceTargetLeader={() => resolveLeaderConflict(true)}
          onRetainTargetLeader={() => resolveLeaderConflict(false)}
        />
      ) : null}
      {editingMember ? (
        <PersonEditorDialog
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onDelete={() => {
            onRemovePerson(editingMember.id, null);
            setEditingMember(null);
          }}
          onSave={(updates) => {
            onUpdateUnassignedPerson(editingMember.id, updates);
            setEditingMember(null);
          }}
        />
      ) : null}
      <div className="flex h-full min-h-0 flex-col bg-[var(--canvas)] lg:flex-row">
        <aside className="flex max-h-[65vh] w-full shrink-0 flex-col overflow-y-auto border-b border-[var(--border)] bg-[var(--surface)] lg:h-full lg:max-h-none lg:w-80 lg:border-r lg:border-b-0">
          <div className="shrink-0 p-4">{leftPanelHeader}</div>
          <div className="shrink-0 p-4 pt-0">
            <BoardColumn
              compact
              group={null}
              members={draft.unassigned}
              onDelete={onRemovePerson}
              onEdit={setEditingMember}
              title={ROSTER_BOARD.unassigned}
            />
          </div>
          <div className="flex-1 border-t border-[var(--border)] p-4">
            {leftPanelFooter}
          </div>
        </aside>
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[var(--canvas)] p-4 md:p-6">
          {rightPanelHeader}
          <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{ROSTER_BOARD.boardTitle}</h2>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-sm text-[var(--muted)]">{totalPeople}명</span>
                <button
                  className={`flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm ${hasRosterPeople ? "bg-[var(--surface)] hover:bg-[var(--canvas)]" : "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]"}`}
                  disabled={!hasRosterPeople}
                  onClick={exportRoster}
                  type="button"
                >
                  <Download size={16} />
                  {ROSTER_BOARD.exportRoster}
                </button>
                <button
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${hasGroupMembers ? "bg-[var(--ink)] text-[var(--surface)] hover:opacity-90" : "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]"}`}
                  disabled={!hasGroupMembers}
                  onClick={exportExcel}
                  type="button"
                >
                  <Download size={16} />
                  {ROSTER_BOARD.export}
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
              {draft.groups.map((group) => (
                <BoardColumn
                  group={group}
                  key={group.id}
                  members={group.members}
                  onDelete={onRemovePerson}
                  onLeaderAction={handleLeaderAction}
                  title={displayGroupName(group.name)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
      <DragOverlay>
        {activeName ? (
          <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow">
            {activeName}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
