import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

/**
 * Page d'Accueil Étudiant (Dashboard)
 * 
 * Cette page assemble toutes les informations importantes pour l'étudiant :
 * - Son profil
 * - L'état de son rapport
 * - La date de sa soutenance
 * - Les feedbacks (remarques) des profs
 */
export default function StudentHome() {
  const { user } = useAuth(); // On récupère l'utilisateur connecté depuis le contexte
  const [loading, setLoading] = useState(true);

  // On centralise toutes les données de la page dans un seul objet pour faire simple
  const [studentData, setStudentData] = useState({
    name: "",
    id: "",
    filiere: "",
    encadrant: "Non assigné",
    rapporteur: "Non assigné",
    reportStatus: "Non soumis",
    defenseDate: null,
    defenseTime: null,
    defenseRoom: null,
    jury: [],
    feedback: []
  });

  // useEffect est utilisé pour charger les données DÈS QUE la page s'affiche
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // --- Optimisation : Lancement parallèle des requêtes principales ---
        // On lance profile, reports et defense en même temps.
        // Note : pour 'defense', on gère l'erreur (404 si pas de soutenance) directement ici
        // pour ne pas faire échouer tout le Promise.all
        const [profileRes, reportsRes, defenseRes] = await Promise.all([
          api.get('/students/profile'),
          api.get('/students/reports'),
          api.get('/students/defense').catch(e => ({ data: null }))
        ]);

        const student = profileRes.data;
        const reports = reportsRes.data || [];
        const latestReport = reports.length > 0 ? reports[0] : null;
        const defense = defenseRes.data;

        // --- 4. Récupération des remarques ---
        let remarks = [];
        if (latestReport) {
          try {
            const remarksRes = await api.get(`/students/reports/${latestReport.id}/remarks`);
            remarks = remarksRes.data;
          } catch (err) {
            console.error(err);
          }
        }

        // --- 5. Mise en forme des données pour l'affichage ---
        const defenseDateTime = parseDefenseDate(defense?.scheduled_at);

        const newData = {
          name: user?.name || "Étudiant",
          id: student.matricule,
          filiere: student.filiere,
          encadrant: student.encadrant?.user?.name || "Non assigné",
          rapporteur: student.rapporteur?.user?.name || "Non assigné",
          reportStatus: latestReport ? translateStatus(latestReport.status) : "Non soumis",
          defenseDate: defenseDateTime.date,
          defenseTime: defenseDateTime.time,
          defenseRoom: defense?.salle || null,
          jury: defense ? formatJury(defense.jury_members) : [],
          feedback: remarks.map(r => ({
            date: r.created_at,
            from: r.professor?.user?.name || "Professeur",
            content: r.content
          }))
        };

        setStudentData(newData);
      } catch (error) {
        console.error("Erreur lors du chargement des données étudiant:", error);
      } finally {
        setLoading(false); // On arrête le chargement quoi qu'il arrive
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]); // Le tableau [user] signifie : relancer si l'utilisateur change

  // Fonction utilitaire pour traduire les statuts en français
  const translateStatus = (status) => {
    const map = {
      'pending': 'En attente de validation',
      'validated': 'Validé',
      'need_correction': 'Révision demandée',
      'rejected': 'Rejeté'
    };
    return map[status] || status;
  };

  // Fonction utilitaire pour formater la liste des membres du jury
  const formatJury = (juryMembers) => {
    if (!juryMembers) return [];
    return juryMembers.map(m => ({
      name: m.professor?.user?.name,
      role: m.role
    }));
  };

  // Fonction utilitaire pour gérer les dates (parfois complexes en JS)
  const parseDefenseDate = (scheduledAt) => {
    if (!scheduledAt) return { date: null, time: null };

    let dateObj = new Date(scheduledAt);
    if (isNaN(dateObj.getTime()) && typeof scheduledAt === 'string') {
      // Correction pour certains formats de date SQL
      dateObj = new Date(scheduledAt.replace(' ', 'T'));
    }

    if (isNaN(dateObj.getTime())) return { date: "Date invalide", time: "" };

    return {
      date: dateObj.toLocaleDateString('fr-FR'),
      time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Chargement des informations...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* En-tête de bienvenue */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg p-6 mb-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Espace Étudiant</h1>
          <p className="text-gray-300">
            Bienvenue, <span className="font-semibold text-white">{studentData.name}</span> <br />
            ID: {studentData.id} | Filière: {studentData.filiere}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* CARTE 1 : Statut du Rapport */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Statut de votre rapport</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">État actuel:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${studentData.reportStatus === "Validé" ? "bg-green-900 text-green-300" :
                    studentData.reportStatus === "En attente de validation" ? "bg-yellow-900 text-yellow-300" :
                      studentData.reportStatus === "Révision demandée" ? "bg-red-900 text-red-300" :
                        "bg-gray-700 text-gray-300"
                  }`}>
                  {studentData.reportStatus}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Encadrant:</span>
                <span>{studentData.encadrant}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Rapporteur:</span>
                <span>{studentData.rapporteur}</span>
              </div>
            </div>

            <Link to="/student/report" className="btn-primary block text-center py-2 px-4 rounded transition hover:bg-blue-600">
              Gérer mon rapport
            </Link>
          </div>

          {/* CARTE 2 : Informations de Soutenance */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Informations de soutenance</h2>

            {studentData.defenseDate ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Date</p>
                    <p className="font-medium text-lg">{studentData.defenseDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Heure</p>
                    <p className="font-medium text-lg">{studentData.defenseTime}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm">Salle</p>
                    <p className="font-medium">{studentData.defenseRoom}</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <h3 className="font-medium text-gray-300 mb-2 text-sm">Composition du jury :</h3>
                  <ul className="space-y-1">
                    {studentData.jury.map((member, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>{member.name}</span>
                        <span className="text-gray-500 italic">{member.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Votre soutenance n'a pas encore été planifiée.</p>
                <p className="text-sm mt-2">Revenez plus tard.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION COMMENTAIRES */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Historique des feedbacks</h2>

          {studentData.feedback && studentData.feedback.length > 0 ? (
            <div className="space-y-4">
              {studentData.feedback.map((item, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-white">{item.from}</span>
                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-gray-300">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Aucun commentaire ou remarque pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
