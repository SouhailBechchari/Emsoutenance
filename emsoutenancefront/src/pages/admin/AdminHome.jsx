import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../services/api";
import { CalendarIcon, ProfessorBoardIcon, UsersIcon } from "../../components/icons/ModernIcons";

/**
 * Page d'Accueil Administrateur (Tableau de bord)
 * 
 * Cette page donne une vue globale du système :
 * - Statistiques clés (Étudiants, Rapports, Soutenances)
 * - Accès rapide aux modules de gestion
 * - Liste des derniers rapports déposés
 */
export default function AdminHome() {
  const { user } = useAuth(); // Récupère l'utilisateur connecté

  // État pour stocker les statistiques
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReports: 0,
    scheduledDefenses: 0,
    upcomingDefenses: 0
  });

  // État pour la liste des rapports récents
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chargement initial des données
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // On lance toutes les requêtes en parallèle pour gagner du temps
      const [studentsRes, reportsRes, defensesRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/reports'),
        api.get('/admin/defenses')
      ]);

      // Extraction des données (avec gestion sécurisée si les tableaux sont vides)
      const studentsData = studentsRes.data.data || studentsRes.data || [];
      const allReports = reportsRes.data.data || reportsRes.data || [];
      const allDefenses = defensesRes.data.data || defensesRes.data || [];

      // Calcul des statistiques
      const totalStudents = studentsRes.data.total || studentsData.length || 0;

      // Rapports nécessitant une action (En attente ou correction)
      const pendingReports = allReports.filter(r => r.status === 'pending' || r.status === 'need_correction').length;

      // Soutenances déjà programmées
      const scheduledDefenses = allDefenses.filter(d => d.status === 'scheduled').length;

      // Soutenances dans les 7 prochains jours
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingDefenses = allDefenses.filter(d => {
        if (d.status !== 'scheduled' || !d.scheduled_at) return false;
        const defenseDate = new Date(d.scheduled_at);
        return defenseDate >= new Date() && defenseDate <= nextWeek;
      }).length;

      // Mise à jour de l'état des stats
      setStats({
        totalStudents,
        pendingReports,
        scheduledDefenses,
        upcomingDefenses
      });

      // On garde uniquement les 10 derniers rapports pour l'affichage
      const recentReports = allReports
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
      setReports(recentReports);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valide un rapport directement depuis le tableau de bord
   */
  const handleValidateReport = async (reportId) => {
    if (!confirm("Voulez-vous valider ce rapport ?")) return;

    try {
      await api.post(`/admin/reports/${reportId}/validate`);
      // On recharge les données pour mettre à jour l'affichage
      fetchDashboardData();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation du rapport');
    }
  };

  /**
   * Helper pour l'affichage des badges de statut
   */
  const getStatusBadge = (status) => {
    const config = {
      'pending': { label: 'En attente', class: 'bg-yellow-900/50 text-yellow-300' },
      'validated': { label: 'Validé', class: 'bg-green-900/50 text-green-300' },
      'need_correction': { label: 'À corriger', class: 'bg-orange-900/50 text-orange-300' },
      'rejected': { label: 'Rejeté', class: 'bg-red-900/50 text-red-300' }
    };

    const info = config[status] || { label: status, class: 'bg-gray-700 text-gray-300' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${info.class}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <AdminSidebar />

      <main className="md:ml-64 pt-4 pb-8 px-4 sm:px-6 lg:px-8">

        {/* En-tête de bienvenue */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg p-6 mb-8 shadow-xl border-b-4 border-indigo-500">
          <h1 className="text-3xl font-bold mb-2">Tableau de Bord Administrateur</h1>
          <p className="text-gray-200 text-lg">Bienvenue, {user?.name || "Administrateur"}</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Chargement des données...</div>
        ) : (
          <>
            {/* -- 1. STATISTIQUES -- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Étudiants Inscrits", value: stats.totalStudents, color: "text-blue-400" },
                { label: "Rapports en Attente", value: stats.pendingReports, color: "text-yellow-400" },
                { label: "Soutenances Prévues", value: stats.scheduledDefenses, color: "text-green-400" },
                { label: "Soutenances (7j)", value: stats.upcomingDefenses, color: "text-purple-400" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-6 text-center shadow-lg border border-gray-700">
                  <p className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-gray-400 mt-2 text-sm uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* -- 2. ACTIONS RAPIDES -- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { to: "/admin/students", title: "Gestion Étudiants", icon: <UsersIcon className="w-6 h-6 text-blue-400" />, desc: "Gérer les inscriptions et encadrants", color: "hover:border-blue-500" },
                { to: "/admin/professors", title: "Gestion Professeurs", icon: <ProfessorBoardIcon className="w-6 h-6 text-green-400" />, desc: "Gérer les comptes et spécialités", color: "hover:border-green-500" },
                { to: "/admin/schedule", title: "Planification", icon: <CalendarIcon className="w-6 h-6 text-purple-400" />, desc: "Organiser les soutenances et jurys", color: "hover:border-purple-500" },
                { to: "/admin/contact-messages", title: "Messages", icon: <span className="text-2xl">✉️</span>, desc: "Lire les messages de contact", color: "hover:border-yellow-500" }
              ].map((link, idx) => (
                <Link key={idx} to={link.to} className={`bg-gray-800 rounded-lg p-6 transition-all border border-gray-700 hover:scale-[1.02] ${link.color} shadow-lg`}>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-white">
                    {link.icon} {link.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">{link.desc}</p>
                  <div className="text-right text-blue-400 text-sm font-semibold">Accéder →</div>
                </Link>
              ))}
            </div>

            {/* -- 3. LISTE DES RAPPORTS RÉCENTS -- */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">Rapports Récents</h2>

              {reports.length === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">Aucun rapport disponible pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-400 uppercase text-xs border-b border-gray-700">
                        <th className="pb-3 pr-4 font-semibold">Étudiant</th>
                        <th className="pb-3 pr-4 font-semibold">Filière</th>
                        <th className="pb-3 pr-4 font-semibold">Version</th>
                        <th className="pb-3 pr-4 font-semibold">Date</th>
                        <th className="pb-3 pr-4 font-semibold">Statut</th>
                        <th className="pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {reports.map((report) => (
                        <tr key={report.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                          <td className="py-3 pr-4 font-medium text-white">{report.student?.user?.name || 'Inconnu'}</td>
                          <td className="py-3 pr-4 text-gray-300">{report.student?.filiere || '-'}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${report.version === 'initial' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'}`}>
                              {report.version === 'initial' ? 'Initial' : 'Corrigé'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-400">
                            {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="py-3 pr-4">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="py-3 flex items-center gap-3">
                            {/* Bouton Voir */}
                            <button
                              className="text-blue-400 hover:text-blue-300 font-medium"
                              onClick={() => {
                                const backendUrl = import.meta.env.VITE_API_BASE_URL
                                  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
                                  : 'http://localhost:8000';
                                window.open(`${backendUrl}/storage/${report.file_path}`, '_blank');
                              }}
                            >
                              Voir
                            </button>

                            {/* Bouton Valider (si applicable) */}
                            {report.status === "validated" && (
                              <button
                                className="text-green-400 hover:text-green-300 font-medium"
                                onClick={() => handleValidateReport(report.id)}
                                title="Valider définitivement"
                              >
                                Confirmer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}