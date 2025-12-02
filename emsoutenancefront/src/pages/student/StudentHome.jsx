import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

export default function StudentHome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Récupérer le profil étudiant
        const profileRes = await api.get('/students/profile');
        const student = profileRes.data;

        // 2. Récupérer le dernier rapport
        const reportsRes = await api.get('/students/reports');
        const reports = reportsRes.data;
        const latestReport = reports.length > 0 ? reports[0] : null;

        // 3. Récupérer les infos de soutenance
        let defense = null;
        try {
          const defenseRes = await api.get('/students/defense');
          defense = defenseRes.data;
        } catch (err) {
          // Ignorer 404 si pas de soutenance
          if (err.response && err.response.status !== 404) console.error(err);
        }

        // 4. Récupérer les remarques si un rapport existe
        let remarks = [];
        if (latestReport) {
          try {
            const remarksRes = await api.get(`/students/reports/${latestReport.id}/remarks`);
            remarks = remarksRes.data;
          } catch (err) {
            console.error(err);
          }
        }

        // Construire l'objet de données
        // Helper pour parser la date de soutenance
        const parseDefenseDate = (scheduledAt) => {
          if (!scheduledAt) return { date: null, time: null };

          // Essayer de parser la date
          let dateObj = new Date(scheduledAt);

          // Si la date est invalide, essayer de remplacer l'espace par 'T' (format ISO)
          if (isNaN(dateObj.getTime()) && typeof scheduledAt === 'string') {
            const isoFormat = scheduledAt.replace(' ', 'T');
            dateObj = new Date(isoFormat);
          }

          if (isNaN(dateObj.getTime())) {
            console.error("Invalid date format:", scheduledAt);
            return { date: "Date invalide", time: "Heure invalide" };
          }

          return {
            date: dateObj.toLocaleDateString('fr-FR'),
            time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };
        };

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
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const translateStatus = (status) => {
    const map = {
      'pending': 'En attente de validation',
      'validated': 'Validé',
      'need_correction': 'Révision demandée',
      'rejected': 'Rejeté'
    };
    return map[status] || status;
  };

  const formatJury = (juryMembers) => {
    if (!juryMembers) return [];
    return juryMembers.map(m => ({
      name: m.professor?.user?.name,
      role: m.role
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">Espace Étudiant</h1>
          <p className="text-gray-300">Bienvenue, {studentData.name} | ID: {studentData.id} | Filière: {studentData.filiere}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Carte de statut du rapport */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Statut de votre rapport</h2>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">État actuel:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${studentData.reportStatus === "Validé" ? "bg-green-900 text-green-300" :
                  studentData.reportStatus === "En attente de validation" ? "bg-yellow-900 text-yellow-300" :
                    studentData.reportStatus === "Révision demandée" ? "bg-red-900 text-red-300" :
                      "bg-gray-700 text-gray-300"
                  }`}>
                  {studentData.reportStatus}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Encadrant:</span>
                <span>{studentData.encadrant}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Rapporteur:</span>
                <span>{studentData.rapporteur}</span>
              </div>
            </div>
            <Link
              to="/student/report"
              className="btn-primary block text-center py-2 px-4 rounded"
            >
              Gérer mon rapport
            </Link>
          </div>

          {/* Carte d'informations de soutenance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Informations de soutenance</h2>
            {studentData.defenseDate ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Date</p>
                    <p className="font-medium">{studentData.defenseDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Heure</p>
                    <p className="font-medium">{studentData.defenseTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Salle</p>
                    <p className="font-medium">{studentData.defenseRoom}</p>
                  </div>
                </div>
                <h3 className="font-medium text-gray-300 mb-2">Composition du jury</h3>
                <ul className="space-y-1 mb-2">
                  {studentData.jury.map((member, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{member.name}</span>
                      <span className="text-gray-400">{member.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-400">Votre soutenance n'a pas encore été planifiée.</p>
            )}
          </div>
        </div>

        {/* Feedback et commentaires */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Feedback et commentaires</h2>
          {studentData.feedback && studentData.feedback.length > 0 ? (
            <div className="space-y-4">
              {studentData.feedback.map((item, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{item.from}</span>
                    <span className="text-sm text-gray-400">{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p>{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Aucun feedback reçu pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
