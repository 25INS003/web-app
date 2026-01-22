"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/store/settingsStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Palette, Zap, Check, RotateCcw, Droplet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

const themes = [
    { id: "violet", name: "Violet", color: "bg-indigo-500" },
    { id: "blue", name: "Ocean Blue", color: "bg-blue-500" },
    { id: "rose", name: "Rose Red", color: "bg-rose-500" },
    { id: "emerald", name: "Emerald", color: "bg-emerald-500" },
    { id: "amber", name: "Amber", color: "bg-amber-500" },
];

import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ... previous variants ...

const ColorPicker = ({ label, colorKey, value, onChange }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</Label>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{value || "DEFAULT"}</span>
        </div>
        <div className="flex items-center gap-4">
             {value && (
                <button 
                    onClick={() => onChange(colorKey, null)}
                    className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                >
                    Reset
                </button>
            )}
            
            <Popover>
                <PopoverTrigger asChild>
                    <button className="relative w-11 h-11 rounded-full p-1 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
                        <div 
                            className="w-full h-full rounded-full shadow-inner border border-black/5" 
                            style={{ backgroundColor: value || "#ffffff" }}
                        />
                        {!value && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full">
                                <Palette className="w-5 h-5 text-slate-400" />
                            </div>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl" align="end" sideOffset={8}>
                     <div className="space-y-3">
                         <h4 className="font-medium text-sm text-center mb-1 text-slate-500">Pick a color</h4>
                         <HexColorPicker 
                            color={value || "#ffffff"} 
                            onChange={(newColor) => onChange(colorKey, newColor)} 
                            className="!w-[200px] !h-[200px] !rounded-xl"
                         />
                         <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                             <div className="w-6 h-6 rounded-md border border-black/10 shadow-sm" style={{ backgroundColor: value || "#ffffff" }} />
                             <input 
                                className="flex-1 bg-transparent text-sm font-mono uppercase focus:outline-none"
                                value={value || ""}
                                onChange={(e) => onChange(colorKey, e.target.value)}
                                placeholder="#RRGGBB"
                             />
                         </div>
                     </div>
                </PopoverContent>
            </Popover>
        </div>
    </div>
);

export default function SettingsPage() {
    const router = useRouter();
    const { 
        animationsEnabled, 
        toggleAnimations, 
        themeColor, 
        setThemeColor,
        customColors,
        setCustomColor,
        resetTheme
    } = useSettingsStore();

    const handleAnimationToggle = (checked) => {
        toggleAnimations();
        toast.success(`Animations ${checked ? "enabled" : "disabled"}`);
    };

    const handleThemeChange = (id) => {
        setThemeColor(id);
        toast.success(`Theme updated to ${themes.find(t => t.id === id)?.name}`);
    };
    
    const handleCustomColorChange = (key, value) => {
        setCustomColor(key, value);
    };
    
    const handleResetAll = () => {
        if(confirm("Are you sure you want to reset all theme customizations?")) {
            resetTheme();
            toast.success("Theme reset to default violet");
        }
    };

    return (
        <motion.div 
            className="p-6 max-w-4xl mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Settings
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Customize your dashboard experience
                        </p>
                    </div>
                </div>
                
                <Button variant="outline" onClick={handleResetAll} className="gap-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900 hover:border-red-300 transition-all">
                    <RotateCcw className="w-4 h-4" />
                    Reset Defaults
                </Button>
            </div>

            <div className="grid gap-8">
                
                {/* 1. Quick Accents */}
                <motion.div variants={itemVariants}>
                    <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800/50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/10">
                                    <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Appearance</CardTitle>
                                    <CardDescription>Choose a preset accent for your dashboard</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            
                            {/* Theme Color Selector */}
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-6">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleThemeChange(theme.id)}
                                            className={`
                                                group relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                                                ${themeColor === theme.id 
                                                    ? "ring-4 ring-indigo-100 dark:ring-indigo-900 scale-110 shadow-lg shadow-indigo-500/20" 
                                                    : "hover:scale-105 hover:shadow-lg grayscale-[0.3] hover:grayscale-0"
                                                }
                                                bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700
                                            `}
                                        >
                                            <div className={`w-12 h-12 rounded-xl ${theme.color} shadow-sm group-hover:scale-110 transition-transform`} />
                                            {themeColor === theme.id && (
                                                <div className="absolute -top-3 -right-3 bg-indigo-600 text-white rounded-full p-1.5 shadow-md ring-4 ring-white dark:ring-slate-900">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                
                {/* 2. Advanced Theme Editor */}
                <motion.div variants={itemVariants}>
                    <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800/50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/10">
                                    <Droplet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Advanced Theme Editor</CardTitle>
                                    <CardDescription>Fine-tune colors for specific components</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="base" className="border-b dark:border-slate-800/50 px-8">
                                    <AccordionTrigger className="hover:no-underline py-6 data-[state=open]:text-purple-600 dark:data-[state=open]:text-purple-400 transition-colors text-lg font-medium">Base Colors</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                                        <ColorPicker label="Background" colorKey="background" value={customColors.background} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Foreground (Text)" colorKey="foreground" value={customColors.foreground} onChange={handleCustomColorChange} />
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="brand" className="border-b dark:border-slate-800/50 px-8">
                                    <AccordionTrigger className="hover:no-underline py-6 data-[state=open]:text-purple-600 dark:data-[state=open]:text-purple-400 transition-colors text-lg font-medium">Brand Colors</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                                        <ColorPicker label="Primary" colorKey="primary" value={customColors.primary} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Primary Foreground" colorKey="primaryForeground" value={customColors.primaryForeground} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Secondary" colorKey="secondary" value={customColors.secondary} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Secondary Foreground" colorKey="secondaryForeground" value={customColors.secondaryForeground} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Accent" colorKey="accent" value={customColors.accent} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Accent Foreground" colorKey="accentForeground" value={customColors.accentForeground} onChange={handleCustomColorChange} />
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="components" className="border-b dark:border-slate-800/50 px-8">
                                    <AccordionTrigger className="hover:no-underline py-6 data-[state=open]:text-purple-600 dark:data-[state=open]:text-purple-400 transition-colors text-lg font-medium">Components</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                                         <ColorPicker label="Card Background" colorKey="card" value={customColors.card} onChange={handleCustomColorChange} />
                                         <ColorPicker label="Card Foreground" colorKey="cardForeground" value={customColors.cardForeground} onChange={handleCustomColorChange} />
                                         <ColorPicker label="Popover Background" colorKey="popover" value={customColors.popover} onChange={handleCustomColorChange} />
                                         <ColorPicker label="Popover Foreground" colorKey="popoverForeground" value={customColors.popoverForeground} onChange={handleCustomColorChange} />
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="ui" className="border-b-0 px-8">
                                    <AccordionTrigger className="hover:no-underline py-6 data-[state=open]:text-purple-600 dark:data-[state=open]:text-purple-400 transition-colors text-lg font-medium">UI Elements</AccordionTrigger>
                                    <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                                        <ColorPicker label="Border" colorKey="border" value={customColors.border} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Input" colorKey="input" value={customColors.input} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Ring" colorKey="ring" value={customColors.ring} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Muted" colorKey="muted" value={customColors.muted} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Muted Foreground" colorKey="mutedForeground" value={customColors.mutedForeground} onChange={handleCustomColorChange} />
                                        <ColorPicker label="Destructive" colorKey="destructive" value={customColors.destructive} onChange={handleCustomColorChange} />
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 3. Performance Settings */}
                <motion.div variants={itemVariants}>
                    <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800/50 pb-6">
                             <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/10">
                                    <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Performance</CardTitle>
                                    <CardDescription>Adjust layout and animation settings</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                <div className="space-y-1">
                                    <Label className="text-base font-semibold">Enable Animations</Label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Enable or disable layout animations. Disabling can improve performance on slower devices.
                                    </p>
                                </div>
                                <Switch 
                                    checked={animationsEnabled}
                                    onCheckedChange={handleAnimationToggle}
                                    className="data-[state=checked]:bg-indigo-600 scale-125 mr-2"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
