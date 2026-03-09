import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AppRole } from "@/contexts/AuthContext";

interface UserWithRole {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
}

const UsersManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        created_at: profile.created_at,
        roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role as AppRole) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Lỗi", description: "Không thể tải danh sách người dùng", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
      toast({ title: "Thành công", description: "Đã cập nhật vai trò" });
      fetchUsers();
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật vai trò", variant: "destructive" });
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin": return "destructive" as const;
      case "moderator": return "default" as const;
      default: return "secondary" as const;
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Quản lý người dùng</CardTitle></CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Chưa có người dùng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thay đổi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "Chưa cập nhật"}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.length > 0 ? user.roles.map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)}>{role}</Badge>
                        )) : <Badge variant="secondary">user</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Select defaultValue={user.roles[0] || "user"} onValueChange={(v) => handleRoleChange(user.id, v as AppRole)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersManager;