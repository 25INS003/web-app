"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
    User, 
    Mail, 
    Phone, 
    Shield, 
    Calendar, 
    Camera, 
    Save, 
    Loader2,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export default function AdminProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Profile Data State
    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        profile_image: "",
        admin_role: "",
        permissions: [],
        createdAt: ""
    });

    // File Input Ref
    const fileInputRef = useRef(null);

    // Fetch Profile
    const fetchProfile = async () => {
        try {
            const res = await apiClient.get("/user/admin/get");
            const data = res.data.data;
            
            // Flatten the structure for easier state management
            setProfile({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                email: data.email || "",
                phone: data.phone || "",
                profile_image: data.profile_image || "",
                admin_role: data.admin?.admin_role || "Admin",
                permissions: data.admin?.permissions || [],
                createdAt: data.createdAt || new Date().toISOString()
            });
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            toast.error("Could not load profile data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Save Changes
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone
            };
            
            await apiClient.put("/user/admin/update", payload);
            toast.success("Profile updated successfully");
            
            // Optionally update global auth store here if needed
            // useAuthStore.getState().setUser({ ...user, ...payload }); 
            
        } catch (error) {
            console.error("Update failed:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await apiClient.patch("/user/admin/upload-image", formData);
            
            setProfile((prev) => ({ 
                ...prev, 
                profile_image: res.data.data.profile_image 
            }));
            toast.success("Profile picture updated");
            
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-5xl mx-auto pb-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                         <div className="p-2 rounded-xl bg-primary/10 border border-primary/30">
                            <User className="h-6 w-6 text-primary" />
                         </div>
                         My Profile
                    </h1>
                    <p className="text-muted-foreground mt-2 ml-1">
                        Manage your personal information and account settings.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Identity Card */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="border-border bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden relative">
                        <div className="h-32 bg-gradient-to-r opacity-90 absolute top-0 left-0 right-0" />
                        <CardContent className="pt-20 pb-8 flex flex-col items-center relative z-10">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-xl cursor-pointer">
                                    <AvatarImage src={profile.profile_image} className="object-cover" />
                                    <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div 
                                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-8 w-8 text-white" />
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>

                            <h2 className="mt-4 text-2xl font-bold text-foreground">
                                {profile.first_name} {profile.last_name}
                            </h2>
                            <p className="text-muted-foreground">{profile.email}</p>

                            <div className="mt-4 flex gap-2">
                                <Badge className="bg-primary/10 text-primary dark:text-primary border-primary/30 px-3 py-1 text-sm capitalize">
                                    {profile.admin_role.replace('_', ' ')}
                                </Badge>
                            </div>

                            <div className="w-full mt-8 space-y-4">
                                <Separator className="bg-muted dark:bg-popover" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Account Created</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(profile.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="font-medium text-success flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Active
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right Column: Edit Details */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Update your personal details and contact information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input 
                                        id="first_name" 
                                        name="first_name" 
                                        value={profile.first_name} 
                                        onChange={handleChange}
                                        className="bg-card"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input 
                                        id="last_name" 
                                        name="last_name" 
                                        value={profile.last_name} 
                                        onChange={handleChange}
                                        className="bg-card"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="email" 
                                            value={profile.email} 
                                            disabled 
                                            className="pl-10 bg-muted/50 text-muted-foreground cursor-not-allowed border-border" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="phone" 
                                            name="phone" 
                                            value={profile.phone} 
                                            onChange={handleChange}
                                            className="pl-10 bg-card" 
                                            placeholder="+91 ..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions & Security */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="h-5 w-5 text-success" />
                                Role & Permissions
                            </CardTitle>
                            <CardDescription>
                                View your assigned role and system capabilities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 rounded-lg p-4 border border-border dark:border-border/50">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                    Active Permissions
                                </h4>
                                {profile.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {profile.permissions.map((perm) => (
                                            <Badge key={perm} variant="outline" className="bg-card border-border text-muted-foreground">
                                                {perm}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No specific permissions assigned.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button 
                            size="lg" 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="text-white shadow-lg shadow-primary/20 min-w-[150px]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
