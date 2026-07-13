import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { GROUPING_LIMITS, ROSTER_BOARD_STORAGE_KEY } from "@/lib/config/app";
import {
  addPeopleToDraft,
  removePersonFromDraft,
  updateGroupCount,
  updateUnassignedPerson,
} from "@/lib/roster-board/draft";
import type { GroupMember, PersonInput, RosterBoardDraft } from "@/lib/types/domain";

type RosterBoardStore = {
  drafts: Record<string, RosterBoardDraft>;
  hasHydrated: boolean;
  initializeDraft: (rosterId: string, draft: RosterBoardDraft) => void;
  replaceDraft: (rosterId: string, draft: RosterBoardDraft) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  addPeople: (rosterId: string, people: GroupMember[]) => void;
  removePerson: (rosterId: string, personId: string, groupId: string | null) => void;
  updateGroupCount: (rosterId: string, groupCount: number) => void;
  updateUnassignedPerson: (rosterId: string, personId: string, updates: PersonInput) => void;
};

type PersistedRosterBoardState = Pick<RosterBoardStore, "drafts">;

type LegacyRosterBoardDraft = Omit<RosterBoardDraft, "groupCount"> & {
  groupCount?: number;
};

function migratePersistedState(persistedState: unknown): PersistedRosterBoardState {
  const state = persistedState as { drafts?: Record<string, LegacyRosterBoardDraft> };
  const drafts = Object.fromEntries(
    Object.entries(state.drafts ?? {}).map(([rosterId, draft]) => [
      rosterId,
      {
        ...draft,
        groupCount: Math.min(
          Math.max(
            draft.groupCount ?? draft.groups.length,
            GROUPING_LIMITS.minimumGroupCount,
          ),
          GROUPING_LIMITS.maximumGroupCount,
        ),
      },
    ]),
  );

  return { drafts };
}

function updateDraft(
  drafts: Record<string, RosterBoardDraft>,
  rosterId: string,
  update: (draft: RosterBoardDraft) => RosterBoardDraft,
) {
  const draft = drafts[rosterId];

  return draft ? { ...drafts, [rosterId]: update(draft) } : drafts;
}

export const useRosterBoardStore = create<RosterBoardStore>()(
  persist<RosterBoardStore, [], [], PersistedRosterBoardState>(
    (set) => ({
      addPeople: (rosterId, people) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, rosterId, (draft) => addPeopleToDraft(draft, people)),
        })),
      drafts: {},
      hasHydrated: false,
      initializeDraft: (rosterId, draft) =>
        set((state) =>
          state.drafts[rosterId]
            ? state
            : { drafts: { ...state.drafts, [rosterId]: draft } },
        ),
      removePerson: (rosterId, personId, groupId) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, rosterId, (draft) =>
            removePersonFromDraft(draft, personId, groupId),
          ),
        })),
      replaceDraft: (rosterId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [rosterId]: draft } })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      updateGroupCount: (rosterId, groupCount) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, rosterId, (draft) =>
            updateGroupCount(draft, groupCount),
          ),
        })),
      updateUnassignedPerson: (rosterId, personId, updates) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, rosterId, (draft) =>
            updateUnassignedPerson(draft, personId, updates),
          ),
        })),
    }),
    {
      name: ROSTER_BOARD_STORAGE_KEY,
      migrate: migratePersistedState,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ drafts: state.drafts }),
      version: 2,
    },
  ),
);
