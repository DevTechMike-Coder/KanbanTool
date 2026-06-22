"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { logout } from "@/app/actions/auth";
import { useToast } from "@/components/ui/toast";
import { User, LayoutGrid, Check, Upload } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface SettingsFormProps {
  profile: Profile;
}

const AVATAR_PRESETS = [
  {
    name: "Neon Sphere",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Holographic Orb",
    url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Cosmic Swirl",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Glass Prism",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Geometric Grid",
    url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=150&auto=format&fit=crop&q=80",
  },
  {
    name: "Cyber Grid",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&auto=format&fit=crop&q=80",
  },
];

export default function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPendingLogout, startLogoutTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 1MB to avoid overly large database fields
    if (file.size > 1024 * 1024) {
      toast({
        title: "File Too Large",
        message: "Please choose an image smaller than 1MB.",
        type: "error",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedAvatar(base64String);
    };
    reader.readAsDataURL(file);
  };

  const displayName = profile.name || profile.email.split("@")[0];
  const initials =
    displayName
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile({
        name: name.trim() || undefined, // fallback to undefined if empty
        bio: bio.trim() || null,
        avatarUrl: selectedAvatar || null,
      });

      toast({
        title: "Profile Updated",
        message: "Your profile details have been saved successfully.",
        type: "success",
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An error occurred while updating your profile.";
      toast({
        title: "Update Failed",
        message,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 font-sans">
          Profile Settings
        </h1>
        <p className="mt-2 text-sm text-zinc-500 font-sans">
          Manage your personal canvas identity, bio details, and system avatar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Side: Avatar Customizer / Card Preview */}
        <div className="flex flex-col items-center">
          <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-zinc-800 tracking-tight uppercase mb-6 w-full text-left">
              Canvas Avatar
            </h3>

            {/* Live Avatar Preview */}
            <div className="relative mb-4 group cursor-pointer">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt={name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 rounded-full object-cover border-2 border-zinc-900 shadow-md"
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full bg-zinc-950 text-white flex items-center justify-center text-3xl font-bold border-2 border-zinc-900 shadow-md"
                >
                  {initials}
                </div>
              )}
            </div>

            <h4 className="text-base font-bold text-zinc-900 truncate max-w-full">
              {name || displayName}
            </h4>
            <p className="text-xs text-zinc-450 mt-1 truncate max-w-full">
              {profile.email}
            </p>

            {bio && (
              <div className="mt-4 pt-4 border-t border-zinc-100 w-full text-left">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Bio Summary
                </span>
                <p className="text-xs text-zinc-600 font-sans leading-relaxed break-words">
                  {bio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Settings Fields & Avatar Preset Selector */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card wrapper */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-6">
              {/* Profile Details section */}
              <div>
                <h3 className="text-sm font-bold text-zinc-800 tracking-tight uppercase mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span>Profile Identity</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="settings-name"
                      className="text-xs font-semibold text-zinc-700"
                    >
                      Display Name
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      placeholder="e.g. Michael Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all shadow-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="settings-bio"
                      className="text-xs font-semibold text-zinc-700"
                    >
                      Developer Bio
                    </label>
                    <textarea
                      id="settings-bio"
                      rows={4}
                      placeholder="Share a short summary of your developer profile, stack expertise, or workflow focus..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-hidden transition-all shadow-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar Presets Selection */}
              <div className="pt-6 border-t border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-800 tracking-tight uppercase mb-4 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-zinc-500" />
                  <span>Select Avatar Preset</span>
                </h3>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatar === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(isSelected ? "" : preset.url);
                          if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file upload when preset is selected
                        }}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                          isSelected
                            ? "border-zinc-950 ring-2 ring-zinc-950/20 scale-95"
                            : "border-zinc-200 hover:border-zinc-400 hover:scale-102"
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center">
                            <div className="p-1 rounded-full bg-white text-zinc-950 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Avatar Upload Field */}
                <div className="mt-6 flex flex-col gap-1.5 border-t border-zinc-100 pt-4">
                  <span className="text-xs font-semibold text-zinc-700">
                    Or upload a custom image
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose Image File
                    </button>

                    {selectedAvatar && selectedAvatar.startsWith("data:") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(profile.avatarUrl || "");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-4 py-2 border border-red-200 rounded-lg text-xs font-semibold text-red-650 hover:text-red-750 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Reset Upload
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Supports JPG, PNG, or WebP up to 1MB.
                  </p>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-6 border-t border-zinc-100 flex items-center justify-between gap-3">
                {/* Logout on the left */}
                <button
                  type="button"
                  disabled={isPendingLogout}
                  onClick={() => startLogoutTransition(() => logout())}
                  className="px-4 py-2 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPendingLogout ? "Logging out..." : "Log Out"}
                </button>

                {/* Reset + Save on the right */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setName(profile.name || "");
                      setBio(profile.bio || "");
                      setSelectedAvatar(profile.avatarUrl || "");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Save Profile Changes"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
