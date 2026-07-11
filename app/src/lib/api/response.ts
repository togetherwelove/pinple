import { AuthenticationError } from "@/lib/auth/current-user";
import { ProjectAccessError } from "@/lib/auth/project-access";

export function errorResponse(error: unknown) {
  if (error instanceof AuthenticationError) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (error instanceof ProjectAccessError) {
    return Response.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  return Response.json({ error: "요청을 처리하지 못했습니다." }, { status: 400 });
}
