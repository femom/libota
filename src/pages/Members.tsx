import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRealtimeFamilyData } from "../hooks/useRealtimeFamilyData";
import { supabase } from "../lib/supabase";
import { getFriendlyErrorMessage } from "../lib/errors";
import { ConfirmDialog, useToast } from "../components/Feedback";
import UpgradeModal from "../components/UpgradeModal";
import type { Member } from "../types";
import {
  Users,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
  X,
  Check,
} from "lucide-react";

const relationships = [
  "parent",
  "enfant",
  "frère",
  "sœur",
  "oncle",
  "tante",
  "cousin",
  "autre",
];

export default function Members() {
  const { isAdmin, familyId, family } = useAuth();
  const {
    members,
    loading,
    error,
    addMember,
    updateMember,
    refetch: refreshMembers,
  } = useRealtimeFamilyData();

  const [showUpgrade, setShowUpgrade] = useState(false);
  const atMemberLimit = !!family && members.length >= family.maxMembers;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();

  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    relationship: "",
  });

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    relationship: "",
    isActive: true,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.firstName.trim() || !addForm.lastName.trim()) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await addMember({
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        phone: addForm.phone.trim(),
        relationship: addForm.relationship,
        isActive: true,
      });
      setAddForm({ firstName: "", lastName: "", phone: "", relationship: "" });
      setShowAddForm(false);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? getFriendlyErrorMessage(err.message)
          : "Impossible d'ajouter le membre.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (member: Member) => {
    setEditingMember(member);
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone || "",
      relationship: member.relationship || "",
      isActive: member.isActive,
    });
    setActionError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await updateMember(editingMember.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        relationship: editForm.relationship.trim(),
        isActive: editForm.isActive,
      });
      setEditingMember(null);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? getFriendlyErrorMessage(err.message)
          : "Impossible de modifier le membre.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    setActionError(null);
    try {
      const { error: deleteError } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);
      if (deleteError) throw deleteError;
      await refreshMembers();
      toast("Membre supprimé.");
      setMemberToDelete(null);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? getFriendlyErrorMessage(err.message)
          : "Impossible de supprimer ce membre.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ConfirmDialog
        open={memberToDelete !== null}
        title="Supprimer ce membre ?"
        description={`La fiche de ${memberToDelete?.name ?? "ce membre"} sera définitivement supprimée.`}
        onCancel={() => setMemberToDelete(null)}
        onConfirm={() => memberToDelete && void handleDelete(memberToDelete.id)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-kicker">Famille</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="page-title">Membres</h1>
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              {members.length}
            </span>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              if (atMemberLimit) {
                setShowUpgrade(true);
                return;
              }
              setShowAddForm(!showAddForm);
              setEditingMember(null);
              setActionError(null);
            }}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={16} />
            Ajouter un membre
          </button>
        )}
      </div>

      {atMemberLimit && isAdmin && (
        <div className="card flex items-start gap-3 p-4 text-sm">
          <AlertCircle size={20} className="text-[var(--warning)]" />
          <div>
            <p className="font-semibold">
              Limite du plan gratuit atteinte ({family?.maxMembers} membres)
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Passez à Libota Pro pour ajouter des membres illimités.
            </p>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="btn-primary ml-auto shrink-0"
          >
            Passer à Pro
          </button>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {!familyId && (
        <div className="card flex items-start gap-3 p-4 text-sm">
          <AlertCircle size={20} className="text-[var(--warning)]" />
          <div>
            <p className="font-semibold">Aucune famille sélectionnée</p>
            <p className="mt-1 text-[var(--muted)]">
              Créez ou rejoignez une famille pour synchroniser les membres.
            </p>
          </div>
        </div>
      )}

      {(error || actionError) && (
        <div className="card flex items-center justify-between gap-3 p-4 text-sm text-[var(--danger)]">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error || actionError}</span>
          </div>
          {error && (
            <button
              onClick={() => refreshMembers()}
              className="text-xs font-semibold underline"
            >
              Réessayer
            </button>
          )}
        </div>
      )}

      {isAdmin && showAddForm && (
        <form onSubmit={handleAdd} className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Nouveau membre</h2>
            <button type="button" onClick={() => setShowAddForm(false)} aria-label="Fermer">
              <X size={18} className="text-[var(--muted)]" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Prénom *
              <input required value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} className="input" placeholder="Jean" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Nom *
              <input required value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} className="input" placeholder="Dupont" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Téléphone
              <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="input" placeholder="+242 06 000 00 00" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Lien de parenté
              <select value={addForm.relationship} onChange={(e) => setAddForm({ ...addForm, relationship: e.target.value })} className="select-input">
                <option value="">Sélectionner un lien</option>
                {relationships.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Ajouter
            </button>
          </div>
        </form>
      )}

      {isAdmin && editingMember && (
        <form onSubmit={handleSaveEdit} className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              Modifier {editingMember.firstName} {editingMember.lastName}
            </h2>
            <button type="button" onClick={() => setEditingMember(null)} aria-label="Fermer">
              <X size={18} className="text-[var(--muted)]" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Prénom *
              <input required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="input" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Nom *
              <input required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="input" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Téléphone
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="input" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
              Lien de parenté
              <select value={editForm.relationship} onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })} className="select-input">
                <option value="">Sélectionner</option>
                {relationships.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              />
              Membre actif
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditingMember(null)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Enregistrer
            </button>
          </div>
        </form>
      )}

      {loading && members.length === 0 ? (
        <div className="empty-state card">
          <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
          <p className="text-sm">Chargement des membres...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state card">
          <Users size={36} />
          <p className="text-sm">Aucun membre dans cette famille</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <div key={member.id} className="card flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                  {(member.firstName[0] || "").toUpperCase()}
                  {(member.lastName[0] || "").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">
                      {member.firstName} {member.lastName}
                    </p>
                    <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--muted)]">
                      {member.role === "admin" ? "Admin" : "Membre"}
                    </span>
                    {!member.isActive && (
                      <span className="text-[10px] text-[var(--muted)]">Inactif</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
                    {member.relationship && <span>{member.relationship}</span>}
                    {member.phone && (
                      <a href={`tel:${member.phone.replace(/\s/g, "")}`} className="text-[var(--accent)]">
                        {member.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => handleStartEdit(member)} className="icon-btn h-9 w-9" title="Modifier">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setMemberToDelete({
                        id: member.id,
                        name: `${member.firstName} ${member.lastName}`,
                      })
                    }
                    className="icon-btn h-9 w-9 text-[var(--danger)]"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
