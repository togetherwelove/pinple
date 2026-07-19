import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
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

function migratePersistedState(
  persistedState: unknown,
  persistedVersion: number,
): PersistedRosterBoardState {
  if (persistedVersion < 5) {
    return { drafts: {} };
  }

  const state = persistedState as {
    drafts?: Record<string, RosterBoardDraft>;
  };
  const drafts = Object.fromEntries(
    Object.entries(state.drafts ?? {})
      .map(([draftKey, draft]) => {
        return [
          draftKey,
          {
            ...draft,
            groups: draft.groups.filter((group) => group.members.length > 0),
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
      version: 5,
    },
  ),
);
