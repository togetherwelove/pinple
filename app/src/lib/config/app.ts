export const APP_NAME = "GroupFlow";

export const APP_DESCRIPTION = "인원 정보를 균형 있게 조로 나누는 작업 공간";

export const ROUTES = {
  dashboard: "/dashboard",
  login: "/login",
  root: "/",
} as const;

export const GENDER = {
  female: "F",
  male: "M",
} as const;

export const INPUT_GENDER = {
  female: ["여", "여자"],
  male: ["남", "남자"],
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
  oldest: "oldest",
  random: "random",
} as const;

export const LEADER_SELECTION_OPTIONS = [
  { label: "선출 안 함", value: LEADER_SELECTION_MODES.none },
  { label: "무작위 선출", value: LEADER_SELECTION_MODES.random },
  { label: "연장자 우선 선출", value: LEADER_SELECTION_MODES.oldest },
] as const;

export const EXCEL_EXPORT = {
  fileNameSuffix: "조결과",
  sheetName: "조 결과",
} as const;

export const UI_MESSAGES = {
  authenticationRequired: "로그인이 필요합니다.",
  emptyWorkbook: "파일에 읽을 수 있는 시트가 없습니다.",
  groupCapacityMismatch: "조 정원 합계를 전체 인원 수와 맞춰 주세요.",
  groupResultsRequired: "조 편성 결과를 만든 뒤 내보낼 수 있습니다.",
  invalidFile: "지원하지 않는 파일입니다.",
  invalidInput: "입력 형식을 확인해 주세요.",
  leaderConflict: "대상 조에 이미 조장이 있습니다.",
  noPeople: "먼저 인원 정보를 등록해 주세요.",
  projectTitleRequired: "명단 이름을 입력한 뒤 시작할 수 있습니다.",
  saveFailed: "저장하지 못했습니다. 다시 시도해 주세요.",
  saveRosterRequired: "명단을 입력한 뒤 저장할 수 있습니다.",
  savedRosterRequired: "저장된 명단이 있어야 조 정원을 계산할 수 있습니다.",
  signOutFailed: "로그아웃하지 못했습니다. 다시 시도해 주세요.",
  signingOut: "로그아웃 중",
  unknownError: "예상하지 못한 오류가 발생했습니다.",
} as const;

export const UI_LABELS = {
  appointLeader: "조장으로 임명",
  assignMovingLeader: "B. 이동한 사람을 조장으로 지정",
  leader: "조장",
  leaderAssignmentMode: "조장 선출 방식",
  retainExistingLeader: "A. 기존 조장 유지",
  revokeLeader: "조장 해제",
  signOut: "로그아웃",
} as const;
