import { rootRequest } from "@/lib/request"

export function updateUser(
  user: { user_id: string; display_name: string },
  status: "active" | "disabled",
) {
  return rootRequest(`/api/admin/users/${user.user_id}`, {
    method: "PUT",
    body: JSON.stringify({ display_name: user.display_name, status }),
  })
}
