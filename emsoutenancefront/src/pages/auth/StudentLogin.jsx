import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

/**
 * Page de Connexion pour les Étudiants
 */
const StudentLogin = () => {
  // 1. États du formulaire (Variables qui changent)
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(''); // Pour afficher les erreurs
  const [loading, setLoading] = useState(false); // Pour le bouton "Chargement..."

  // 2. Outils de React Router et Auth
  const { login, logout } = useAuth(); // Notre fonction de connexion personnalisée
  const navigate = useNavigate(); // Pour changer de page

  // 3. Gestion des changements dans les champs de texte
  const handleChange = (e) => {
    // On garde les anciennes valeurs (...credentials) et on change seulement celle qui a été modifiée
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  // 4. Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    setLoading(true);
    setError('');

    try {
      // Appel à l'API de connexion via notre contexte Auth
      const success = await login(credentials.email, credentials.password);

      if (success) {
        // Vérification de sécurité : Est-ce bien un étudiant ?
        const user = JSON.parse(localStorage.getItem('user'));

        if (user && user.role === 'student') {
          navigate('/student'); // Redirection vers l'espace étudiant
        } else {
          setError('Accès étudiant non autorisé. Vous n\'êtes pas étudiant.');
          logout(); // Déconnexion forcée si ce n'est pas le bon rôle
        }
      }
    } catch (err) {
      // Gestion des erreurs (Affichage du message)
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Identifiants invalides. Veuillez réessayer.');
      }
    } finally {
      setLoading(false); // On réactive le bouton
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">
              Connexion Étudiant
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Accédez à votre espace EMSoutenance
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Champ Email */}
              <div>
                <label htmlFor="email" className="sr-only">Email étudiant</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="votre.email@emsi-edu.ma"
                  value={credentials.email}
                  onChange={handleChange}
                />
              </div>

              {/* Champ Mot de passe */}
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Votre mot de passe"
                  value={credentials.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Affichage des erreurs */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Bouton de connexion */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </div>

            {/* Liens utiles */}
            <div className="flex flex-col items-center space-y-2 text-sm">
              <a href="/login" className="text-blue-400 hover:text-blue-300">
                ← Retour au choix du rôle
              </a>
              <p className="text-gray-400">
                Identifiants oubliés ? Contactez l'administration.
              </p>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentLogin;