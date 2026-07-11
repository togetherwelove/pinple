export const APP_NAME = "GroupFlow";

export const APP_DESCRIPTION = "인원 정보를 균형 있게 그룹으로 나누는 작업 공간";

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
  maximumGroupCount: 50,
  minimumAge: 0,
  minimumGroupCount: 1,
  minimumPeoplePerGroup: 1,
  projectTitleMaximumLength: 80,
} as const;

export const GROUP_NAME_PREFIX = "그룹";

export const GROUP_RESULT_NAME_PREFIX = "자동 그룹화";

export const EXCEL_EXPORT = {
  fileNameSuffix: "그룹결과",
  sheetName: "그룹 결과",
} as const;

export const UI_MESSAGES = {
  authenticationRequired: "로그인이 필요합니다.",
  invalidFile: "지원하지 않는 파일입니다.",
  invalidInput: "입력 형식을 확인해 주세요.",
  noPeople: "먼저 인원 정보를 등록해 주세요.",
  saveFailed: "저장하지 못했습니다. 다시 시도해 주세요.",
  signOutFailed: "로그아웃하지 못했습니다. 다시 시도해 주세요.",
  signingOut: "로그아웃 중",
  unknownError: "예상하지 못한 오류가 발생했습니다.",
} as const;

export const UI_LABELS = {
  signOut: "로그아웃",
} as const;
