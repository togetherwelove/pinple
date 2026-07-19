import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ROSTER_BOARD_DRAFT_KEY,
  ROSTER_BOARD_STORAGE_KEY,
} from "@/lib/config/app";
import type { RosterBoardDraft } from "@/lib/types/domain";

type RosterBoardStore = {
  drafts: Record<string, RosterBoardDraft>;
  hasHydrated: boolean;
  initializeDraft: (draftKey: string, draft: RosterBoardDraft) => void;
  removeDraft: (draftKey: string) => void;
  replaceDraft: (draftKey: string, draft: RosterBoardDraft) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

type PersistedRosterBoardState = Pick<RosterBoardStore, "drafts">;

type LegacyRosterBoardDraft = RosterBoardDraft & { groupCount?: number };

function migratePersistedState(
  persistedState: unknown,
  persistedVersion: number,
): PersistedRosterBoardState {
  const state = persistedState as {
    drafts?: Record<string, LegacyRosterBoardDraft>;
  };
  const drafts = Object.fromEntries(
    Object.entries(state.drafts ?? {})
      .filter(
        ([draftKey]) =>
          persistedVersion >= 3 ||
          draftKey.includes(ROSTER_BOARD_DRAFT_KEY.separator),
      )
      .map(([draftKey, draft]) => {
        const nextDraft = { ...draft };
        delete nextDraft.groupCount;

        return [
          draftKey,
          {
            ...nextDraft,
            groups: nextDraft.groups.filter((group) => group.members.length > 0),
          },
        ];
      }),
  );

  return { drafts };
}

export const useRosterBoardStore = create<RosterBoardStore>()(
  persist<RosterBoardStore, [], [], PersistedRosterBoardState>(
    (set) => ({
      drafts: {},
      hasHydrated: false,
      initializeDraft: (draftKey, draft) =>
        set((state) =>
          state.drafts[draftKey]
            ? state
            : { drafts: { ...state.drafts, [draftKey]: draft } },
        ),
      removeDraft: (draftKey) =>
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[draftKey];

          return { drafts };
        }),
      replaceDraft: (draftKey, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [draftKey]: draft } })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: ROSTER_BOARD_STORAGE_KEY,
      migrate: migratePersistedState,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ drafts: state.drafts }),
      version: 4,
    },
  ),
);
