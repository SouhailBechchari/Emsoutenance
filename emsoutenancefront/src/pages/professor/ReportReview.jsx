import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

/**
 * Page de Gestion des Rapports et Étudiants
 * 
 * Cette page est le cœur de l'activité du professeur. Elle permet de :
 * 1. Voir la liste des étudiants encadrés
 * 2. Voir la liste des étudiants pour lesquels il est rapporteur
 * 3. Valider des rapports ou demander des corrections
 * 4. Ajouter des remarques textuelles
 */
export default function ReportReview() {
  const { user } = useAuth();

  // États de l'interface
  const [activeTab, setActiveTab] = useState("encadrant"); // 'encadrant', 'rapporteur' ou 'jury'
  const [loading, setLoading] = useState(true);

  // Stockage des listes d'étudiants triées par catégorie
  const [students, setStudents] = useState({
    encadrant: [],
    rapporteur: [],
    jury: []
  });

  // États pour les modales ou actions
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // --- Optimisation : Lancement des requêtes en parallèle ---
      // On récupère toutes les données nécessaires en une seule fois
      const [studentsResponse, reportsResponse, defensesResponse] = await Promise.all([
        api.get('/professors/students'),
        api.get('/professors/reports'),
        api.get('/professors/defenses')
      ]);

      const allStudents = studentsResponse.data || [];
      const allReports = reportsResponse.data || [];
      const allDefenses = defensesResponse.data || [];

      // --- 1. Séparation des étudiants par rôle (Encadrant vs Rapporteur) ---
      const encadrantStudents = allStudents.filter(s => s.relation_type === 'encadrant');
      const rapporteurStudents = allStudents.filter(s => s.relation_type === 'rapporteur');

      // --- 2. Enrichissement des données Étudiants ---
      // On ajoute l'info du dernier rapport à chaque étudiant pour l'afficher directement dans le tableau
      const enrichStudentData = (studentList) => {
        return studentList.map(student => {
          const studentReports = allReports.filter(r => r.student_id === student.id);
          // On prend le plus récent
          const latestReport = studentReports.length > 0 ? studentReports[0] : null;

          return {
            ...student,
            report: latestReport,
            reportStatus: latestReport ? latestReport.status : 'Non déposé',
            reportDate: latestReport ? latestReport.submitted_at : null
          };
        });
      };

      // --- 3. Préparation des données pour l'onglet Jury ---
      // Transforme les défenses en format "étudiant" pour utiliser le même composant de tableau
      const juryData = allDefenses.map(defense => ({
        id: defense.student?.id,
        name: defense.student?.user?.name,
        matricule: defense.student?.matricule,
        filiere: defense.student?.filiere,
        role: 'Membre du Jury', // Simplification
        reportStatus: defense.report?.status === 'validated' ? 'Validé' : 'En attente',
        defenseDate: defense.scheduled_at
      }));

      setStudents({
        encadrant: enrichStudentData(encadrantStudents),
        rapporteur: enrichStudentData(rapporteurStudents),
        jury: juryData
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ouvre le fichier PDF du rapport dans un nouvel onglet
   */
  const handleViewReport = (student) => {
    if (student.report?.file_path) {
      // Astuce : on reconstruit l'URL complète du fichier stocké
      const backendUrl = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:8000';

      window.open(`${backendUrl}/storage/${student.report.file_path}`, '_blank');
    } else {
      alert('Aucun fichier disponible.');
    }
  };

  /**
   * Prépare l'ajout d'une remarque
   */
  const handleAddFeedback = (student) => {
    if (!student.report) {
      alert("L'étudiant n'a pas encore soumis de rapport.");
      return;
    }
    setSelectedReport(student.report);
    setShowFeedbackModal(true);
  };

  /**
   * Envoie la remarque au serveur
   */
  const handleSubmitFeedback = async () => {
    if (!selectedReport || !feedback.trim()) return;

    try {
      await api.post(`/professors/reports/${selectedReport.id}/remarks`, {
        content: feedback
      });

      alert('Remarque ajoutée avec succès !');
      setFeedback("");
      setShowFeedbackModal(false);
      fetchData(); // Rafraîchir pour voir les changements si besoin
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de l'enregistrement de la remarque.");
    }
  };

  /**
   * Valide le rapport (Action réservée au Rapporteur généralement)
   */
  const handleValidateReport = async (student) => {
    if (!confirm("Voulez-vous valider définitivement ce rapport ? Cette action autorisera la soutenance.")) return;

    try {
      await api.post(`/professors/reports/${student.report.id}/validate`);
      alert('Rapport validé !');
      fetchData(); // Mise à jour immédiate de l'interface
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors de la validation.");
    }
  };

  // Petits helpers pour le style des badges statuts
  const getStatusLabel = (status) => {
    const map = {
      'pending': 'En attente',
      'validated': 'Validé',
      'need_correction': 'Correction demandée',
      'rejected': 'Rejeté'
    };
    return map[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      'validated': 'bg-green-600',
      'pending': 'bg-yellow-600',
      'need_correction': 'bg-red-600',
      'rejected': 'bg-red-800'
    };
    return map[status] || 'bg-gray-600';
  };

  // --- RENDU DU TABLEAU ---
  const renderStudentList = (list) => {
    if (list.length === 0) return <div className="p-8 text-center text-gray-500 bg-gray-800 rounded">Aucun étudiant dans cette catégorie.</div>;

    return (
      <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase border-b border-gray-700">
              <th className="p-4">Matricule</th>
              <th className="p-4">Nom</th>
              <th className="p-4">Filière</th>
              <th className="p-4">Statut Rapport</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {list.map((student) => (
              <tr key={student.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                <td className="p-4 font-mono text-sm text-gray-400">{student.matricule || "N/A"}</td>
                <td className="p-4 font-medium text-white">{student.user?.name || student.name}</td>
                <td className="p-4">{student.filiere}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs text-white ${getStatusBadgeClass(student.reportStatus)}`}>
                    {getStatusLabel(student.reportStatus)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {/* Bouton VOIR - toujours visible si un rapport existe */}
                    {(student.report || student.reportStatus !== 'Non déposé') && (
                      <button
                        onClick={() => handleViewReport(student)}
                        className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded hover:bg-blue-800 text-sm border border-blue-800"
                      >
                        Voir
                      </button>
                    )}

                    {/* Actions Spécifiques RAPPORTEUR */}
                    {activeTab === 'rapporteur' && student.reportStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleValidateReport(student)}
                          className="px-3 py-1 bg-green-900/50 text-green-300 rounded hover:bg-green-800 text-sm border border-green-800"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleAddFeedback(student)}
                          className="px-3 py-1 bg-yellow-900/50 text-yellow-300 rounded hover:bg-yellow-800 text-sm border border-yellow-800"
                        >
                          Corriger
                        </button>
                      </>
                    )}

                    {/* Actions Spécifiques ENCADRANT (peut commenter mais pas valider) */}
                    {activeTab === 'encadrant' && (student.report || student.reportStatus !== 'Non déposé') && (
                      <button
                        onClick={() => handleAddFeedback(student)}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm border border-gray-600"
                      >
                        Note
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return <div className="text-white text-center mt-20">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Gestion des Rapports et Soutenances</h1>

        {/* --- ONGLETS DE NAVIGATION --- */}
        <div className="flex space-x-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("encadrant")}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "encadrant" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
          >
            Mes Étudiants (Encadrant)
          </button>
          <button
            onClick={() => setActiveTab("rapporteur")}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "rapporteur" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
          >
            Rapports à Évaluer (Rapporteur)
          </button>
          <button
            onClick={() => setActiveTab("jury")}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "jury" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
          >
            Mes Jurys
          </button>
        </div>

        {/* --- CONTENU --- */}
        {renderStudentList(students[activeTab])}

        {/* --- MODALE DE FEEDBACK --- */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Ajouter une remarque</h3>
              <p className="text-gray-400 text-sm mb-4">
                Cette remarque sera visible par l'étudiant. Si vous demandez une correction, soyez précis.
              </p>

              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Le chapitre 3 manque de détails, merci de revoir la bibliographie..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <div className="flex justify-end mt-4 gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/30"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}