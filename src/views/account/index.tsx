import { useQuery } from "@tanstack/react-query"
import { authUserQuery } from "./api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
export default function AccountPage() {
  const user = useQuery(authUserQuery)
  return (
    <Card>
      <CardHeader>
        <CardTitle>个人资料</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{user.data?.display_name}</p>
        <p className="text-sm text-muted-foreground">{user.data?.email}</p>
        <p className="text-sm text-muted-foreground">
          身份资料由 One User 统一管理。Object
          的角色与访问权限由本地管理员分配。
        </p>
      </CardContent>
    </Card>
  )
}
