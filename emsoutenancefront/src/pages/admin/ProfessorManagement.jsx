import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../services/api";
import { ArrowUpIcon, ArrowDownIcon, SortIcon, SearchIcon, XIcon } from "../../components/icons/ModernIcons";

/**
 * Page de Gestion des Professeurs (CRUD)
 * 
 * Permet aux administrateurs de :
 * - Lister les professeurs (avec pagination, tri, filtres)
 * - Créer un nouveau compte professeur
 * - Modifier/Supprimer un professeur
 */
export default function ProfessorManagement() {
  // --- ÉTATS (STATE) ---
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gestion des modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);

  // Filtres et Tri
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialite, setFilterSpecialite] = useState('');
  const [filterType, setFilterType] = useState('');

  // Formulaire (État par défaut)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Optionnel à l'édition
    specialite: "",
    phone: "",
    type: "", // Optionnel si l'API gère un type par défaut ou multiple
  });

  // --- EFFETS (LIFECYCLE) ---
  useEffect(() => {
    fetchProfessors();
  }, []);

  // --- API CALLS ---

  /** Charge la liste des professeurs */
  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/professors?all=1');
      const professorsData = response.data.data || response.data || [];
      setProfessors(professorsData);
    } catch (error) {
      console.error('Erreur professeurs:', error);
      alert('Erreur lors du chargement des professeurs');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS (ACTIONS) ---

  const handleAddProfessor = async () => {
    try {
      await api.post('/admin/professors', formData);
      closeModals();
      fetchProfessors();
      alert('Professeur créé avec succès !');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleUpdateProfessor = async () => {
    if (!editingProfessor) return;
    try {
      await api.put(`/admin/professors/${editingProfessor.id}`, formData);
      closeModals();
      fetchProfessors();
      alert('Professeur mis à jour avec succès !');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteProfessor = async (professorId) => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce professeur ?')) return;

    try {
      await api.delete(`/admin/professors/${professorId}`);
      fetchProfessors();
      alert('Professeur supprimé.');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression.');
    }
  };

  // --- UTILS ---

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (professor) => {
    setEditingProfessor(professor);
    setFormData({
      name: professor.user?.name || "",
      email: professor.user?.email || "",
      password: "", // On ne remplit pas le mot de passe
      specialite: professor.specialite || "",
      phone: professor.phone || "",
      type: professor.user?.type || "",
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProfessor(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      specialite: "",
      phone: "",
      type: "",
    });
  };

  const handleApiError = (error) => {
    console.error('Erreur API:', error);
    if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat().join('\n');
      alert(`Erreur(s):\n${errors}`);
    } else {
      alert('Une erreur est survenue.');
    }
  };

  // --- FILTRES & TRI (LOGIQUE LOCALE) ---

  const specialites = useMemo(() => {
    const unique = [...new Set(professors.map(p => p.specialite).filter(Boolean))];
    return unique.sort();
  }, [professors]);

  const filteredAndSortedProfessors = useMemo(() => {
    let filtered = [...professors];

    // 1. Filtrage
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.user?.name?.toLowerCase().includes(term) ||
        p.user?.email?.toLowerCase().includes(term) ||
        p.specialite?.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term)
      );
    }
    if (filterSpecialite) filtered = filtered.filter(p => p.specialite === filterSpecialite);
    if (filterType) filtered = filtered.filter(p => p.user?.type === filterType);

    // 2. Tri
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        switch (sortField) {
          case 'name': aValue = a.user?.name; bValue = b.user?.name; break;
          case 'email': aValue = a.user?.email; bValue = b.user?.email; break;
          case 'specialite': aValue = a.specialite; bValue = b.specialite; break;
          case 'phone': aValue = a.phone; bValue = b.phone; break;
          default: aValue = a[sortField]; bValue = b[sortField];
        }

        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();

        return sortDirection === 'asc'
          ? (aValue < bValue ? -1 : 1)
          : (aValue > bValue ? -1 : 1);
      });
    }

    return filtered;
  }, [professors, searchTerm, filterSpecialite, filterType, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children }) => {
    const isActive = sortField === field;
    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? <ArrowUpIcon className="w-3 h-3 text-green-400" /> : <ArrowDownIcon className="w-3 h-3 text-green-400" />
          ) : (
            <SortIcon className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </th>
    );
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a2f3a] to-[#0a0e27] text-white">
      <Navbar />
      <AdminSidebar />

      <main className="md:ml-64 pt-4 pb-8 px-4 sm:px-6 lg:px-8">

        {/* Titre et Bouton Ajout */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold border-l-4 border-green-500 pl-4">Gestion des Professeurs</h1>
          <button
            className="btn-primary px-4 py-2 flex items-center gap-2"
            onClick={openAddModal}
          >
            <span>+</span> Ajouter un professeur
          </button>
        </div>

        {/* Barre de Filtres */}
        <div className="bg-gray-800 rounded-lg p-5 mb-6 shadow-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Recherche */}
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Recherche</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nom, Email, Spécialité..."
                  className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-8 py-2 text-sm focus:border-green-500 focus:outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtre Spécialité */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Spécialité</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                value={filterSpecialite}
                onChange={(e) => setFilterSpecialite(e.target.value)}
              >
                <option value="">Toutes</option>
                {specialites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Filtre Type (Rôle) */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Rôle</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="encadrant">Encadrant</option>
                <option value="rapporteur">Rapporteur</option>
                <option value="examinateur">Examinateur</option>
                <option value="president">Président</option>
              </select>
            </div>

          </div>
        </div>

        {/* Tableau de résultats */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des professeurs...</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <SortableHeader field="name">Nom</SortableHeader>
                    <SortableHeader field="email">Email</SortableHeader>
                    <SortableHeader field="specialite">Spécialité</SortableHeader>
                    <SortableHeader field="phone">Téléphone</SortableHeader>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {filteredAndSortedProfessors.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        Aucun résultat trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedProfessors.map((prof) => (
                      <tr key={prof.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{prof.user?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{prof.user?.email || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {prof.specialite ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-900 text-green-300 border border-green-800">
                              {prof.specialite}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-400">{prof.phone || '-'}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openEditModal(prof)}
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteProfessor(prof.id)}
                            className="text-red-400 hover:text-red-300 font-medium transition-colors"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer du tableau (compteur) */}
            <div className="bg-gray-750 px-6 py-3 border-t border-gray-700 text-xs text-gray-400">
              {filteredAndSortedProfessors.length} professeur(s) affiché(s) sur {professors.length} au total
            </div>
          </div>
        )}

        {/* --- MODALE (AJOUT / MODIFICATION) --- */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">

              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-850 rounded-t-xl">
                <h2 className="text-xl font-bold text-white">
                  {showEditModal ? 'Modifier Professeur' : 'Nouveau Professeur'}
                </h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-white">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Nom Complet *</label>
                  <input
                    type="text" className="input-field-dark"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email *</label>
                  <input
                    type="email" className="input-field-dark"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {!showEditModal && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Mot de passe *</label>
                    <input
                      type="password" className="input-field-dark"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Spécialité</label>
                  <input
                    type="text" className="input-field-dark" placeholder="Ex: IA, Réseaux..."
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Rôle Principal</label>
                  <select
                    className="input-field-dark"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="">Aucun rôle spécifique</option>
                    <option value="encadrant">Encadrant</option>
                    <option value="rapporteur">Rapporteur</option>
                    <option value="examinateur">Examinateur</option>
                    <option value="president">Président</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Téléphone</label>
                  <input
                    type="text" className="input-field-dark"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

              </div>

              <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-850 rounded-b-xl">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={showEditModal ? handleUpdateProfessor : handleAddProfessor}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium shadow-lg shadow-green-900/50 transition-all transform active:scale-95"
                  disabled={!formData.name || !formData.email || (!showEditModal && !formData.password)}
                >
                  {showEditModal ? 'Enregistrer' : 'Créer'}
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      <style>{`
        .input-field-dark {
          width: 100%;
          background-color: #374151;
          border: 1px solid #4b5563;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field-dark:focus {
          border-color: #22c55e; /* green-500 */
        }
      `}</style>
    </div>
  );
}
