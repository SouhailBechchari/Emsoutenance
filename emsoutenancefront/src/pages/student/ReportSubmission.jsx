import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import FileUpload from "../../components/FileUpload"; // Notre composant perso pour "drag & drop" de fichiers
import Navbar from "../../components/Navbar";
import api from "../../services/api"; // Notre helper pour parler au backend (Axios)

/**
 * Page de Dépôt de Rapport (Upload)
 */
export default function ReportSubmission() {
  const { user } = useAuth();

  // États de la page
  const [report, setReport] = useState(null); // Le fichier sélectionné
  const [submitted, setSubmitted] = useState(false); // Est-ce qu'on est en train d'envoyer ?
  const [feedback, setFeedback] = useState(null); // Message de succès ou erreur
  const [loading, setLoading] = useState(true);

  // Infos de l'étudiant et état du rapport actuel
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    id: "",
    filiere: "",
    stage_type: "PFE"
  });
  const [reportStatus, setReportStatus] = useState("not_submitted"); // 'not_submitted', 'pending', 'validated', etc.
  const [remarks, setRemarks] = useState([]); // Les commentaires des profs

  // Chargement des données au démarrage
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Récupérer le profil pour afficher les infos
      const profileRes = await api.get('/students/profile');
      const student = profileRes.data;

      setStudentInfo({
        name: user?.name || "",
        id: student.matricule,
        filiere: student.filiere,
        stage_type: student.stage_type || "PFE"
      });

      // 2. Vérifier si un rapport existe déjà
      const reportsRes = await api.get('/students/reports');
      const reports = reportsRes.data;

      if (reports.length > 0) {
        const latestReport = reports[0];
        setReportStatus(latestReport.status);

        // 3. Si le rapport a des corrections demandées, on charge les remarques
        if (latestReport.status === 'need_correction' || latestReport.status === 'rejected') {
          try {
            const remarksRes = await api.get(`/students/reports/${latestReport.id}/remarks`);
            setRemarks(remarksRes.data);
          } catch (err) {
            console.error(err);
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Callback quand l'utilisateur choisit un fichier dans le composant FileUpload
  const handleFileUpload = (file) => {
    setReport(file); // On garde le fichier en mémoire
  };

  // Envoi du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!report) return; // Sécurité : pas de fichier = pas d'envoi

    try {
      setSubmitted(true); // On active le "spinner" ou l'état de chargement
      setFeedback(null);

      // --- CRÉATION DU FORMDATA ---
      // Pour envoyer un fichier, on doit utiliser FormData, pas du JSON simple !
      const formData = new FormData();
      formData.append('file', report);

      // Envoi au backend
      await api.post('/students/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Très important pour l'upload
        }
      });

      // Succès !
      setFeedback({
        message: "Votre rapport a été soumis avec succès !",
        type: "success"
      });

      // On recharge les données pour voir le statut "En attente" tout de suite
      fetchData();
      setReport(null); // On vide la sélection

    } catch (error) {
      console.error("Erreur envoi rapport:", error);
      setFeedback({
        message: error.response?.data?.message || "Erreur lors de l'envoi du rapport. Vérifiez la taille du fichier.",
        type: "error"
      });
    } finally {
      setSubmitted(false); // Fin du chargement
    }
  };

  // Petite fonction pour afficher joli badge de statut
  const renderReportStatus = () => {
    const statusMap = {
      'not_submitted': { label: 'Non soumis', class: 'bg-gray-500' },
      'pending': { label: 'En attente de validation', class: 'bg-yellow-600' },
      'validated': { label: 'Validé', class: 'bg-green-600' },
      'need_correction': { label: 'Révision nécessaire', class: 'bg-red-600' },
      'rejected': { label: 'Rejeté', class: 'bg-red-800' }
    };

    const statusInfo = statusMap[reportStatus] || statusMap['not_submitted'];

    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) return <div className="text-white text-center mt-20">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dépôt de rapport de stage</h1>

        {/* Bloc d'informations */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Récapitulatif</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Étudiant:</p>
              <p className="font-medium text-lg">{studentInfo.name}</p>
            </div>
            <div>
              <p className="text-gray-400">Matricule:</p>
              <p className="font-medium">{studentInfo.id}</p>
            </div>
            <div>
              <p className="text-gray-400">Filière:</p>
              <p className="font-medium">{studentInfo.filiere}</p>
            </div>
            <div>
              <p className="text-gray-400">État du rendu:</p>
              <div className="mt-1">{renderReportStatus()}</div>
            </div>
          </div>
        </div>

        {/* Bloc de remarques (si corrections demandées) */}
        {(reportStatus === "need_correction" || reportStatus === "rejected") && remarks.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-red-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Corrections demandées
            </h3>
            <ul className="space-y-3">
              {remarks.map((remark, index) => (
                <li key={index} className="bg-red-900/40 p-3 rounded">
                  <span className="font-bold text-red-200 block mb-1">{remark.professor?.user?.name}:</span>
                  <span className="text-gray-200">{remark.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Zone de dépôt */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            {reportStatus === "need_correction" ? "Soumettre une version corrigée" : "Soumettre votre rapport"}
          </h2>

          {reportStatus === "validated" ? (
            <div className="p-8 bg-green-900/20 border border-green-500/50 rounded-lg text-center">
              <div className="inline-block p-3 rounded-full bg-green-900/50 mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <p className="text-green-400 text-xl font-bold">Félicitations ! Votre rapport a été validé.</p>
              <p className="text-gray-400 mt-2">Préparez-vous maintenant pour votre soutenance.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                {/* Composant Drag & Drop */}
                <FileUpload onFileSelect={handleFileUpload} />

                <p className="text-sm text-gray-400 mt-2 text-center">
                  Formats acceptés: PDF, DOCX. <br />
                  Taille maximale: 10 Mo
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`btn-primary px-8 py-3 rounded-lg text-lg font-medium transition-all transform hover:scale-105
                    ${(!report || submitted) ? 'opacity-50 cursor-not-allowed filter grayscale' : 'shadow-lg hover:shadow-blue-500/50'}
                  `}
                  disabled={!report || submitted}
                >
                  {submitted ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Envoi en cours...
                    </span>
                  ) : "Envoyer le rapport"}
                </button>
              </div>
            </form>
          )}

          {/* Feedback Message (Succès ou Erreur) */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-lg border flex items-center ${feedback.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'
              }`}>
              {feedback.type === 'success' ?
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                :
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              }
              <p>{feedback.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}