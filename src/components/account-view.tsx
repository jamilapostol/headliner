"use client";

import { useActionState, useRef } from "react";
import Image from "next/image";
import { updateProfile, changeEmail, changePassword, uploadAvatar, type ActionState } from "@/lib/actions/account";

type Address = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

const initial: ActionState = {};

export function AccountView({
  name,
  email,
  avatarUrl,
  address,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  address: Address;
}) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, initial);
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initial);
  const [emailState, emailAction, emailPending] = useActionState(changeEmail, initial);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, initial);

  const avatarFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-8">
      {/* Photo */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 text-[13.5px] font-semibold">Photo</div>
        <form ref={avatarFormRef} action={avatarAction} className="flex items-center gap-4">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} width={64} height={64} className="h-16 w-16 flex-none rounded-full object-cover" />
          ) : (
            <div className="grid h-16 w-16 flex-none place-items-center rounded-full bg-yellow text-[20px] font-bold text-ink">
              {initials}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="cursor-pointer rounded-lg border border-text/15 px-3.5 py-2 text-center text-[12.5px] font-semibold text-text/80 hover:border-text/35">
              {avatarPending ? "Uploading…" : "Change photo"}
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={() => avatarFormRef.current?.requestSubmit()}
              />
            </label>
            <div className="text-[11px] text-text/40">PNG, JPG or GIF. Max 2MB.</div>
            {avatarState.error && <div className="text-[12px] text-orange">{avatarState.error}</div>}
            {avatarState.success && <div className="text-[12px] text-accent">{avatarState.success}</div>}
          </div>
        </form>
      </section>

      {/* Name + address */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 text-[13.5px] font-semibold">Profile & business address</div>
        <form action={profileAction} className="flex flex-col gap-3.5">
          <Field label="Name" name="name" defaultValue={name} />
          <Field label="Address line 1" name="addressLine1" defaultValue={address.addressLine1 ?? ""} />
          <Field label="Address line 2" name="addressLine2" defaultValue={address.addressLine2 ?? ""} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="City" name="city" defaultValue={address.city ?? ""} />
            <Field label="State / Province" name="state" defaultValue={address.state ?? ""} />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Postal code" name="postalCode" defaultValue={address.postalCode ?? ""} />
            <Field label="Country" name="country" defaultValue={address.country ?? ""} />
          </div>
          {profileState.error && <div className="text-[12.5px] text-orange">{profileState.error}</div>}
          {profileState.success && <div className="text-[12.5px] text-accent">{profileState.success}</div>}
          <button
            type="submit"
            disabled={profilePending}
            className="mt-1 w-fit cursor-pointer rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-60"
          >
            {profilePending ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      {/* Email */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 text-[13.5px] font-semibold">Email</div>
        <form action={emailAction} className="flex flex-col gap-3.5">
          <Field label="Email address" name="email" type="email" defaultValue={email} />
          {emailState.error && <div className="text-[12.5px] text-orange">{emailState.error}</div>}
          {emailState.success && <div className="text-[12.5px] text-accent">{emailState.success}</div>}
          <button
            type="submit"
            disabled={emailPending}
            className="w-fit cursor-pointer rounded-lg border border-text/15 px-4 py-2 text-[12.5px] font-semibold text-text/80 disabled:opacity-60"
          >
            {emailPending ? "Saving…" : "Update email"}
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 text-[13.5px] font-semibold">Password</div>
        <form action={passwordAction} className="flex flex-col gap-3.5">
          <Field label="New password" name="password" type="password" autoComplete="new-password" />
          <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" />
          {passwordState.error && <div className="text-[12.5px] text-orange">{passwordState.error}</div>}
          {passwordState.success && <div className="text-[12.5px] text-accent">{passwordState.success}</div>}
          <button
            type="submit"
            disabled={passwordPending}
            className="w-fit cursor-pointer rounded-lg border border-text/15 px-4 py-2 text-[12.5px] font-semibold text-text/80 disabled:opacity-60"
          >
            {passwordPending ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}
