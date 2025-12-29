import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

/**
 * Page d'Accueil Professeur (Dashboard)
 * 
 * Ce tableau de bord permet au professeur d'avoir une vue d'ensemble rapide :
 * - Ses statistiques (nombre d'étudiants, rapports à corriger, etc.)
 * - Ses prochaines soutenances (jury)
 * - Des raccourcis vers les pages de gestion
 */
export default function ProfessorHome() {
  const { user } = useAuth(); // Identité du professeur
  const [loading, setLoading] = useState(true);

  // Statistiques affichées en haut de page
  const [stats, setStats] = useState({
    encadrant: 0,
    rapporteur: 0,
    jury: 0,
    upcomingDefenses: 0
  });

  // Liste des prochaines soutenances
  const [upcomingDefenses, setUpcomingDefenses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fonction centrale pour charger toutes les données du dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // --- Optimisation : Lancement des requêtes en parallèle ---
      // Promise.all permet de lancer toutes les requêtes en même temps
      // au lieu d'attendre que la première finisse pour lancer la seconde.
      // Cela réduit le temps de chargement total de la page.
      const [studentsResponse, reportsResponse, defensesResponse] = await Promise.all([
        api.get('/professors/students'),
        api.get('/professors/reports'),
        api.get('/professors/defenses')
      ]);

      // --- 1. Traitement des étudiants ---
      const students = studentsResponse.data || [];
      const encadrantCount = students.filter(s => s.relation_type === 'encadrant').length;
      const rapporteurCount = students.filter(s => s.relation_type === 'rapporteur').length;

      // --- 2. Traitement des rapports ---
      const reports = reportsResponse.data || [];
      const pendingReports = reports.filter(r =>
        r.status === 'pending' || r.status === 'validated'
      ).length;

      // --- 3. Traitement des soutenances ---
      const defenses = defensesResponse.data || [];

      // On filtre pour ne garder que celles des 7 prochains jours
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Date actuelle + 7 jours

      const upcoming = defenses.filter(d => {
        const defenseDate = new Date(d.scheduled_at);
        return defenseDate >= now && defenseDate <= nextWeek;
      });

      // Mise à jour de l'état des statistiques
      setStats({
        encadrant: encadrantCount,
        rapporteur: pendingReports,
        jury: defenses.length, // Total des jurys auxquels on participe
        upcomingDefenses: upcoming.length
      });

      // On garde juste les 5 premières soutenances à venir pour l'affichage
      setUpcomingDefenses(upcoming.slice(0, 5));

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper pour afficher un joli badge selon le rôle du prof dans le jury
   * (Encadrant, Rapporteur, Président, Examinateur)
   */
  const getRoleBadge = (defense) => {
    const juryMembers = defense.jury_members || [];
    const currentUserEmail = user?.email; // Email du prof connecté pour le trouver dans la liste

    // On cherche quel est notre rôle dans cette soutenance
    const juryMember = juryMembers.find(jm => jm.professor?.user?.email === currentUserEmail);
    if (!juryMember) return null;

    const role = juryMember.role;

    // Mapping des couleurs pour l'UI
    const styles = {
      encadrant: 'bg-blue-900/50 text-blue-300 border-blue-700',
      rapporteur: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
      examinateur: 'bg-green-900/50 text-green-300 border-green-700',
      president: 'bg-red-900/50 text-red-300 border-red-700'
    };

    const labels = {
      encadrant: 'Encadrant',
      rapporteur: 'Rapporteur',
      examinateur: 'Examinateur',
      president: 'Président du Jury'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[role] || 'bg-gray-800 text-gray-400 border-gray-600'}`}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* En-tête de bienvenue */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg p-6 mb-8 border-b-4 border-indigo-500 shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Espace Professeur</h1>
          <p className="text-gray-200 text-lg">
            Bienvenue, Pr. <span className="font-semibold">{user?.name}</span>
          </p>
        </div>

        {loading ? (
          <div className="text-white text-center mt-20">Chargement des données...</div>
        ) : (
          <>
            {/* 1. Bloc Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Carte Encadrement */}
              <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg border border-gray-700">
                <p className="text-4xl font-black text-blue-400">{stats.encadrant}</p>
                <p className="text-gray-400 mt-2 uppercase text-sm tracking-wider">Étudiants Encadrés</p>
              </div>

              {/* Carte Rapports */}
              <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg border border-gray-700">
                <p className="text-4xl font-black text-yellow-400">{stats.rapporteur}</p>
                <p className="text-gray-400 mt-2 uppercase text-sm tracking-wider">Rapports à Évaluer</p>
              </div>

              {/* Carte Jurys Total */}
              <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg border border-gray-700">
                <p className="text-4xl font-black text-green-400">{stats.jury}</p>
                <p className="text-gray-400 mt-2 uppercase text-sm tracking-wider">Total Jurys</p>
              </div>

              {/* Carte Soutenances Semaine */}
              <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg border border-gray-700">
                <p className="text-4xl font-black text-purple-400">{stats.upcomingDefenses}</p>
                <p className="text-gray-400 mt-2 uppercase text-sm tracking-wider">Soutenances (7j)</p>
              </div>
            </div>

            {/* 2. Tableau des prochaines soutenances */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="bg-purple-500 w-2 h-8 mr-3 rounded-full"></span>
                Vos prochaines soutenances
              </h2>

              {upcomingDefenses.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                  <p className="text-gray-400 italic">Aucune soutenance prévue dans les 7 prochains jours.</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Étudiant</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Heure</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Salle</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Votre Rôle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {upcomingDefenses.map((defense) => {
                        const scheduledDate = new Date(defense.scheduled_at);
                        return (
                          <tr key={defense.id} className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                              {defense.student?.user?.name || 'Inconnu'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              {scheduledDate.toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{defense.salle || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getRoleBadge(defense)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Actions Rapides (Gros boutons de navigation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/professor/reports" className="group bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/20 text-center">
                <div className="w-16 h-16 bg-blue-900/50 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-blue-600 transition-colors">
                  <svg className="w-8 h-8 text-blue-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gestion des Rapports</h3>
                <p className="text-gray-400 text-sm">Consulter les rapports déposés, les valider (rapporteur) ou ajouter des remarques.</p>
              </Link>

              <Link to="/professor/defenses" className="group bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-green-500 transition-all shadow-lg hover:shadow-green-500/20 text-center">
                <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-green-600 transition-colors">
                  <svg className="w-8 h-8 text-green-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Planning des Soutenances</h3>
                <p className="text-gray-400 text-sm">Voir le calendrier complet des soutenances où vous êtes membre du jury.</p>
              </Link>
            </div>

          </>
        )}
      </div>
    </div>
  );
}