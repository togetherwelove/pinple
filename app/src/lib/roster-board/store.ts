import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  GROUPING_LIMITS,
  ROSTER_BOARD_DRAFT_KEY,
  ROSTER_BOARD_STORAGE_KEY,
} from "@/lib/config/app";
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
  initializeDraft: (draftKey: string, draft: RosterBoardDraft) => void;
  removeDraft: (draftKey: string) => void;
  replaceDraft: (draftKey: string, draft: RosterBoardDraft) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  addPeople: (draftKey: string, people: GroupMember[]) => void;
  removePerson: (draftKey: string, personId: string, groupId: string | null) => void;
  updateGroupCount: (draftKey: string, groupCount: number) => void;
  updateUnassignedPerson: (draftKey: string, personId: string, updates: PersonInput) => void;
};

type PersistedRosterBoardState = Pick<RosterBoardStore, "drafts">;

type LegacyRosterBoardDraft = Omit<RosterBoardDraft, "groupCount"> & {
  groupCount?: number;
};

function migratePersistedState(
  persistedState: unknown,
  persistedVersion: number,
): PersistedRosterBoardState {
  const state = persistedState as { drafts?: Record<string, LegacyRosterBoardDraft> };
  const drafts = Object.fromEntries(
    Object.entries(state.drafts ?? {})
      .filter(
        ([draftKey]) =>
          persistedVersion >= 3 ||
          draftKey.includes(ROSTER_BOARD_DRAFT_KEY.separator),
      )
      .map(([draftKey, draft]) => [
        draftKey,
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
  draftKey: string,
  update: (draft: RosterBoardDraft) => RosterBoardDraft,
) {
  const draft = drafts[draftKey];

  return draft ? { ...drafts, [draftKey]: update(draft) } : drafts;
}

export const useRosterBoardStore = create<RosterBoardStore>()(
  persist<RosterBoardStore, [], [], PersistedRosterBoardState>(
    (set) => ({
      addPeople: (draftKey, people) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, draftKey, (draft) => addPeopleToDraft(draft, people)),
        })),
      drafts: {},
      hasHydrated: false,
      initializeDraft: (draftKey, draft) =>
        set((state) =>
          state.drafts[draftKey]
            ? state
            : { drafts: { ...state.drafts, [draftKey]: draft } },
        ),
      removePerson: (draftKey, personId, groupId) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, draftKey, (draft) =>
            removePersonFromDraft(draft, personId, groupId),
          ),
        })),
      removeDraft: (draftKey) =>
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[draftKey];

          return { drafts };
        }),
      replaceDraft: (draftKey, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [draftKey]: draft } })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      updateGroupCount: (draftKey, groupCount) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, draftKey, (draft) =>
            updateGroupCount(draft, groupCount),
          ),
        })),
      updateUnassignedPerson: (draftKey, personId, updates) =>
        set((state) => ({
          drafts: updateDraft(state.drafts, draftKey, (draft) =>
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
      version: 3,
    },
  ),
);
