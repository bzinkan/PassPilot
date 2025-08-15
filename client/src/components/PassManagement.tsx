import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Search, Filter, Download } from "lucide-react";

export default function PassManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: passes, isLoading } = useQuery({
    queryKey: ["/passes/all", { search: searchTerm, status: statusFilter, type: typeFilter }],
  });

  const getPassTypeLabel = (type: string, customReason?: string) => {
    if (type === "custom") return customReason || "Custom";
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : "General";
  };

  const getPassTypeColor = (type: string) => {
    switch (type) {
      case "general": return "default";
      case "nurse": return "destructive";
      case "discipline": return "secondary";
      case "custom": return "outline";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "destructive";
      case "returned": return "default";
      case "expired": return "secondary";
      default: return "outline";
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Passes</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Complete history of student passes and activity
          </p>
        </div>
        
        <Button variant="outline" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-student"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pass Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="discipline">Discipline</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Pass History
          </CardTitle>
          <CardDescription>
            {passes && Array.isArray(passes) ? passes.length : 0} passes found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passes && Array.isArray(passes) && passes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Pass Type</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passes.map((pass: any) => (
                  <TableRow key={pass.id}>
                    <TableCell className="font-medium" data-testid={`text-pass-student-${pass.id}`}>
                      {pass.studentName || pass.student?.name}
                    </TableCell>
                    <TableCell data-testid={`text-pass-grade-${pass.id}`}>
                      {pass.student?.grade || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPassTypeColor(pass.type || "general")}>
                        {getPassTypeLabel(pass.type || "general", pass.customReason)}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-pass-issuer-${pass.id}`}>
                      {pass.issuedBy?.email}
                    </TableCell>
                    <TableCell data-testid={`text-pass-time-${pass.id}`}>
                      {new Date(pass.startsAt).toLocaleString()}
                    </TableCell>
                    <TableCell data-testid={`text-pass-duration-${pass.id}`}>
                      {formatDuration(pass.startsAt, pass.endsAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(pass.status)}>
                        {pass.status?.charAt(0).toUpperCase() + pass.status?.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No passes found matching your criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}