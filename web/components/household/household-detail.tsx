"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { ConfirmDialog, Dialog } from "@/components/ds/dialog";
import { Field, Input, Select } from "@/components/ds/field";
import { useToast } from "@/components/ui/toast-provider";
import { api } from "@/lib/finance/client";
import type { getHousehold } from "@/lib/finance/households";
import { useI18n } from "@/lib/i18n/client";

type Household = Awaited<ReturnType<typeof getHousehold>>;
type Member = Household["members"][number];
const ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;
const box =
  "rounded-[var(--radius-card)] border border-neutral-200 bg-surface p-5";
const errorBox =
  "rounded-[var(--radius-control)] bg-danger-bg p-3 text-[13px] text-danger";

export function HouseholdDetail({ household }: { household: Household }) {
  const router = useRouter();
  const { t, fmt } = useI18n();
  const { toast } = useToast();
  const isAdmin = household.role === "ADMIN";
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    "archive" | "leave" | { member: Member } | null
  >(null);
  const [invite, setInvite] = useState<{ open: boolean; link: string | null }>({
    open: false,
    link: null,
  });
  const [holderOpen, setHolderOpen] = useState(false);
  const nameOf = (m: Member) =>
    m.displayName ?? m.email ?? t("household.detail.unnamedMember");
  const holderName = (id: string | null) => {
    const member = household.members.find((m) => m.id === id);
    return member ? nameOf(member) : t("household.accounts.noHolder");
  };

  async function run(
    promise: ReturnType<typeof api>,
    success: string,
    after?: () => void,
  ) {
    const result = await promise;
    if (!result.ok) {
      setError(result.error);
      toast({ variant: "error", title: result.error });
      return false;
    }
    setError(null);
    toast({ variant: "success", title: success });
    after?.();
    router.refresh();
    return true;
  }

  const base = `/api/v1/households/${household.id}`;
  const changeRole = (m: Member, role: string) =>
    run(
      api(`${base}/members/${m.id}`, "PATCH", { role }),
      t("household.members.updated"),
    );
  const removeMember = (m: Member) =>
    run(
      api(`${base}/members/${m.id}`, "DELETE"),
      m.isMe ? t("household.archived") : t("household.members.removed"),
      () => {
        if (m.isMe) router.push("/household");
      },
    );

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(
      new FormData(event.currentTarget).get("name") ?? "",
    ).trim();
    await run(api(base, "PATCH", { name }), t("household.renamed"));
  }

  async function addHolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = String(
      new FormData(event.currentTarget).get("displayName") ?? "",
    ).trim();
    await run(
      api(`${base}/members`, "POST", { displayName }),
      t("household.members.holderAdded"),
      () => setHolderOpen(false),
    );
  }

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const result = await api<{ acceptPath: string }>(
      `${base}/invitations`,
      "POST",
      {
        email: String(f.get("email") ?? "").trim(),
        role: String(f.get("role") ?? "MEMBER"),
      },
    );
    if (!result.ok) return setError(result.error);
    setError(null);
    setInvite({
      open: true,
      link: `${window.location.origin}${result.data.acceptPath}`,
    });
    router.refresh();
  }

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      toast({ variant: "success", title: t("household.invitations.copied") });
    } catch {
      toast({ variant: "error", title: t("common.errors.generic") });
    }
  }

  return (
    <div className="mx-auto grid max-w-[880px] gap-6">
      <Link
        href="/household"
        className="text-[13px] text-brand-700 hover:underline"
      >
        ← {t("household.detail.back")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-semibold text-neutral-950">
            {household.name}
          </h1>
          <Badge tone={isAdmin ? "brand" : "neutral"}>
            {t(`enums.householdRole.${household.role}`)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setConfirm("leave")}>
            {t("household.detail.leave")}
          </Button>
          {isAdmin && (
            <Button variant="danger" onClick={() => setConfirm("archive")}>
              {t("household.detail.archive")}
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}

      {isAdmin && (
        <form
          onSubmit={rename}
          className={`${box} flex flex-wrap items-end gap-3`}
        >
          <div className="min-w-[200px] flex-1">
            <Field label={t("household.create.name")}>
              <Input
                name="name"
                defaultValue={household.name}
                required
                maxLength={80}
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary">
            {t("household.detail.rename")}
          </Button>
        </form>
      )}

      <section className={box} aria-labelledby="members-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="members-title"
              className="text-[15px] font-semibold text-neutral-950"
            >
              {t("household.members.title")}
            </h2>
            <p className="text-[12px] text-neutral-500">
              {t("household.members.hint")}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="compact"
                onClick={() => setHolderOpen(true)}
              >
                {t("household.members.addHolder")}
              </Button>
              <Button
                size="compact"
                onClick={() => setInvite({ open: true, link: null })}
              >
                {t("household.invitations.invite")}
              </Button>
            </div>
          )}
        </div>
        <ul className="divide-y divide-neutral-200">
          {household.members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {nameOf(m)}{" "}
                  {m.isMe && (
                    <span className="text-[12px] font-normal text-neutral-500">
                      ({t("household.detail.me")})
                    </span>
                  )}
                </p>
                <p className="truncate text-[12px] text-neutral-500">
                  {m.hasLogin
                    ? t("household.members.withLogin")
                    : t("household.members.withoutLogin")}
                  {m.displayName && m.email ? ` · ${m.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.hasLogin &&
                  (isAdmin ? (
                    <Select
                      aria-label={t("household.members.role")}
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="h-8 w-[220px] text-[13px]"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t(`enums.householdRole.${r}`)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Badge>{t(`enums.householdRole.${m.role}`)}</Badge>
                  ))}
                {isAdmin && !m.isMe && (
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={() => setConfirm({ member: m })}
                  >
                    {t("household.members.remove")}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (
        <section className={box} aria-labelledby="invitations-title">
          <h2
            id="invitations-title"
            className="mb-3 text-[15px] font-semibold text-neutral-950"
          >
            {t("household.invitations.pending")}
          </h2>
          {household.invitations.length ? (
            <ul className="divide-y divide-neutral-200">
              {household.invitations.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-neutral-900">
                      {i.email}
                    </p>
                    <p className="text-[12px] text-neutral-500">
                      {t(`enums.householdRole.${i.role}`)} ·{" "}
                      {t("household.invitations.expires", {
                        date: fmt.civilDate(i.expiresAt.slice(0, 10)),
                      })}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={() =>
                      run(
                        api(`${base}/invitations/${i.id}`, "DELETE"),
                        t("household.invitations.revoked"),
                      )
                    }
                  >
                    {t("household.invitations.revoke")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-neutral-600">
              {t("household.invitations.none")}
            </p>
          )}
        </section>
      )}

      <section className={box} aria-labelledby="accounts-title">
        <h2
          id="accounts-title"
          className="mb-3 text-[15px] font-semibold text-neutral-950"
        >
          {t("household.accounts.title")}
        </h2>
        {household.accounts.length ? (
          <ul className="divide-y divide-neutral-200">
            {household.accounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <Link
                  href={`/accounts/${a.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {a.name}
                </Link>
                <span className="text-[13px] text-neutral-600">
                  {t("household.accounts.holder")}:{" "}
                  {holderName(a.holderMemberId)}
                  {a.isMine ? ` · ${t("household.accounts.mine")}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-neutral-600">
            {t("household.accounts.none")}
          </p>
        )}
      </section>

      <Dialog
        open={holderOpen}
        onClose={() => setHolderOpen(false)}
        title={t("household.members.addHolder")}
      >
        <form onSubmit={addHolder} className="grid gap-4">
          <Field label={t("household.members.holderName")}>
            <Input
              name="displayName"
              required
              maxLength={80}
              placeholder={t("household.members.holderPlaceholder")}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setHolderOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit">{t("common.actions.add")}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={invite.open}
        onClose={() => setInvite({ open: false, link: null })}
        title={
          invite.link
            ? t("household.invitations.linkTitle")
            : t("household.invitations.invite")
        }
        description={
          invite.link ? t("household.invitations.linkHint") : undefined
        }
      >
        {invite.link ? (
          <div className="grid gap-3">
            <Input
              readOnly
              value={invite.link}
              aria-label={t("household.invitations.linkTitle")}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => copy(invite.link!)}>
                {t("household.invitations.copy")}
              </Button>
              <Button onClick={() => setInvite({ open: false, link: null })}>
                {t("household.invitations.done")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={sendInvite} className="grid gap-4">
            <Field label={t("household.invitations.email")}>
              <Input name="email" type="email" required maxLength={254} />
            </Field>
            <Field label={t("household.invitations.role")}>
              <Select name="role" defaultValue="MEMBER">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`enums.householdRole.${r}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setInvite({ open: false, link: null })}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button type="submit">{t("household.invitations.send")}</Button>
            </div>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirm === "archive"}
        onClose={() => setConfirm(null)}
        title={t("household.detail.archiveTitle")}
        description={t("household.detail.archiveHint")}
        confirmLabel={t("common.actions.archive")}
        onConfirm={() => {
          setConfirm(null);
          run(api(base, "DELETE"), t("household.archived"), () =>
            router.push("/household"),
          );
        }}
      />
      <ConfirmDialog
        open={confirm === "leave"}
        onClose={() => setConfirm(null)}
        title={t("household.detail.leaveTitle")}
        description={t("household.detail.leaveHint")}
        confirmLabel={t("household.detail.leave")}
        onConfirm={() => {
          setConfirm(null);
          removeMember(
            household.members.find((m) => m.id === household.myMemberId)!,
          );
        }}
      />
      <ConfirmDialog
        open={typeof confirm === "object" && confirm !== null}
        onClose={() => setConfirm(null)}
        title={t("household.members.removeTitle")}
        description={t("household.members.removeHint")}
        confirmLabel={t("household.members.remove")}
        onConfirm={() => {
          if (typeof confirm === "object" && confirm)
            removeMember(confirm.member);
          setConfirm(null);
        }}
      />
    </div>
  );
}
