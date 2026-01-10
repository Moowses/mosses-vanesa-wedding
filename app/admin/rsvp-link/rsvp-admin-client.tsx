"use client";

import { useMemo, useState } from "react";
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

export default function RsvpAdminClient({ initialRows }: { initialRows: Row[] }) {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold">RSVP Admin</h1>

          {!unlocked ? (
            <div className="flex gap-2">
              <input
                className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card title="Invited Groups" value={invitedGroups} />
          <Card title="Total Invited Guests" value={totalInvitedGuests} />
          <Card title="Confirmed Guests" value={confirmedGuests} />
          <Card title="Can't Attend Guests" value={cantAttendGuests} />
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

      {editing ? (
        <EditModal
          value={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      ) : null}
    </div>
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
              {unlocked ? (
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              ) : null}
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
          <div className="text-lg font-semibold">
            {form.id ? "Edit Guest" : "Add Guest"}
          </div>
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
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
          >
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
