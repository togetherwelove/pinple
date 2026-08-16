"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes render-time bindings through hook return values. */

import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Check, Crown, Download, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  EXCEL_EXPORT,
  GROUPING_LIMITS,
  ROSTER_BOARD,
  ROSTER_BOARD_DRAG_ACTIVATION_DISTANCE,
  ROSTER_BOARD_DND_CONTEXT_ID,
  UI_LABELS,
  displayGroupName,
} from "@/lib/config/app";
import { GroupUnassignDialog } from "@/components/dashboard/group-unassign-dialog";
import { LeaderConflictDialog } from "@/components/dashboard/leader-conflict-dialog";
import { ExportTitleDialog } from "@/components/dashboard/export-title-dialog";
import { setGroupLeader } from "@/lib/grouping/leader-assignment";
import { allBoardPeople } from "@/lib/roster-board/draft";
import { exportGroupResultsToExcel } from "@/lib/roster/export-group-results";
import { exportRosterToExcel } from "@/lib/roster/export-roster";
import {
  groupIdFromOrderItemId,
  groupOrderItemId,
  moveGroupMembersToUnassigned,
  moveMemberToNewGroup,
  NEW_GROUP_COLUMN_ID,
  reorderBoardGroups,
  reorderBoardMembers,
  UNASSIGNED_COLUMN_ID,
} from "@/lib/roster-board/reorder-board-members";
import type { Group, GroupMember, PersonInput, RosterBoardDraft } from "@/lib/types/domain";

type LeaderConflict = {
  leaderId: string;
  nextDraft: RosterBoardDraft;
  targetGroupId: string;
};

type GroupUnassignConfirmation = {
  groupName: string;
  memberCount: number;
  nextDraft: RosterBoardDraft;
};

type RosterBoardProps = {
  draft: RosterBoardDraft;
  leftPanelFooter: ReactNode;
  leftPanelHeader: ReactNode;
  onDraftChange: (draft: RosterBoardDraft) => void;
  onRemovePerson: (personId: string, groupId: string | null) => void;
  onUpdateUnassignedPerson: (personId: string, updates: PersonInput) => void;
  rightPanelHeader: ReactNode;
  totalPeople: number;
};

type MemberCardProps = {
  groupId: string | null;
  member: GroupMember;
  onDelete: (personId: string, groupId: string | null) => void;
  onEdit?: (member: GroupMember) => void;
  onLeaderAction?: (groupId: string, member: GroupMember) => void;
  onRename?: (memberId: string, name: string) => void;
};

type InlineTitleEditor = {
  onCancel: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  value: string;
};

const EXPORT_TARGETS = {
  groupResult: "group-result",
  roster: "roster",
} as const;

type ExportTarget = (typeof EXPORT_TARGETS)[keyof typeof EXPORT_TARGETS];

const boardCollisionDetection: CollisionDetection = (arguments_) => {
  const pointerCollisions = pointerWithin(arguments_).filter(
    (collision) => String(collision.id) !== String(arguments_.active.id),
  );

  return pointerCollisions.length > 0
    ? pointerCollisions
    : closestCenter(arguments_);
};

function SortableMemberCard({
  groupId,
  member,
  onDelete,
  onEdit,
  onLeaderAction,
  onRename,
}: MemberCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(member.name);
  const sortable = useSortable({ disabled: isEditingName, id: member.id });
  const transform = sortable.transform
    ? `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`
    : undefined;
  const leaderActionLabel = member.isLeader ? UI_LABELS.revokeLeader : UI_LABELS.appointLeader;

  function cancelEditingName() {
    setName(member.name);
    setIsEditingName(false);
  }

  function saveName() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      cancelEditingName();
      return;
    }

    onRename?.(member.id, normalizedName);
    setName(normalizedName);
    setIsEditingName(false);
  }

  return (
    <li
      className={`group flex touch-none items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-sm last:border-b-0 ${member.isLeader ? "bg-amber-50" : ""}`}
      ref={sortable.setNodeRef}
      style={{ opacity: sortable.isDragging ? 0.35 : undefined, transform, transition: sortable.transition }}
    >
      {isEditingName ? (
        <>
          <input
            aria-label={ROSTER_BOARD.personName}
            autoFocus
            className="min-w-0 flex-1 border border-[var(--ink)] bg-[var(--surface)] px-2 py-1 text-sm outline-none"
            onBlur={saveName}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveName();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditingName();
              }
            }}
            value={name}
          />
          <button
            aria-label={ROSTER_BOARD.savePerson}
            className="flex size-7 shrink-0 items-center justify-center bg-[var(--ink)] text-[var(--surface)] hover:opacity-90"
            onClick={saveName}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            <Check size={14} />
          </button>
          <button
            aria-label={UI_LABELS.cancel}
            className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
            onClick={cancelEditingName}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <div
          aria-label={ROSTER_BOARD.movePerson}
          className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical className="shrink-0 text-[var(--muted)]" size={14} />
          {member.isLeader ? (
            <Crown aria-label={UI_LABELS.leader} className="shrink-0 text-amber-600" fill="currentColor" size={14} />
          ) : null}
          <span
            className="min-w-0 flex-1 truncate"
            onPointerUp={() => {
              if (onRename && !sortable.isDragging) {
                setName(member.name);
                setIsEditingName(true);
              }
            }}
          >
            {member.name}
          </span>
        </div>
      )}
      {!isEditingName && groupId === null && onEdit ? (
        <button
          aria-label={ROSTER_BOARD.editPerson}
          className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
          onClick={() => onEdit(member)}
          type="button"
        >
          <Pencil size={14} />
        </button>
      ) : null}
      {!isEditingName && groupId !== null && onLeaderAction ? (
        <button
          aria-label={leaderActionLabel}
          className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] transition-opacity hover:bg-[var(--canvas)] hover:text-amber-700 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
          onClick={() => onLeaderAction(groupId, member)}
          type="button"
        >
          <Crown fill={member.isLeader ? "currentColor" : "none"} size={14} />
        </button>
      ) : null}
      {!isEditingName ? (
        <button
          aria-label={ROSTER_BOARD.removePerson}
          className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] transition-opacity hover:bg-red-50 hover:text-red-700 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
          onClick={() => onDelete(member.id, groupId)}
          title={ROSTER_BOARD.removePerson}
          type="button"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </li>
  );
}

function BoardColumn({
  compact = false,
  countText,
  dragHandle,
  inlineTitleEditor,
  group,
  isGroupDragging = false,
  members,
  onDelete,
  onEdit,
  onLeaderAction,
  onRenameMember,
  onTitleActivate,
  title,
}: {
  compact?: boolean;
  countText?: string;
  dragHandle?: Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">;
  inlineTitleEditor?: InlineTitleEditor;
  group: Group | null;
  isGroupDragging?: boolean;
  members: GroupMember[];
  onDelete: (personId: string, groupId: string | null) => void;
  onEdit?: (member: GroupMember) => void;
  onLeaderAction?: (groupId: string, member: GroupMember) => void;
  onRenameMember?: (memberId: string, name: string) => void;
  onTitleActivate?: () => void;
  title: string;
}) {
  const columnId = group?.id ?? UNASSIGNED_COLUMN_ID;
  const droppable = useDroppable({ id: columnId });
  const memberCountText = countText ?? `${members.length}`;
  const dropStateClass = droppable.isOver
    ? "border-[var(--ink)] bg-[var(--canvas)]"
    : "border-[var(--border)] bg-[var(--surface)]";

  return (
    <section
      aria-label={title}
      className={
        compact
          ? `flex max-h-[min(40vh,24rem)] min-h-28 w-full flex-col overflow-hidden border transition-colors ${dropStateClass}`
          : `min-h-48 min-w-0 border transition-colors ${dropStateClass}`
      }
      ref={droppable.setNodeRef}
    >
      <header className="flex min-h-10 items-center gap-1 border-b border-[var(--border)] px-3 py-1.5">
        {inlineTitleEditor ? (
          <>
            <input
              aria-label={ROSTER_BOARD.groupName}
              autoFocus
              className="min-w-0 flex-1 border border-[var(--ink)] bg-[var(--surface)] px-2 py-1 text-sm font-semibold outline-none"
              maxLength={GROUPING_LIMITS.groupNameMaximumLength}
              onBlur={inlineTitleEditor.onSave}
              onChange={(event) => inlineTitleEditor.onChange(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  inlineTitleEditor.onSave();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  inlineTitleEditor.onCancel();
                }
              }}
              value={inlineTitleEditor.value}
            />
            <button
              aria-label={UI_LABELS.saveGroupName}
              className="flex size-7 shrink-0 items-center justify-center bg-[var(--ink)] text-[var(--surface)] hover:opacity-90"
              onClick={inlineTitleEditor.onSave}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              <Check size={14} />
            </button>
            <button
              aria-label={UI_LABELS.cancel}
              className="flex size-7 shrink-0 items-center justify-center text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)]"
              onClick={inlineTitleEditor.onCancel}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div
            aria-label={dragHandle ? ROSTER_BOARD.moveGroup : undefined}
            className={`flex min-w-0 flex-1 items-center gap-2 ${dragHandle ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
            {...dragHandle?.attributes}
            {...dragHandle?.listeners}
          >
            {dragHandle ? <GripVertical className="shrink-0 text-[var(--muted)]" size={14} /> : null}
            {onTitleActivate ? (
              <span
                className="min-w-0 flex-1 truncate text-sm font-semibold"
                onPointerUp={() => {
                  if (!isGroupDragging) {
                    onTitleActivate();
                  }
                }}
              >
                {title}
              </span>
            ) : (
              <strong className="min-w-0 flex-1 truncate text-sm">{title}</strong>
            )}
            <span className="shrink-0 text-xs text-[var(--muted)]">{memberCountText}</span>
          </div>
        )}
      </header>
      <SortableContext items={members.map((member) => member.id)} strategy={verticalListSortingStrategy}>
        <ul className={compact ? "min-h-0 overflow-y-auto overscroll-contain" : undefined}>
          {members.map((member) => (
            <SortableMemberCard
              groupId={group?.id ?? null}
              key={member.id}
              member={member}
              onDelete={onDelete}
              onEdit={onEdit}
              onLeaderAction={onLeaderAction}
              onRename={onRenameMember}
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

function SortableGroupColumn({
  group,
  onDelete,
  onLeaderAction,
  onRename,
  onRenameMember,
}: {
  group: Group;
  onDelete: (personId: string, groupId: string | null) => void;
  onLeaderAction: (groupId: string, member: GroupMember) => void;
  onRename: (groupId: string, name: string) => void;
  onRenameMember: (groupId: string, memberId: string, name: string) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(displayGroupName(group.name));
  const sortable = useSortable({
    disabled: isEditingName,
    id: groupOrderItemId(group.id),
  });
  const transform = sortable.transform
    ? `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`
    : undefined;

  function cancelEditingName() {
    setName(displayGroupName(group.name));
    setIsEditingName(false);
  }

  function saveName() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      cancelEditingName();
      return;
    }

    onRename(group.id, normalizedName);
    setName(normalizedName);
    setIsEditingName(false);
  }

  return (
    <div
      className="min-w-0"
      ref={sortable.setNodeRef}
      style={{
        opacity: sortable.isDragging ? 0.35 : undefined,
        transform,
        transition: sortable.transition,
      }}
    >
      <BoardColumn
        dragHandle={
          isEditingName
            ? undefined
            : {
                attributes: sortable.attributes,
                listeners: sortable.listeners,
              }
        }
        group={group}
        inlineTitleEditor={
          isEditingName
            ? {
                onCancel: cancelEditingName,
                onChange: setName,
                onSave: saveName,
                value: name,
              }
            : undefined
        }
        isGroupDragging={sortable.isDragging}
        members={group.members}
        onDelete={onDelete}
        onLeaderAction={onLeaderAction}
        onRenameMember={(memberId, memberName) =>
          onRenameMember(group.id, memberId, memberName)
        }
        onTitleActivate={() => {
          setName(displayGroupName(group.name));
          setIsEditingName(true);
        }}
        title={displayGroupName(group.name)}
      />
    </div>
  );
}

function NewGroupDropZone() {
  const droppable = useDroppable({ id: NEW_GROUP_COLUMN_ID });

  return (
    <section
      aria-label={ROSTER_BOARD.createGroup}
      className={`flex min-h-48 min-w-0 flex-col items-center justify-center border border-dashed p-6 text-center transition-colors ${
        droppable.isOver
          ? "border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)]"
          : "border-[var(--border)] text-[var(--muted)]"
      }`}
      ref={droppable.setNodeRef}
    >
      <Plus size={20} />
      <strong className="mt-2 text-sm">{ROSTER_BOARD.createGroup}</strong>
      <span className="mt-1 text-xs">{ROSTER_BOARD.createGroupHint}</span>
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

  function save() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return;
    }

    onSave({ name: normalizedName });
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
  totalPeople,
}: RosterBoardProps) {
  const [activeName, setActiveName] = useState("");
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null);
  const [groupUnassignConfirmation, setGroupUnassignConfirmation] =
    useState<GroupUnassignConfirmation | null>(null);
  const [leaderConflict, setLeaderConflict] = useState<LeaderConflict | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: ROSTER_BOARD_DRAG_ACTIVATION_DISTANCE },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const hasGroupMembers = draft.groups.some((group) => group.members.length > 0);

  function handleLeaderAction(groupId: string, member: GroupMember) {
    onDraftChange({
      ...draft,
      groups: setGroupLeader(draft.groups, groupId, member.isLeader ? null : member.id),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const targetId = event.over ? String(event.over.id) : "";
    setActiveName("");

    if (!targetId) {
      return;
    }

    const activeGroupId = groupIdFromOrderItemId(activeId);

    if (activeGroupId) {
      const unassignedDraft = moveGroupMembersToUnassigned(
        draft,
        activeId,
        targetId,
      );
      const sourceGroup = draft.groups.find(
        (group) => group.id === activeGroupId,
      );

      if (unassignedDraft && sourceGroup) {
        setGroupUnassignConfirmation({
          groupName: displayGroupName(sourceGroup.name),
          memberCount: sourceGroup.members.length,
          nextDraft: unassignedDraft,
        });
        return;
      }

      const reorderedDraft = reorderBoardGroups(draft, activeId, targetId);

      if (reorderedDraft) {
        onDraftChange(reorderedDraft);
      }

      return;
    }

    const memberId = activeId;
    const nextDraft =
      targetId === NEW_GROUP_COLUMN_ID
        ? moveMemberToNewGroup(draft, memberId, crypto.randomUUID())
        : reorderBoardMembers(draft, memberId, targetId);

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

  return (
    <DndContext
      collisionDetection={boardCollisionDetection}
      id={ROSTER_BOARD_DND_CONTEXT_ID}
      onDragEnd={handleDragEnd}
      onDragStart={(event) => {
        const activeId = String(event.active.id);
        const activeGroupId = groupIdFromOrderItemId(activeId);
        const group = draft.groups.find((item) => item.id === activeGroupId);
        const member = [
          ...draft.unassigned,
          ...draft.groups.flatMap((item) => item.members),
        ].find((item) => item.id === activeId);
        setActiveName(group ? displayGroupName(group.name) : member?.name ?? "");
      }}
      sensors={sensors}
    >
      {groupUnassignConfirmation ? (
        <GroupUnassignDialog
          groupName={groupUnassignConfirmation.groupName}
          memberCount={groupUnassignConfirmation.memberCount}
          onCancel={() => setGroupUnassignConfirmation(null)}
          onConfirm={() => {
            onDraftChange(groupUnassignConfirmation.nextDraft);
            setGroupUnassignConfirmation(null);
          }}
        />
      ) : null}
      {exportTarget ? (
        <ExportTitleDialog
          dialogTitle={
            exportTarget === EXPORT_TARGETS.roster
              ? ROSTER_BOARD.exportRosterTitle
              : ROSTER_BOARD.export
          }
          initialTitle={
            exportTarget === EXPORT_TARGETS.roster
              ? ROSTER_BOARD.rosterTitle
              : EXCEL_EXPORT.groupResultFileTitle
          }
          onCancel={() => setExportTarget(null)}
          onConfirm={(title) => {
            if (exportTarget === EXPORT_TARGETS.roster) {
              exportRosterToExcel(allBoardPeople(draft), title);
            } else {
              exportGroupResultsToExcel(draft.groups, title);
            }

            setExportTarget(null);
          }}
        />
      ) : null}
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
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto bg-[var(--canvas)] p-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6 lg:overflow-hidden lg:p-6">
        <section
          aria-label={ROSTER_BOARD.workArea}
          className="min-w-0 space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1"
        >
          {leftPanelHeader}
          <BoardColumn
            compact
            countText={ROSTER_BOARD.unassignedCount(
              draft.unassigned.length,
              totalPeople,
            )}
            group={null}
            members={draft.unassigned}
            onDelete={onRemovePerson}
            onEdit={setEditingMember}
            title={ROSTER_BOARD.unassigned}
          />
          <div>{leftPanelFooter}</div>
        </section>
        <section className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
          {rightPanelHeader}
          <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{ROSTER_BOARD.boardTitle}</h2>
                <span className="text-sm text-[var(--muted)]">{totalPeople}명</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  className={`flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm ${totalPeople > 0 ? "bg-[var(--surface)] hover:bg-[var(--canvas)]" : "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]"}`}
                  disabled={totalPeople === 0}
                  onClick={() => setExportTarget(EXPORT_TARGETS.roster)}
                  type="button"
                >
                  <Download size={16} />
                  {ROSTER_BOARD.exportRosterTitle}
                </button>
                <button
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${hasGroupMembers ? "bg-[var(--ink)] text-[var(--surface)] hover:opacity-90" : "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]"}`}
                  disabled={!hasGroupMembers}
                  onClick={() => setExportTarget(EXPORT_TARGETS.groupResult)}
                  type="button"
                >
                  <Download size={16} />
                  {ROSTER_BOARD.export}
                </button>
              </div>
            </div>
            <SortableContext
              items={draft.groups.map((group) => groupOrderItemId(group.id))}
              strategy={rectSortingStrategy}
            >
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
                {draft.groups.map((group) => (
                  <SortableGroupColumn
                    group={group}
                    key={group.id}
                    onDelete={onRemovePerson}
                    onLeaderAction={handleLeaderAction}
                    onRenameMember={(groupId, memberId, name) =>
                      onDraftChange({
                        ...draft,
                        groups: draft.groups.map((group) =>
                          group.id === groupId
                            ? {
                                ...group,
                                members: group.members.map((member) =>
                                  member.id === memberId ? { ...member, name } : member,
                                ),
                              }
                            : group,
                        ),
                      })
                    }
                    onRename={(groupId, name) =>
                      onDraftChange({
                        ...draft,
                        groups: draft.groups.map((item) =>
                          item.id === groupId ? { ...item, name } : item,
                        ),
                      })
                    }
                  />
                ))}
                <NewGroupDropZone />
              </div>
            </SortableContext>
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
