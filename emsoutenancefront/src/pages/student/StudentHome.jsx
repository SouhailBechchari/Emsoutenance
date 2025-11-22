import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";

export default function StudentHome() {
  const { user } = useAuth();
  
  // Données simulées pour l'étudiant
  const [studentData, setStudentData] = useState({
    name: user?.name || "Étudiant",
    id: "ETU1001",
    filiere: "Informatique",
    encadrant: "Dr. Mohammed Alami",
    rapporteur: "Dr. Fatima Zahra",
    reportStatus: "En attente de validation",
    defenseDate: "2023-07-15",
    defenseTime: "10:30",
    defenseRoom: "Salle A104",
    jury: [
      { name: "Dr. Mohammed Alami", role: "Encadrant" },
      { name: "Dr. Fatima Zahra", role: "Rapporteur" },
      { name: "Dr. Ahmed Bennani", role: "Examinateur" },
      { name: "Prof. Karim Idrissi", role: "Président" }
    ],
    feedback: [
      { 
        date: "2023-06-12", 
        from: "Dr. Fatima Zahra", 
        content: "Veuillez améliorer la partie méthodologie et ajouter plus de références scientifiques récentes."
      }
    ]
  });

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
              <span className={`px-3 py-1 rounded-full text-sm ${
                studentData.reportStatus === "Validé" ? "bg-green-900 text-green-300" :
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
                  <p className="font-medium">{new Date(studentData.defenseDate).toLocaleDateString('fr-FR')}</p>
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
