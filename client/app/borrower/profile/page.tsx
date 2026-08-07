"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";
import { UserProfile } from "@/types/auth";

export default function BorrowerProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestApplication, setLatestApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = getToken();
      try {
        const [profileData, applicationsData] = await Promise.all([
          apiFetch<{ user: UserProfile }>("/users/me", { token: token || undefined }),
          apiFetch<{ applications: Application[] }>("/applications/me", { token: token || undefined }),
        ]);
        setProfile(profileData.user);
        setLatestApplication(applicationsData.applications[0] || null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold text-sky-700">Account</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">My profile</h1>
      <p className="mt-2 text-sm text-slate-500">Your account and most recent application details.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}

      {!loading && !error && profile && (
        <div className="surface-card mt-6 p-5 sm:p-6">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <ProfileField label="Full name" value={profile.name} />
            <ProfileField label="Email" value={profile.email} />
            <ProfileField label="Phone" value={profile.phone || "Not provided"} />
            <ProfileField label="PAN" value={latestApplication?.pan || "Not submitted yet"} />
            <ProfileField
              label="Date of birth"
              value={latestApplication?.dob ? new Date(latestApplication.dob).toLocaleDateString("en-IN") : "Not submitted yet"}
            />
            <ProfileField
              label="Monthly salary"
              value={latestApplication?.monthlySalary ? `₹${latestApplication.monthlySalary.toLocaleString("en-IN")}` : "Not submitted yet"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
