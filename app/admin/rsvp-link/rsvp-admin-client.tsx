"use client";

import { useEffect, useMemo, useState } from "react";
import LinkCopy from "./LinkCopy";

type Attendance = "yes" | "no" | null;

type Row = {
  id: string;
  name: string;
  paxAllowed: number;
  role: string;
  relation: string;
  rsvpSubmitted: boolean;
  attendance?: Attendance;
  link: string;
};

const ROLE_RANK: Record<string, number> = {
  "major sponsor": 1,
  "secondary sponsor": 2,
  entourage: 3,
  vip: 4,
  guest: 5,
};

function normalizeRole(role: string) {
  return (role ?? "").trim().toLowerCase();
}

function roleRank(role: string) {
  const r = normalizeRole(role);
  return ROLE_RANK[r] ?? 999;
}

type TabKey = "manage" | "tables" | "comm";

type RsvpMessage = {
  id: string; // doc id
  guestId?: string;
  email?: string;
  attendance?: string;
  announcementOptIn?: boolean;
  paxAttending?: number;
  message?: string;
  submittedAt?: string | null; // server formatted
};

function guestNameFrom(rows: Row[], guestId: string | undefined, fallbackId: string) {
  const key = guestId || fallbackId;
  const found = rows.find((r) => r.id === key);
  return found?.name || key;
}

function badgeAttendance(att?: string) {
  const a = String(att || "").toLowerCase();
  if (a === "yes") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (a === "no") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (a === "maybe") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  // already formatted on server ideally, but keep safe
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RsvpAdminClient({ initialRows }: { initialRows: Row[] }) {
  const [tab, setTab] = useState<TabKey>("manage");

  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [rows, setRows] = useState<Row[]>(
    initialRows
      .map((r) => ({
        ...r,
        name: (r.name ?? "").trim(),
        role: (r.role ?? "").trim(),
        relation: (r.relation ?? "").trim(),
      }))
      .filter((r) => r.name.length > 0)
  );

  const [roleAsc, setRoleAsc] = useState(true);
  const [query, setQuery] = useState("");

  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showCantAttend, setShowCantAttend] = useState(true);
  const [showNotConfirmed, setShowNotConfirmed] = useState(true);

  const [editing, setEditing] = useState<Row | null>(null);

  // ✅ Communication: message inbox
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);
  const [messages, setMessages] = useState<RsvpMessage[]>([]);
  const [msgSearch, setMsgSearch] = useState("");
  const [activeMsg, setActiveMsg] = useState<RsvpMessage | null>(null);

  // ✅ Communication: announcement
  const [annSubject, setAnnSubject] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annOptInOnly, setAnnOptInOnly] = useState(true);
  const [annSending, setAnnSending] = useState(false);

  async function adminWrite(payload: any) {
    const res = await fetch("/api/admin/guest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-code": code,
      },
      body: JSON.stringify(payload),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      alert(`API error (${res.status}). ${text || "Non-JSON response"}`);
      throw new Error("Non-JSON response");
    }

    if (!res.ok || !data?.ok) {
      alert(`API error (${res.status}): ${data?.error || "Unknown error"}`);
      throw new Error(data?.error || "Request failed");
    }

    return data;
  }

  // ✅ NEW: load RSVP messages from Firestore (server route)
  async function loadMessages() {
    if (!unlocked) return;
    setMsgLoading(true);
    setMsgErr(null);
    try {
      const res = await fetch("/api/admin/rsvp/messages", {
        headers: {
          "x-admin-code": code,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e: any) {
      setMsgErr(e?.message || "Failed to load messages");
    } finally {
      setMsgLoading(false);
    }
  }

  // ✅ NEW: send announcement to RSVP emails (server route)
  async function sendAnnouncement() {
    if (!unlocked) return;
    if (!annSubject.trim() || !annBody.trim()) {
      alert("Subject and message are required.");
      return;
    }

    setAnnSending(true);
    try {
      const res = await fetch("/api/admin/rsvp/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-code": code,
        },
        body: JSON.stringify({
          subject: annSubject.trim(),
          body: annBody.trim(),
          optInOnly: annOptInOnly,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      alert(`Announcement sent to ${data.sent || 0} recipient(s).`);
      setAnnSubject("");
      setAnnBody("");
    } catch (e: any) {
      alert(e?.message || "Failed to send announcement");
    } finally {
      setAnnSending(false);
    }
  }

  // auto-load messages when opening communication tab (after unlock)
  useEffect(() => {
    if (tab !== "comm") return;
    if (!unlocked) return;
    // only load once if empty
    if (messages.length === 0 && !msgLoading) loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, unlocked]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];

    copy.sort((a, b) => {
      const ra = roleRank(a.role);
      const rb = roleRank(b.role);
      if (ra !== rb) return roleAsc ? ra - rb : rb - ra;
      return a.name.localeCompare(b.name);
    });

    return copy;
  }, [filteredRows, roleAsc]);

  const notConfirmed = sortedRows.filter((r) => !r.rsvpSubmitted);

  const cantAttend = sortedRows.filter(
    (r) => r.rsvpSubmitted && (r.attendance ?? null) === "no"
  );

  const confirmed = sortedRows.filter((r) => {
    if (!r.rsvpSubmitted) return false;
    const att = r.attendance ?? null;
    return att === null || att === "yes";
  });

  const invitedGroups = rows.length;
  const totalInvitedGuests = rows.reduce((s, r) => s + (r.paxAllowed || 1), 0);
  const confirmedGuests = confirmed.reduce((s, r) => s + (r.paxAllowed || 1), 0);
  const cantAttendGuests = cantAttend.reduce((s, r) => s + (r.paxAllowed || 1), 0);

  async function addGuest() {
    if (!unlocked) return;

    setEditing({
      id: "",
      name: "",
      paxAllowed: 1,
      role: "Guest",
      relation: "",
      rsvpSubmitted: false,
      attendance: null,
      link: "",
    });
  }

  async function saveEdit(next: Row) {
    if (!unlocked) return;

    const fullName = next.name.trim();
    if (!fullName) {
      alert("Guest name is required");
      return;
    }

    const paxAllowed = Math.max(1, Number(next.paxAllowed || 1));
    const role = (next.role || "guest").trim().toLowerCase();
    const relation = (next.relation || "").trim().toLowerCase();

    if (!next.id) {
      await adminWrite({
        mode: "add",
        fullName,
        paxAllowed,
        role,
        relation,
      });
      window.location.reload();
      return;
    }

    await adminWrite({
      mode: "edit",
      id: next.id,
      fullName,
      paxAllowed,
      role,
      relation,
    });

    setRows((prev) =>
      prev.map((x) =>
        x.id === next.id
          ? { ...x, name: fullName, paxAllowed, role, relation }
          : x
      )
    );

    setEditing(null);
  }

  async function deleteRow(r: Row) {
    if (!unlocked) return;
    if (!confirm(`Delete ${r.name}?`)) return;

    await adminWrite({ mode: "delete", id: r.id });
    setRows((prev) => prev.filter((x) => x.id !== r.id));
  }

  async function setAttendance(r: Row, attendance: Attendance, rsvpSubmitted: boolean) {
    if (!unlocked) return;

    await adminWrite({
      mode: "edit",
      id: r.id,
      attendance,
      rsvpSubmitted,
    });

    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, attendance, rsvpSubmitted } : x
      )
    );
  }

  const filteredMessages = useMemo(() => {
    const q = msgSearch.trim().toLowerCase();
    const base = messages.filter((m) => String(m.message || "").trim().length > 0);
    if (!q) return base;

    return base.filter((m) => {
      const name = guestNameFrom(rows, m.guestId, m.id).toLowerCase();
      const email = String(m.email || "").toLowerCase();
      const msg = String(m.message || "").toLowerCase();
      return name.includes(q) || email.includes(q) || msg.includes(q);
    });
  }, [messages, msgSearch, rows]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">RSVP Admin</h1>

          {!unlocked ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="w-full sm:w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="Admin code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={() => setUnlocked(code === "1433")}
              >
                Unlock
              </button>
            </div>
          ) : (
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={addGuest}
            >
              Add Guest
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card title="Invited Groups" value={invitedGroups} />
          <Card title="Total Invited Guests" value={totalInvitedGuests} />
          <Card title="Confirmed Guests" value={confirmedGuests} />
          <Card title="Can't Attend Guests" value={cantAttendGuests} />
        </div>

        {/* Tabs */}
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-2">
          <div className="grid grid-cols-3 gap-2">
            <TabButton active={tab === "manage"} onClick={() => setTab("manage")}>
              Manage Guests
            </TabButton>
            <TabButton active={tab === "tables"} onClick={() => setTab("tables")}>
              Table Assignment
            </TabButton>
            <TabButton active={tab === "comm"} onClick={() => setTab("comm")}>
              Communication
            </TabButton>
          </div>
        </div>

        {/* Manage Guests Panel */}
        {tab === "manage" && (
          <>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-700">
                Role sort:{" "}
                <button
                  className="underline underline-offset-2"
                  onClick={() => setRoleAsc((v) => !v)}
                >
                  {roleAsc ? "Top Sponsors First" : "Guests First"}
                </button>
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guest name..."
                className="w-full md:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="mt-4">
              <Section
                title={`Confirmed (${confirmed.length})`}
                open={showConfirmed}
                onToggle={() => setShowConfirmed((v) => !v)}
              >
                <GuestTable
                  data={confirmed}
                  unlocked={unlocked}
                  onEdit={(r) => setEditing(r)}
                  onDelete={deleteRow}
                  renderAdminActions={(g) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setAttendance(g, "yes", true)}
                        className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 w-full sm:w-auto"
                      >
                        Can Attend
                      </button>
                      <button
                        onClick={() => setAttendance(g, "no", true)}
                        className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 w-full sm:w-auto"
                      >
                        Can't Attend
                      </button>
                      <button
                        onClick={() => setAttendance(g, null, false)}
                        className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 w-full sm:w-auto"
                      >
                        Move to Not Confirmed
                      </button>
                    </div>
                  )}
                />
              </Section>

              <Section
                title={`Can't Attend (${cantAttend.length})`}
                open={showCantAttend}
                onToggle={() => setShowCantAttend((v) => !v)}
              >
                <GuestTable
                  data={cantAttend}
                  unlocked={unlocked}
                  onEdit={(r) => setEditing(r)}
                  onDelete={deleteRow}
                  renderAdminActions={(g) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setAttendance(g, "yes", true)}
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                      >
                        Can Attend
                      </button>
                      <button
                        onClick={() => setAttendance(g, null, false)}
                        className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Move to Not Confirmed
                      </button>
                    </div>
                  )}
                />
              </Section>

              <Section
                title={`Not Confirmed (${notConfirmed.length})`}
                open={showNotConfirmed}
                onToggle={() => setShowNotConfirmed((v) => !v)}
              >
                <GuestTable
                  data={notConfirmed}
                  unlocked={unlocked}
                  onEdit={(r) => setEditing(r)}
                  onDelete={deleteRow}
                  renderAdminActions={(g) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setAttendance(g, "yes", true)}
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                      >
                        Confirm Attend
                      </button>
                      <button
                        onClick={() => setAttendance(g, "no", true)}
                        className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
                      >
                        Can't Attend
                      </button>
                    </div>
                  )}
                />
              </Section>
            </div>
          </>
        )}

        {/* Table Assignment Panel (placeholder for now) */}
        {tab === "tables" && (
          <div className="mt-4 rounded-2xl bg-white ring-1 ring-slate-200 p-5">
            <div className="text-base font-semibold">Table Assignment</div>
            <div className="mt-1 text-sm text-slate-600">
              Next step: we’ll store <span className="font-semibold">tableGroup</span> and{" "}
              <span className="font-semibold">tableNo</span> on the RSVP doc.
            </div>
            <div className="mt-4 text-sm text-slate-700">
              (We can implement the modal + assign UI after Communication is done.)
            </div>
          </div>
        )}

        {/* Communication Panel */}
        {tab === "comm" && (
          <div className="mt-4 space-y-4">
            {/* Messages Inbox */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-base font-semibold">Messages Inbox</div>
                  <div className="text-sm text-slate-600">
                    Shows RSVPs where <span className="font-semibold">message</span> is not empty.
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    placeholder="Search name, email, message…"
                    className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    onClick={loadMessages}
                    disabled={!unlocked || msgLoading}
                    className={`rounded-xl px-4 py-2 text-sm text-white ${
                      unlocked && !msgLoading
                        ? "bg-slate-900 hover:bg-slate-800"
                        : "bg-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {msgLoading ? "Loading…" : "Refresh"}
                  </button>
                </div>
              </div>

              {msgErr ? (
                <div className="px-4 pb-4 text-sm text-rose-700">{msgErr}</div>
              ) : null}

              <div className="overflow-x-auto border-t border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Guest</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Attendance</th>
                      <th className="px-4 py-3 text-left font-semibold">Message</th>
                      <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.length === 0 ? (
                      <tr>
                        <td className="px-4 py-5 text-slate-600" colSpan={6}>
                          {msgLoading ? "Loading…" : "No messages found."}
                        </td>
                      </tr>
                    ) : (
                      filteredMessages.map((m, idx) => {
                        const name = guestNameFrom(rows, m.guestId, m.id);
                        const preview = String(m.message || "").trim().slice(0, 80);
                        return (
                          <tr key={m.id} className={idx % 2 ? "bg-slate-50" : ""}>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {name}
                              <div className="text-xs text-slate-500">{m.guestId || m.id}</div>
                            </td>
                            <td className="px-4 py-3">{m.email || "—"}</td>
                            <td className="px-4 py-3">
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                                  badgeAttendance(m.attendance),
                                ].join(" ")}
                              >
                                {m.attendance || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-800">
                              {preview}
                              {String(m.message || "").trim().length > 80 ? "…" : ""}
                            </td>
                            <td className="px-4 py-3">{fmtDate(m.submittedAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setActiveMsg(m)}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Announcement */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-semibold">Send Announcement</div>
                  <div className="text-sm text-slate-600">
                    Sends an email to RSVP emails from Firestore <span className="font-semibold">rsvps</span>.
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={annOptInOnly}
                    onChange={(e) => setAnnOptInOnly(e.target.checked)}
                  />
                  Only announcement opt-in
                </label>
              </div>

              <div className="mt-3 grid gap-3">
                <div>
                  <div className="mb-1 text-sm font-medium">Subject</div>
                  <input
                    value={annSubject}
                    onChange={(e) => setAnnSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Wedding Update: Important Reminder"
                  />
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium">Message</div>
                  <textarea
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                    className="w-full min-h-[160px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Write your announcement..."
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    disabled={!unlocked || annSending}
                    onClick={sendAnnouncement}
                    className={`rounded-xl px-4 py-2 text-sm text-white ${
                      unlocked && !annSending
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {annSending ? "Sending…" : "Send Announcement"}
                  </button>
                </div>

                {!unlocked ? (
                  <div className="text-xs text-slate-500">Unlock to send announcements.</div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editing ? (
        <EditModal value={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      ) : null}

      {activeMsg ? (
        <MessageModal
          open={!!activeMsg}
          onClose={() => setActiveMsg(null)}
          title={guestNameFrom(rows, activeMsg.guestId, activeMsg.id)}
          message={activeMsg}
        />
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow ring-1 ring-slate-200">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
  open,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button className="text-sm underline underline-offset-2" onClick={onToggle}>
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open ? children : null}
    </div>
  );
}

function GuestTable({
  data,
  unlocked,
  onEdit,
  onDelete,
  renderAdminActions,
}: {
  data: Row[];
  unlocked: boolean;
  onEdit: (r: Row) => void;
  onDelete: (r: Row) => void;
  renderAdminActions: (r: Row) => React.ReactNode;
}) {
  if (!data.length) {
    return (
      <div className="rounded-xl bg-white p-6 text-slate-700 ring-1 ring-slate-200">
        No records
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-slate-900">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Guest</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-center font-semibold">Pax</th>
              <th className="px-4 py-3 text-left font-semibold">Link</th>
              {unlocked ? <th className="px-4 py-3 text-left font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.map((g, i) => (
              <tr key={g.id} className={i % 2 ? "bg-slate-50" : ""}>
                <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                <td className="px-4 py-3 text-slate-900">{g.role}</td>
                <td className="px-4 py-3 text-center text-slate-900">{g.paxAllowed}</td>
                <td className="px-4 py-3">
                  <LinkCopy link={g.link} />
                </td>
                {unlocked ? (
                  <td className="px-4 py-3">
                    <div className="flex w-40 flex-col gap-2 sm:w-auto">
                      {renderAdminActions(g)}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onEdit(g)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 w-full sm:w-auto"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(g)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 w-full sm:w-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditModal({
  value,
  onClose,
  onSave,
}: {
  value: Row;
  onClose: () => void;
  onSave: (next: Row) => void;
}) {
  const [form, setForm] = useState<Row>(value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">{form.id ? "Edit Guest" : "Add Guest"}</div>
          <button className="text-sm underline" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-sm font-medium">Guest Name</div>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-sm font-medium">Pax Allowed</div>
              <input
                type="number"
                min={1}
                value={form.paxAllowed}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paxAllowed: Number(e.target.value || 1) }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium">Role</div>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Major Sponsor</option>
                <option>Secondary Sponsor</option>
                <option>Entourage</option>
                <option>VIP</option>
                <option>Guest</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">Relation</div>
            <input
              value={form.relation}
              onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Family side / Friends"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageModal({
  open,
  onClose,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: RsvpMessage;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{message.email || "—"}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                  badgeAttendance(message.attendance),
                ].join(" ")}
              >
                Attendance: {message.attendance || "—"}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                Opt-in: {message.announcementOptIn ? "Yes" : "No"}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                Pax: {Number(message.paxAttending || 0)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Message</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                {String(message.message || "").trim() || "—"}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Submitted: {fmtDate(message.submittedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
