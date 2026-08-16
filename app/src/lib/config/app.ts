export const APP_NAME = "Pinple";

export const APP_DESCRIPTION = "인원 정보를 균형 있게 조로 나누는 작업 공간";

export function formatCopyrightNotice(year: number) {
  return `© ${year} ${APP_NAME}. All rights reserved.`;
}

export const ROUTES = {
  rosters: "/rosters",
  root: "/",
} as const;

export const INPUT_DEPENDENT_BUTTON_CLASSES = {
  disabled: "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]",
  enabled: "bg-[var(--ink)] text-[var(--surface)] transition-opacity hover:opacity-90",
} as const;

export const TOAST_DURATION_MS = 2_000;

export const TOAST_TONES = {
  error: "error",
  success: "success",
} as const;

export const ROSTER_PARSING = {
  empty: "명단을 입력해 주세요.",
} as const;

export const GROUPING_LIMITS = {
  groupNameMaximumLength: 80,
  maximumGroupCount: 50,
  minimumGroupCount: 1,
  minimumPeoplePerGroup: 1,
} as const;

export const GROUP_NAME_SUFFIX = "조";

export const LEGACY_GROUP_NAME_PREFIX = "그룹";

export function formatGroupName(index: number) {
  return `${index + 1}${GROUP_NAME_SUFFIX}`;
}

export function displayGroupName(name: string) {
  const legacyMatch = new RegExp(`^${LEGACY_GROUP_NAME_PREFIX}\\s+(\\d+)$`).exec(name);

  return legacyMatch ? `${legacyMatch[1]}${GROUP_NAME_SUFFIX}` : name;
}

export const ROSTER_BOARD_DND_CONTEXT_ID = "roster-board";

export const ROSTER_BOARD_DRAG_ACTIVATION_DISTANCE = 4;

export const ROSTER_BOARD_DND_IDS = {
  groupOrderPrefix: "group-order:",
  newGroup: "new-group",
  unassigned: "unassigned",
} as const;

export const ROSTER_BOARD_STORAGE_KEY = "pinple-roster-board-v3";

export const ROSTER_BOARD = {
  addPerson: "추가",
  addedPeople: "대기 명단에 인원을 추가했습니다.",
  autoGrouping: "자동 조 편성",
  boardTitle: "명단 관리 보드",
  distributionPreview: (groupSizes: number[]) =>
    `예상 배정: ${groupSizes.map((size) => `${size}명`).join(" · ")}`,
  createGroup: "새 조 만들기",
  createGroupHint: "인원 카드를 여기에 놓으면 새 조가 생성됩니다.",
  editGroupName: "조 이름 변경",
  groupCount: "조 개수",
  groupName: "조 이름",
  moveGroup: "조 순서 이동",
  movePerson: "인원 이동",
  editPerson: "인원 수정",
  emptyUnassigned: "대기 중인 인원이 없습니다.",
  export: "조 결과 내보내기",
  exportRoster: "내보내기",
  exportRosterTitle: "명단 내보내기",
  exportTitle: "내보내기 제목",
  fileImport: "Excel 또는 CSV 불러오기",
  inputPlaceholder: "이름",
  personEditorDescription: "수정 내용은 이 브라우저의 임시 보드에만 반영됩니다.",
  personEditorTitle: "대기 명단 인원 수정",
  personName: "이름",
  rosterTitle: "명단",
  regroupTitle: "조를 다시 편성할까요?",
  removePerson: "인원 삭제",
  savePerson: "수정 완료",
  unassigned: "대기 명단",
  unassignedCount: (remaining: number, total: number) => `${remaining}/${total}`,
  workArea: "명단 입력 및 설정",
} as const;

export const LEADER_SELECTION_MODES = {
  none: "none",
  random: "random",
} as const;

export const LEADER_SELECTION_OPTIONS = [
  { label: "선출 안 함", value: LEADER_SELECTION_MODES.none },
  { label: "무작위 선출", value: LEADER_SELECTION_MODES.random },
] as const;

export const EXCEL_EXPORT = {
  columnWidthPadding: 4,
  fileExtension: ".xlsx",
  groupNameHeader: "조명",
  groupResultFileTitle: "조 결과",
  maximumTitleLength: 80,
  memberNameHeader: "이름",
  minimumColumnWidth: 12,
  rawSheetName: "원본 데이터",
  rosterFileNameSuffix: "명단",
  rosterSheetName: "명단",
  sheetName: "조 결과",
} as const;

export const UI_MESSAGES = {
  emptyWorkbook: "파일에 읽을 수 있는 시트가 없습니다.",
  groupCapacityMismatch: "조 정원 합계를 전체 인원 수와 맞춰 주세요.",
  groupCapacityExceedsPeople: "조 정원 합계는 전체 인원 수보다 클 수 없습니다.",
  boardGroupingRequired: "명단에 인원을 추가한 뒤 조 편성을 실행할 수 있습니다.",
  boardSnapshotInvalid: "보드 데이터를 확인해 주세요.",
  groupCountInvalid: (maximumCount: number) =>
    `조 개수는 1개 이상 ${maximumCount}개 이하로 입력해 주세요.`,
  groupResultNotFound: "조 편성 결과를 찾을 수 없습니다.",
  groupResultInvalid: "조 편성 데이터를 확인해 주세요.",
  groupResultSaveFailed: "조 편성 결과를 저장하지 못했습니다. 브라우저 초안은 유지됩니다.",
  groupUnassignConfirmation: (groupName: string, memberCount: number) =>
    `${groupName}의 ${memberCount}명을 대기 명단으로 이동할까요?`,
  invalidFile: "지원하지 않는 파일입니다.",
  invalidInput: "입력 형식을 확인해 주세요.",
  leaderConflict: "대상 조에 이미 조장이 있습니다.",
  noPeople: "먼저 인원 정보를 등록해 주세요.",
  regroupConfirmation: "현재 조 편성은 새 결과로 교체됩니다.",
  saveFailed: "저장하지 못했습니다. 다시 시도해 주세요.",
  unknownError: "예상하지 못한 오류가 발생했습니다.",
} as const;

export const UI_LABELS = {
  appointLeader: "조장으로 임명",
  assignMovingLeader: "B. 이동한 사람을 조장으로 지정",
  cancel: "취소",
  dashboardLoading: "명단을 불러오는 중...",
  delete: "삭제",
  deleting: "삭제 중",
  dismissToast: "알림 닫기",
  grouping: "조 편성 중...",
  leader: "조장",
  leaderAssignmentMode: "조장 선출 방식",
  loadingBoard: "명단 보드를 준비하는 중...",
  loadingRosterFile: "불러오는 중...",
  moveGroupToUnassigned: "대기 명단으로 이동",
  moveGroupToUnassignedTitle: "조 전체 이동",
  retainExistingLeader: "A. 기존 조장 유지",
  regroup: "다시 편성",
  revokeLeader: "조장 해제",
  savingRoster: "저장 중...",
  saveGroupName: "조 이름 저장",
} as const;

export const VALIDATION_MESSAGES = {
  duplicateBoardPersonIds: "Duplicate person ids are not allowed.",
  duplicateGroupResultMembers: "A person can appear only once in a group result.",
  groupLeaderLimit: "A team can have at most one leader.",
  unknownGroupResultMember: "Group members must exist in the roster.",
} as const;
