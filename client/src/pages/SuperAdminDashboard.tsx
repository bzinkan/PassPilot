import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Shield, Building2, Gauge, CreditCard, UserCircle, Users, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API = {
  schools: "/api/sa/schools",
  users: "/api/sa/users",
  audits: "/api/sa/audits",
  createSchool: "/api/sa/schools",
  deleteSchool: (id: string) => `/api/sa/schools/${id}`,
  createUser: "/api/sa/users",
  promoteUser: (id: string) => `/api/sa/users/${id}/promote`,
  demoteUser: (id: string) => `/api/sa/users/${id}/demote`,
};

function KPI({ icon: Icon, label, value, color = "pilot-blue" }: any) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot hover:shadow-pilot-xl transition-all duration-200">
      <CardContent className="flex items-center space-x-4 p-6">
        <div className={`bg-${color}-100 p-3 rounded-xl`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-pilot-blue-dark">{value}</p>
          <p className="text-sm text-pilot-blue/70">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [seatsAllowed, setSeatsAllowed] = useState("50");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const [schoolsRes, usersRes, auditsRes] = await Promise.all([
        fetch(API.schools, { credentials: "include" }),
        fetch(API.users, { credentials: "include" }),
        fetch(API.audits + "?limit=10", { credentials: "include" }),
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData.ok ? schoolsData.data : []);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.ok ? usersData.data : []);
      }
      if (auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAudits(auditsData.ok ? auditsData.data : []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Super Admin data",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const kpis = useMemo(() => ({
    totalSchools: schools.length,
    totalUsers: users.length,
    activeSchools: schools.filter(s => s.active).length,
    recentAudits: audits.length,
  }), [schools, users, audits]);

  async function createSchool() {
    if (!schoolName) return;
    setCreating(true);
    try {
      const res = await fetch(API.createSchool, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: schoolName, seatsAllowed: Number(seatsAllowed) }),
      });

      if (res.ok) {
        setSchoolName("");
        setSeatsAllowed("50");
        await load();
        toast({
          title: "Success",
          description: "School created successfully",
        });
      } else {
        const error = await res.text();
        toast({
          title: "Error",
          description: error || "Failed to create school",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create school",
        variant: "destructive",
      });
    }
    setCreating(false);
  }

  async function deleteSchool(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all related data? This cannot be undone.`)) return;
    
    try {
      const res = await fetch(API.deleteSchool(id), {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await load();
        toast({
          title: "Success",
          description: "School deleted successfully",
        });
      } else {
        const error = await res.text();
        toast({
          title: "Error",
          description: error || "Failed to delete school",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete school",
        variant: "destructive",
      });
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin": return "bg-red-100 text-red-800";
      case "admin": return "bg-orange-100 text-orange-800";
      case "teacher": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-pilot-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-pilot-blue-100 shadow-pilot">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-red-500/90 p-3 rounded-xl shadow-pilot">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-pilot-blue-dark">Super Admin Dashboard</h1>
                <p className="text-sm text-pilot-blue/70">Cross-tenant management and oversight</p>
              </div>
            </div>
            <Button onClick={load} className="bg-pilot-gradient hover:bg-pilot-blue-dark text-white">
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KPI icon={Building2} label="Total Schools" value={kpis.totalSchools} color="pilot-blue" />
          <KPI icon={Users} label="Total Users" value={kpis.totalUsers} color="pilot-success" />
          <KPI icon={Gauge} label="Active Schools" value={kpis.activeSchools} color="pilot-warning" />
          <KPI icon={UserCircle} label="Recent Audits" value={kpis.recentAudits} color="purple-500" />
        </div>

        {/* Create School */}
        <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot mb-8">
          <CardHeader>
            <CardTitle className="text-pilot-blue-dark">Create New School</CardTitle>
            <CardDescription className="text-pilot-blue/70">
              Add a new school to the PassPilot system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-pilot-blue-dark">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., Lincoln Elementary"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seatsAllowed" className="text-pilot-blue-dark">Seats Allowed</Label>
                <Input
                  id="seatsAllowed"
                  type="number"
                  placeholder="50"
                  value={seatsAllowed}
                  onChange={(e) => setSeatsAllowed(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={createSchool}
                  disabled={!schoolName || creating}
                  className="bg-pilot-gradient hover:bg-pilot-blue-dark text-white w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {creating ? "Creating..." : "Create School"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schools Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot mb-8">
          <CardHeader>
            <CardTitle className="text-pilot-blue-dark">Schools Management</CardTitle>
            <CardDescription className="text-pilot-blue/70">
              Manage all schools in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-pilot-blue/60">Loading schools...</div>
            ) : schools.length === 0 ? (
              <div className="text-center py-8 text-pilot-blue/60">No schools found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-pilot-blue-100">
                      <th className="text-left py-3 px-4 text-pilot-blue-dark font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-pilot-blue-dark font-semibold">ID</th>
                      <th className="text-left py-3 px-4 text-pilot-blue-dark font-semibold">Seats</th>
                      <th className="text-left py-3 px-4 text-pilot-blue-dark font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-pilot-blue-dark font-semibold">Created</th>
                      <th className="text-left py-3 px-4 text-pilot-blue-dark font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((school, idx) => (
                      <tr key={school.id} className={idx % 2 === 0 ? "bg-white/50" : "bg-pilot-blue-50/20"}>
                        <td className="py-3 px-4 font-medium text-pilot-blue-dark">{school.name}</td>
                        <td className="py-3 px-4 text-pilot-blue/70">{school.id}</td>
                        <td className="py-3 px-4 text-pilot-blue/70">{school.seatsAllowed}</td>
                        <td className="py-3 px-4">
                          <Badge className={school.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {school.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-pilot-blue/70">
                          {new Date(school.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSchool(school.id, school.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot">
          <CardHeader>
            <CardTitle className="text-pilot-blue-dark">Recent Audit Logs</CardTitle>
            <CardDescription className="text-pilot-blue/70">
              Latest administrative actions across all schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <div className="text-center py-8 text-pilot-blue/60">No audit logs found</div>
            ) : (
              <div className="space-y-3">
                {audits.map((audit, idx) => (
                  <div key={audit.id} className="flex items-center justify-between p-3 bg-pilot-blue-50/20 rounded-lg">
                    <div>
                      <p className="font-medium text-pilot-blue-dark">{audit.action}</p>
                      <p className="text-sm text-pilot-blue/70">
                        {audit.targetType} {audit.targetId} • School {audit.schoolId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-pilot-blue/70">
                        {new Date(audit.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}