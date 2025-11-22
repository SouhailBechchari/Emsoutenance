import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import FileUpload from "../../components/FileUpload";
import Navbar from "../../components/Navbar";

export default function ReportSubmission() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  // État fictif pour la démonstration
  const [reportStatus, setReportStatus] = useState("not_submitted"); // not_submitted, pending, revision_needed, approved

  const handleFileUpload = (file) => {
    setReport(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!report) return;
    
    // Simuler l'envoi du rapport
    setReportStatus("pending");
    setSubmitted(true);
    
    // Simuler une réponse après 2 secondes
    setTimeout(() => {
      setFeedback({
        message: "Votre rapport a été soumis avec succès et est en attente de validation.",
        date: new Date().toLocaleDateString()
      });
    }, 2000);
  };

  const renderReportStatus = () => {
    switch (reportStatus) {
      case "not_submitted":
        return <span className="badge bg-gray-500">Non soumis</span>;
      case "pending":
        return <span className="badge bg-yellow-500">En attente de validation</span>;
      case "revision_needed":
        return <span className="badge bg-red-500">Révision nécessaire</span>;
      case "approved":
        return <span className="badge bg-green-500">Approuvé</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dépôt de rapport de stage</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Informations sur le stage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Étudiant:</p>
            <p>{user?.name}</p>
          </div>
          <div>
            <p className="text-gray-400">ID:</p>
            <p>{user?.studentId}</p>
          </div>
          <div>
            <p className="text-gray-400">Type de stage:</p>
            <p>PFE</p>
          </div>
          <div>
            <p className="text-gray-400">Statut du rapport:</p>
            <p>{renderReportStatus()}</p>
          </div>
        </div>
      </div>

      {reportStatus === "revision_needed" && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-red-400 mb-2">Remarques du rapporteur</h3>
          <p>Veuillez corriger les points suivants dans votre rapport:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Améliorer l'introduction pour mieux présenter le contexte</li>
            <li>Ajouter plus de détails sur la méthodologie utilisée</li>
            <li>Corriger les fautes d'orthographe dans la section 3</li>
          </ul>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {reportStatus === "revision_needed" ? "Soumettre une version corrigée" : "Soumettre votre rapport"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <FileUpload onFileSelect={handleFileUpload} />
            <p className="text-sm text-gray-400 mt-2">
              Formats acceptés: PDF, DOCX. Taille maximale: 10MB
            </p>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary px-6 py-2"
            disabled={!report || submitted}
          >
            {submitted ? "Envoi en cours..." : "Soumettre le rapport"}
          </button>
        </form>

        {feedback && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-400">{feedback.message}</p>
            <p className="text-sm text-gray-400 mt-2">Date: {feedback.date}</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}