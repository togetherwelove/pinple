export const APP_NAME = "Pinple";

export const APP_DESCRIPTION = "인원 정보를 균형 있게 조로 나누는 작업 공간";

export const ROUTES = {
  login: "/login",
  rosters: "/rosters",
  root: "/",
} as const;

export const INPUT_DEPENDENT_BUTTON_CLASSES = {
  disabled: "cursor-not-allowed bg-[var(--canvas)] text-[var(--muted)]",
  enabled: "bg-[var(--ink)] text-[var(--surface)] transition-opacity hover:opacity-90",
} as const;

export const LOGIN_CONTENT = {
  description: "명단을 정리하고, 조건에 맞는 조를 빠르게 구성하세요.",
  googleContinue: "Google로 계속하기",
  previewNewRoster: "새로운 명단",
  previewRosterHeading: "명단",
  previewRosterLabel: "최근 명단",
  previewDescription: "명단을 저장하면 조 편성 결과를 바로 확인할 수 있습니다.",
  previewStatus: "자동 편성 완료",
  previewTitle: "부산 워크숍",
  previewTotal: "12명",
  title: "명단 관리와 조 편성을 한 곳에서",
} as const;

export const LOGIN_PREVIEW_GROUPS = [
  { members: ["민서", "도윤", "수아", "지훈"], name: "1조" },
  { members: ["서준", "하린", "유진", "현우"], name: "2조" },
  { members: ["지아", "건우", "채원", "민재"], name: "3조" },
] as const;

export const GENDER = {
  female: "F",
  male: "M",
  unknown: "UNKNOWN",
} as const;

export const INPUT_GENDER = {
  female: ["여", "여자"],
  male: ["남", "남자"],
} as const;

export const GENDER_LABELS = {
  [GENDER.female]: "여",
  [GENDER.male]: "남",
  [GENDER.unknown]: "미상",
} as const;

export const UNKNOWN_AGE_LABEL = "미상";

export const ROSTER_PARSING = {
  autoName: (lineNumber: number) => `이름 미입력 ${lineNumber}`,
  empty: "명단을 입력해 주세요.",
} as const;

export const GROUPING_LIMITS = {
  defaultGroupCount: 2,
  maximumGroupCount: 50,
  minimumAge: 0,
  minimumGroupCount: 1,
  minimumPeoplePerGroup: 1,
  projectTitleMaximumLength: 80,
} as const;

export const GROUP_NAME_SUFFIX = "조";

export const LEGACY_GROUP_NAME_PREFIX = "그룹";

export const GROUP_RESULT_NAME_PREFIX = "자동 조 편성";

export function formatGroupName(index: number) {
  return `${index + 1}${GROUP_NAME_SUFFIX}`;
}

export function displayGroupName(name: string) {
  const legacyMatch = new RegExp(`^${LEGACY_GROUP_NAME_PREFIX}\\s+(\\d+)$`).exec(name);

  return legacyMatch ? `${legacyMatch[1]}${GROUP_NAME_SUFFIX}` : name;
}

export const GROUP_RESULT_DND_CONTEXT_ID = "group-results";

export const ROSTER_BOARD_DND_CONTEXT_ID = "roster-board";

export const ROSTER_BOARD_STORAGE_KEY = "pinple-roster-board-draft-v1";

export const ROSTER_BOARD = {
  addPerson: "추가",
  addedPeople: "대기 명단에 인원을 추가했습니다.",
  autoGrouping: "자동 조 편성",
  boardTitle: "명단 관리 보드",
  capacity: "남은 정원",
  groupCount: "조 개수",
  groupSettings: "조 설정",
  groupTargets: "조별 정원",
  groupingStrategy: "편성 방식",
  movePerson: "인원 이동",
  personAge: "나이",
  editPerson: "인원 수정",
  emptyUnassigned: "대기 중인 인원이 없습니다.",
  export: "내보내기",
  fileImport: "Excel 또는 CSV 불러오기",
  inputPlaceholder: "이름, 성별, 나이",
  personEditorDescription: "수정 내용은 이 브라우저의 임시 보드에만 반영됩니다.",
  personEditorTitle: "대기 명단 인원 수정",
  personGender: "성별",
  personName: "이름",
  remainingCapacity: (capacity: number) => `남은 정원: ${capacity}명`,
  removePerson: "인원 삭제",
  savePerson: "수정 완료",
  unassigned: "대기 명단",
} as const;

export const ROSTER_CREATION = {
  description: "명단을 모으고 조건에 맞는 조를 구성할 수 있습니다.",
  heading: "첫 명단을 만들어 보세요.",
  inputPlaceholder: "명단 이름",
  start: "새로운 명단 시작",
  subtitle: "새 작업을 시작하세요",
} as const;

export const GROUPING_STRATEGIES = {
  ageSimilar: "age_similar",
  even: "even",
  genderAgeSimilar: "gender_age_similar",
  genderSeparated: "gender_separated",
} as const;

export const GROUPING_TOGGLE_LABELS = {
  ageSimilar: "나이 비슷한 사람끼리",
  genderSeparated: "같은 성별끼리",
} as const;

export const GROUPING_STRATEGY_LABELS = {
  [GROUPING_STRATEGIES.ageSimilar]: GROUPING_TOGGLE_LABELS.ageSimilar,
  [GROUPING_STRATEGIES.even]: "골고루 섞기",
  [GROUPING_STRATEGIES.genderAgeSimilar]: "같은 성별, 같은 나이끼리",
  [GROUPING_STRATEGIES.genderSeparated]: GROUPING_TOGGLE_LABELS.genderSeparated,
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
  fileNameSuffix: "조결과",
  sheetName: "조 결과",
} as const;

export const UI_MESSAGES = {
  authenticationRequired: "로그인이 필요합니다.",
  emptyWorkbook: "파일에 읽을 수 있는 시트가 없습니다.",
  groupCapacityMismatch: "조 정원 합계를 전체 인원 수와 맞춰 주세요.",
  boardCapacityMismatch: "대기 명단 인원 수와 조별 남은 정원을 맞춰 주세요.",
  boardGroupingRequired: "대기 명단에 인원을 추가한 뒤 조 편성을 실행할 수 있습니다.",
  boardSaveFailed: "조 편성 결과를 저장하지 못했습니다. 보드 초안은 이 브라우저에 유지됩니다.",
  boardSnapshotInvalid: "보드 데이터를 확인해 주세요.",
  groupResultsRequired: "조 편성 결과를 만든 뒤 내보낼 수 있습니다.",
  invalidFile: "지원하지 않는 파일입니다.",
  invalidInput: "입력 형식을 확인해 주세요.",
  leaderConflict: "대상 조에 이미 조장이 있습니다.",
  rosterDeleteFailed: "명단을 삭제하지 못했습니다. 다시 시도해 주세요.",
  rosterDeleteWarning: "정말 이 명단을 삭제하시겠습니까? 포함된 인원과 조 편성 결과가 모두 영구적으로 삭제됩니다.",
  noPeople: "먼저 인원 정보를 등록해 주세요.",
  projectTitleRequired: "명단 이름을 입력한 뒤 시작할 수 있습니다.",
  saveFailed: "저장하지 못했습니다. 다시 시도해 주세요.",
  saveRosterRequired: "명단을 입력한 뒤 저장할 수 있습니다.",
  savedRosterRequired: "저장된 명단이 있어야 조 정원을 계산할 수 있습니다.",
  signOutFailed: "로그아웃하지 못했습니다. 다시 시도해 주세요.",
  signInFailed: "로그인을 시작하지 못했습니다. 다시 시도해 주세요.",
  signingIn: "로그인으로 이동 중...",
  signingOut: "로그아웃 중",
  unknownError: "예상하지 못한 오류가 발생했습니다.",
} as const;

export const UI_LABELS = {
  appointLeader: "조장으로 임명",
  assignMovingLeader: "B. 이동한 사람을 조장으로 지정",
  cancel: "취소",
  creatingRoster: "명단 만드는 중...",
  dashboardLoading: "명단을 불러오는 중...",
  delete: "삭제",
  deleteRoster: "명단 삭제",
  deleting: "삭제 중",
  grouping: "조 편성 중...",
  leader: "조장",
  leaderAssignmentMode: "조장 선출 방식",
  loadingBoard: "명단 보드를 준비하는 중...",
  loadingRosterFile: "불러오는 중...",
  retainExistingLeader: "A. 기존 조장 유지",
  revokeLeader: "조장 해제",
  savingRoster: "저장 중...",
  signOut: "로그아웃",
} as const;
