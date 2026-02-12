"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/apiClient";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";

export default function StatusPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [status, setStatus] = useState("loading"); // loading, pending, approved, rejected
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/shop-owners/status");
      const { is_approved, verification_status } = response.data.data;
      
      // Prioritize explicit verification status
      if (is_approved) {
        setStatus("approved");
        Cookies.set("approvalStatus", "approved", { expires: 7 });
        toast.success("Congratulations! You are approved.");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else if (verification_status === "rejected") {
        setStatus("rejected");
        Cookies.set("approvalStatus", "rejected", { expires: 7 });
      } else if (verification_status === "revoked") {
        setStatus("revoked");
        Cookies.set("approvalStatus", "revoked", { expires: 7 });
      } else {
        setStatus("pending");
        Cookies.set("approvalStatus", "pending", { expires: 7 });
      }

    } catch (error) {
      console.error("Status Check Error:", error);
      // If error (e.g. 401), allow retry or logout
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-lg shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {loading ? (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            ) : status === "approved" ? (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            ) : status === "rejected" ? (
              <XCircle className="h-16 w-16 text-red-500" />
            ) : status === "revoked" ? (
              <XCircle className="h-16 w-16 text-amber-500" />
            ) : (
              <Clock className="h-16 w-16 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {loading ? "Checking Status..." : 
             status === "approved" ? "Application Approved!" :
             status === "rejected" ? "Application Rejected" : 
             status === "revoked" ? "Application Revoked" :
             "Waiting for Approval"}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {status === "pending" && "Your business details have been submitted. Our admins are reviewing your application. This may take up to 24-48 hours."}
            {status === "approved" && "Redirecting you to the dashboard..."}
            {status === "rejected" && "Your application was rejected. Please review your details and resubmit."}
            {status === "revoked" && "Your previously approved application has been revoked. Please update your details."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(status === "rejected" || status === "revoked") && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/onboarding")}>
                {status === "rejected" ? "Resubmit Application" : "Update Application"}
            </Button>
          )}
          <Button variant="outline" onClick={checkStatus} disabled={loading || status === "approved"}>
             Refresh Status
          </Button>
          <Button variant="ghost" className="w-full text-red-500 hover:text-red-600" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
