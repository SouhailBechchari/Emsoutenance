import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../services/api";
import { CalendarIcon, SortIcon } from "../../components/icons/ModernIcons";

/**
 * Gestion de la Planification des Soutenances
 * 
 * Permet à l'administrateur de :
 * - Voir la liste des soutenances planifiées.
 * - Planifier une nouvelle soutenance (Date, Salle, Étudiant, Rapport).
 * - Gérer le Jury (Président, Rapporteur, Examinateur, Encadrant).
 * - Filtrer par Date, Filière, Encadrant.
 */
export default function ScheduleManagement() {
  // --- STATES ---
  const [defenses, setDefenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [reports, setReports] = useState([]); // Pour lier une soutenance à un rapport

  const [loading, setLoading] = useState(true);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showJuryModal, setShowJuryModal] = useState(false);

  // Sélection en cours
  const [selectedDefense, setSelectedDefense] = useState(null);

  // Formulaire Nouvelle Soutenance
  const [newDefense, setNewDefense] = useState({
    student_id: "",
    report_id: "",
    scheduled_at: "",
    salle: "",
  });

  // Gestion du Jury (Structure fixe)
  const defaultJury = [
    { role: "encadrant", professor_id: "" },
    { role: "rapporteur", professor_id: "" },
    { role: "examinateur", professor_id: "" },
    { role: "president", professor_id: "" },
  ];
  const [juryMembers, setJuryMembers] = useState(defaultJury);

  // Filtres
  const [filter, setFilter] = useState({
    date: "",
    filiere: "",
    encadrant_id: ""
  });

  // --- LIFECYCLE ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- API CALLS ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [defensesRes, studentsRes, professorsRes, reportsRes] = await Promise.all([
        api.get('/admin/defenses'),
        api.get('/admin/students?all=1'),
        api.get('/admin/professors?all=1'),
        api.get('/admin/reports')
      ]);

      setDefenses(defensesRes.data.data || defensesRes.data || []);
      setStudents(studentsRes.data.data || studentsRes.data || []);
      setProfessors(professorsRes.data.data || professorsRes.data || []);
      setReports(reportsRes.data.data || reportsRes.data || []);

    } catch (error) {
      console.error('Erreur données:', error);
      alert('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE METIER ---

  // Étudiants éligibles (ayant au moins un rapport déposé)
  const studentsWithReports = students.filter(student => {
    return reports.some(r => parseInt(r.student_id) === parseInt(student.id));
  });

  // Gestion changement étudiant dans le formulaire : Pré-remplissage auto
  const handleStudentSelect = (studentId) => {
    const student = students.find(s => parseInt(s.id) === parseInt(studentId));
    // Trouver le dernier rapport (ou un rapport spécifique si logique complexe)
    const studentReports = reports.filter(r => parseInt(r.student_id) === parseInt(studentId));
    const latestReport = studentReports.length > 0 ? studentReports[studentReports.length - 1] : null;

    // Pré-configuration du jury selon l'étudiant
    let initialJury = [...defaultJury];
    if (student) {
      // Encadrant
      if (student.encadrant_id) {
        initialJury = initialJury.map(j => j.role === 'encadrant' ? { ...j, professor_id: student.encadrant_id.toString() } : j);
      }
      // Rapporteur (si défini sur l'étudiant, sinon libre)
      if (student.rapporteur_id) {
        initialJury = initialJury.map(j => j.role === 'rapporteur' ? { ...j, professor_id: student.rapporteur_id.toString() } : j);
      }
    }
    setJuryMembers(initialJury);

    setNewDefense({
      ...newDefense,
      student_id: studentId,
      report_id: latestReport?.id?.toString() || "",
    });
  };

  const handleAddDefense = async () => {
    if (!newDefense.student_id || !newDefense.report_id || !newDefense.scheduled_at || !newDefense.salle) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Formatage date
      const scheduledAt = `${newDefense.scheduled_at}:00`;

      // 1. Création Defense
      const response = await api.post('/admin/defenses', {
        student_id: newDefense.student_id,
        report_id: newDefense.report_id,
        scheduled_at: scheduledAt,
        salle: newDefense.salle,
      });

      const defenseId = response.data.id;

      // 2. Assignation Jury (seulement ceux remplis)
      const filledJury = juryMembers.filter(j => j.professor_id);
      if (filledJury.length > 0) {
        await api.post(`/admin/defenses/${defenseId}/jury`, { jury: filledJury });
      }

      resetAddForm();
      fetchData();
      alert('Soutenance planifiée avec succès !');
    } catch (error) {
      console.error('Erreur création:', error);
      alert('Erreur lors de la planification.');
    }
  };

  const handleAssignJury = async () => {
    const filledJury = juryMembers.filter(j => j.professor_id);
    if (filledJury.length < 2) {
      alert('Le jury doit contenir au moins 2 membres.');
      return;
    }

    try {
      await api.post(`/admin/defenses/${selectedDefense.id}/jury`, { jury: filledJury });
      closeJuryModal();
      fetchData();
      alert('Jury mis à jour avec succès.');
    } catch (error) {
      console.error('Erreur jury:', error);
      alert('Erreur lors de l\'assignation du jury.');
    }
  };

  const handleDeleteDefense = async (defenseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette soutenance ?')) return;
    try {
      await api.delete(`/admin/defenses/${defenseId}`);
      fetchData();
      alert('Soutenance supprimée.');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur impossible de supprimer.');
    }
  };

  // --- UTILS ---
  const resetAddForm = () => {
    setNewDefense({ student_id: "", report_id: "", scheduled_at: "", salle: "" });
    setJuryMembers(defaultJury);
    setShowAddModal(false);
  };

  const openJuryModal = (defense) => {
    setSelectedDefense(defense);

    // Charger le jury existant ou le par défaut
    if (defense.jury_members && defense.jury_members.length > 0) {
      const currentJury = defaultJury.map(defMember => {
        const found = defense.jury_members.find(m => m.role === defMember.role);
        return found ? { role: defMember.role, professor_id: found.professor_id } : defMember;
      });
      setJuryMembers(currentJury);
    } else {
      // Logique de pré-remplissage si pas de jury encore défini (optionnel)
      setJuryMembers(defaultJury);
    }
    setShowJuryModal(true);
  };

  const closeJuryModal = () => {
    setShowJuryModal(false);
    setSelectedDefense(null);
    setJuryMembers(defaultJury);
  };

  // --- FILTRAGE ---
  const filteredDefenses = defenses.filter(d => {
    const student = students.find(s => s.id === d.student_id);
    if (!student) return false;

    // Filtre Date
    const matchDate = !filter.date || d.scheduled_at?.startsWith(filter.date);
    // Filtre Filière
    const matchFiliere = !filter.filiere || student.filiere === filter.filiere;
    // Filtre Encadrant
    const matchEncadrant = !filter.encadrant_id || student.encadrant_id === parseInt(filter.encadrant_id);

    return matchDate && matchFiliere && matchEncadrant;
  });

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <AdminSidebar />
      <main className="md:ml-64 pt-4 pb-8 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold border-l-4 border-purple-500 pl-4">Planification des Soutenances</h1>
          <button
            className="btn-primary px-4 py-2 flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <CalendarIcon className="w-5 h-5" />
            Planifier une soutenance
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-gray-800 rounded-lg p-5 mb-6 shadow-lg border border-gray-700">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
            <SortIcon className="w-4 h-4" /> Filtres
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input type="date" className="input-field-dark" value={filter.date} onChange={e => setFilter({ ...filter, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Filière</label>
              <select className="input-field-dark" value={filter.filiere} onChange={e => setFilter({ ...filter, filiere: e.target.value })}>
                <option value="">Toutes</option>
                {[...new Set(students.map(s => s.filiere))].filter(Boolean).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Encadrant</label>
              <select className="input-field-dark" value={filter.encadrant_id} onChange={e => setFilter({ ...filter, encadrant_id: e.target.value })}>
                <option value="">Tous</option>
                {professors.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement...</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Étudiant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date & Salle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Jury</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {filteredDefenses.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Aucune soutenance trouvée.</td></tr>
                  ) : (
                    filteredDefenses.map(defense => {
                      const student = students.find(s => s.id === defense.student_id);
                      return (
                        <tr key={defense.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{student?.user?.name || 'Inconnu'}</div>
                            <div className="text-xs text-gray-400">{student?.filiere}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-purple-300 font-medium">
                              {new Date(defense.scheduled_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(defense.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {defense.salle}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={defense.status} />
                          </td>
                          <td className="px-6 py-4">
                            <ul className="text-xs space-y-1 text-gray-300">
                              {defense.jury_members?.map((m, i) => (
                                <li key={i}><span className="text-gray-500 capitalize">{m.role}:</span> {m.professor?.user?.name}</li>
                              ))}
                              {(!defense.jury_members || defense.jury_members.length === 0) && <span className="text-gray-500 italic">Non défini</span>}
                            </ul>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => openJuryModal(defense)} className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase border border-blue-400/30 px-2 py-1 rounded hover:bg-blue-400/10">
                              Gérer Jury
                            </button>
                            <button onClick={() => handleDeleteDefense(defense.id)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase border border-red-400/30 px-2 py-1 rounded hover:bg-red-400/10">
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-750 px-6 py-2 border-t border-gray-700 text-xs text-gray-400 text-right">
              Total: {filteredDefenses.length}
            </div>
          </div>
        )}

        {/* MODAL AJOUT */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gray-750 px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">Nouvelle Soutenance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Étudiant</label>
                  <select className="input-field-dark" value={newDefense.student_id} onChange={e => handleStudentSelect(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    {studentsWithReports.map(s => (
                      <option key={s.id} value={s.id}>{s.user?.name} ({s.filiere})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">* Seuls les étudiants ayant déposé un rapport apparaissent ici.</p>
                </div>

                {newDefense.student_id && (
                  <div>
                    <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Rapport à soutenir</label>
                    <select className="input-field-dark" value={newDefense.report_id} onChange={e => setNewDefense({ ...newDefense, report_id: e.target.value })}>
                      {reports.filter(r => parseInt(r.student_id) === parseInt(newDefense.student_id)).map(r => (
                        <option key={r.id} value={r.id}>
                          {r.original_filename} (v.{r.version})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Date & Heure</label>
                    <input type="datetime-local" className="input-field-dark" value={newDefense.scheduled_at} onChange={e => setNewDefense({ ...newDefense, scheduled_at: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Salle</label>
                    <input type="text" className="input-field-dark" placeholder="ex: Salle 12" value={newDefense.salle} onChange={e => setNewDefense({ ...newDefense, salle: e.target.value })} />
                  </div>
                </div>

                {/* Pré-visu Jury */}
                <div className="border-t border-gray-600 pt-4 mt-2">
                  <label className="text-xs uppercase text-gray-400 font-bold mb-2 block">Pré-assignation Jury (Optionnel)</label>
                  <div className="space-y-2">
                    {juryMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-24 text-xs text-gray-300 capitalize bg-gray-700 py-1 px-2 rounded">{member.role}</span>
                        <select
                          className="input-field-dark flex-1 py-1 text-sm"
                          value={member.professor_id}
                          onChange={(e) => {
                            const newJury = [...juryMembers];
                            newJury[idx].professor_id = e.target.value;
                            setJuryMembers(newJury);
                          }}
                        >
                          <option value="">-- Libre --</option>
                          {professors.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button onClick={resetAddForm} className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700">Annuler</button>
                  <button onClick={handleAddDefense} className="btn-primary px-4 py-2">Valider</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL JURY */}
        {showJuryModal && selectedDefense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Gestion du Jury</h3>
                <div className="space-y-3">
                  {juryMembers.map((member, idx) => (
                    <div key={idx}>
                      <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">{member.role}</label>
                      <select
                        className="input-field-dark"
                        value={member.professor_id}
                        onChange={(e) => {
                          const newJury = [...juryMembers];
                          newJury[idx].professor_id = e.target.value;
                          setJuryMembers(newJury);
                        }}
                      >
                        <option value="">-- Sélectionner --</option>
                        {professors.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={closeJuryModal} className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700">Fermer</button>
                  <button onClick={handleAssignJury} className="btn-primary px-4 py-2">Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Styles In-Line */}
      <style>{`
        .input-field-dark {
          width: 100%;
          background-color: #374151; 
          border: 1px solid #4b5563;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          color: white;
          outline: none;
        }
        .input-field-dark:focus {
          border-color: #a855f7; /* purple-500 */
        }
      `}</style>
    </div>
  );
}

// Sous-composant Badge
function StatusBadge({ status }) {
  const styles = {
    scheduled: "bg-blue-900 text-blue-300 border-blue-800",
    completed: "bg-green-900 text-green-300 border-green-800",
    cancelled: "bg-red-900 text-red-300 border-red-800",
  };
  const labels = {
    scheduled: "Planifiée",
    completed: "Terminée",
    cancelled: "Annulée",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${styles[status] || "bg-gray-700 text-gray-300"}`}>
      {labels[status] || status}
    </span>
  );
}