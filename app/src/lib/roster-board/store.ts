import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ROSTER_BOARD_STORAGE_KEY } from "@/lib/config/app";
import type { RosterBoardDraft } from "@/lib/types/domain";

type RosterBoardStore = {
  draft: RosterBoardDraft | null;
  hasHydrated: boolean;
  initializeDraft: (draft: RosterBoardDraft) => void;
  replaceDraft: (draft: RosterBoardDraft) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

type PersistedRosterBoardState = Pick<RosterBoardStore, "draft">;

function migratePersistedState(
  persistedState: unknown,
  persistedVersion: number,
): PersistedRosterBoardState {
  if (persistedVersion < 1) {
    return { draft: null };
  }

  const state = persistedState as { draft?: RosterBoardDraft | null };
  const draft = state.draft
    ? {
        ...state.draft,
        groups: state.draft.groups.filter((group) => group.members.length > 0),
      }
    : null;

  return { draft };
}

export const useRosterBoardStore = create<RosterBoardStore>()(
  persist<RosterBoardStore, [], [], PersistedRosterBoardState>(
    (set) => ({
      draft: null,
      hasHydrated: false,
      initializeDraft: (draft) =>
        set((state) => (state.draft ? state : { draft })),
      replaceDraft: (draft) => set({ draft }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: ROSTER_BOARD_STORAGE_KEY,
      migrate: migratePersistedState,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ draft: state.draft }),
      version: 1,
    },
  ),
);
