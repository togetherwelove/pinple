import { AnonymousSessionError } from "@/lib/session/anonymous-session";

export function errorResponse(error: unknown) {
  if (error instanceof AnonymousSessionError) {
    return Response.json({ error: "브라우저 세션을 확인해 주세요." }, { status: 401 });
  }

  return Response.json({ error: "요청을 처리하지 못했습니다." }, { status: 400 });
}
