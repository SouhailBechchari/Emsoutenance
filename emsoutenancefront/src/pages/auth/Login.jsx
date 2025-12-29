import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/**
 * Page de Sélection du Rôle (Login Gate)
 * 
 * Cette page n'est pas un formulaire de connexion, mais une étape intermédiaire
 * pour choisir quel type d'utilisateur on est (Admin, Étudiant, Professeur).
 */
export default function Login() {
  const navigate = useNavigate();

  // Fonction pour rediriger vers la bonne page de login
  const handleRoleSelection = (role) => {
    if (role === "admin") navigate("/login/admin");
    else if (role === "student") navigate("/login/student");
    else if (role === "professor") navigate("/login/professor");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="card glass p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">
            Connexion à l'Espace Soutenance
          </h1>

          <p className="text-gray-300 mb-8 text-center">
            Veuillez sélectionner votre profil pour continuer.
          </p>

          {/* Grille de boutons pour choisir son rôle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Bouton Administrateur */}
            <RoleButton
              title="Administrateur"
              desc="Gestion globale"
              onClick={() => handleRoleSelection("admin")}
            />

            {/* Bouton Étudiant */}
            <RoleButton
              title="Étudiant"
              desc="Dépôt de rapports"
              onClick={() => handleRoleSelection("student")}
            />

            {/* Bouton Professeur */}
            <RoleButton
              title="Professeur"
              desc="Évaluation"
              onClick={() => handleRoleSelection("professor")}
            />

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Petit composant interne pour éviter de répéter le code du bouton 3 fois
function RoleButton({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn-primary py-6 rounded-lg shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
    >
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold mb-2">{title}</span>
        <span className="text-sm opacity-80">{desc}</span>
      </div>
    </button>
  );
}
