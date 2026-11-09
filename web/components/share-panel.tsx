/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { FormEvent, useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/lib/i18n/client";

type ShareRole = "OWNER" | "VIEWER" | "TRANSACTION_MANAGER";
const ROLES = new Set<string>(["OWNER", "VIEWER", "TRANSACTION_MANAGER"]);

type Member = {
  id: string;
  role: string;
  user: { email: string; displayName: string | null };
};

export function SharePanel({ accountId }: { accountId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();
  async function load() {
    const response = await fetch(`/api/v1/accounts/${accountId}/members`);
    const body = await response.json();
    if (response.ok) setMembers(body.data);
  }
  useEffect(() => {
    load();
  }, [accountId]);
  async function share(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/v1/accounts/${accountId}/shares`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error?.message || t("accounts.share.failed"));
      toast({
        variant: "error",
        title: t("accounts.share.failedTitle"),
        description: t("accounts.share.failedDescription"),
      });
      return;
    }
    setEmail("");
    setMessage(
      body.data.accepted
        ? t("accounts.share.granted")
        : t("accounts.share.pending"),
    );
    toast({
      variant: "success",
      title: body.data.accepted
        ? t("accounts.share.grantedTitle")
        : t("accounts.share.pendingTitle"),
    });
    load();
  }
  return (
    <section className="share-panel">
      <h2>{t("accounts.share.title")}</h2>
      <form className="share-form" onSubmit={share}>
        <label>
          {t("accounts.share.email")}
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("accounts.share.emailPlaceholder")}
          />
        </label>
        <label>
          {t("accounts.share.permission")}
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="VIEWER">{t("enums.memberRole.VIEWER")}</option>
            <option value="TRANSACTION_MANAGER">
              {t("enums.memberRole.TRANSACTION_MANAGER")}
            </option>
          </select>
        </label>
        <button className="button button-small">
          {t("accounts.share.submit")}
        </button>
      </form>
      {message && (
        <p className="share-message" role="status">
          {message}
        </p>
      )}
      <div className="member-list">
        {members.map((member) => (
          <div key={member.id}>
            <span>{member.user.displayName || member.user.email}</span>
            <em>
              {ROLES.has(member.role)
                ? t(`enums.memberRole.${member.role as ShareRole}`)
                : member.role.replaceAll("_", " ")}
            </em>
          </div>
        ))}
      </div>
    </section>
  );
}
