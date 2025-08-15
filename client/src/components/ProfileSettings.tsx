import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfileSettings() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { toast } = useToast();

  // Load current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile/me"],
  });

  // Update form when profile loads
  React.useEffect(() => {
    if (profile?.ok && profile?.data) {
      setEmail(profile.data.email || "");
      setDisplayName(profile.data.displayName || "");
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/profile/me", { email, displayName }),
    onSuccess: (data: any) => {
      if (data?.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/profile/me/password", { 
      currentPassword, 
      newPassword 
    }),
    onSuccess: (data: any) => {
      if (data?.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });
      } else {
        toast({
          title: "Password Change Failed",
          description: "Failed to change password",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Email address is required",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate();
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin": return "bg-red-100 text-red-800";
      case "admin": return "bg-orange-100 text-orange-800";
      case "teacher": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot">
          <CardContent className="p-6">
            <div className="text-center text-pilot-blue/60">Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot">
        <CardHeader>
          <CardTitle className="text-pilot-blue-dark flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-pilot-blue/70">
            Update your personal information and display preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-pilot-blue-dark">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-pilot-blue-200 focus:border-pilot-blue"
                  data-testid="input-profile-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-pilot-blue-dark">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Optional display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-pilot-blue-200 focus:border-pilot-blue"
                  data-testid="input-profile-display-name"
                />
              </div>
            </div>

            {profile?.ok && profile?.data && (
              <div className="flex items-center space-x-4 p-3 bg-pilot-blue-50/50 rounded-lg">
                <div>
                  <Badge className={getRoleBadgeColor(profile.data.role)}>
                    {profile.data.role.charAt(0).toUpperCase() + profile.data.role.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-pilot-blue/70">
                  School ID: {profile.data.schoolId} • Account Status: {profile.data.active ? "Active" : "Inactive"}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-pilot-gradient hover:bg-pilot-blue-dark text-white"
              data-testid="button-update-profile"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot">
        <CardHeader>
          <CardTitle className="text-pilot-blue-dark flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription className="text-pilot-blue/70">
            Update your account password for security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-pilot-blue-dark">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-pilot-blue-200 focus:border-pilot-blue pr-10"
                  data-testid="input-current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-pilot-blue-dark">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-pilot-blue-200 focus:border-pilot-blue pr-10"
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-pilot-blue-dark">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-pilot-blue-200 focus:border-pilot-blue"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>

            <div className="text-sm text-pilot-blue/60">
              Password must be at least 8 characters long
            </div>

            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="bg-pilot-gradient hover:bg-pilot-blue-dark text-white"
              data-testid="button-change-password"
            >
              <Lock className="h-4 w-4 mr-2" />
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}