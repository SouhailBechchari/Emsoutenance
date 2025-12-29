import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../services/api";
import { ArrowUpIcon, ArrowDownIcon, SortIcon, SearchIcon, XIcon } from "../../components/icons/ModernIcons";

/**
 * Page de Gestion des Étudiants (CRUD)
 * 
 * Permet aux administrateurs de :
 * - Lister les étudiants (avec pagination, tri, filtres)
 * - Créer un nouvel étudiant (User + Student)
 * - Modifier/Supprimer un étudiant
 */
export default function StudentManagement() {
  // --- ÉTATS (STATE) ---
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]); // Pour les listes déroulantes (Encadrant/Rapporteur)
  const [loading, setLoading] = useState(true);

  // Gestion des modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Étudiant en cours d'édition
  const [editingStudent, setEditingStudent] = useState(null);

  // Filtres et Tri
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('');
  const [filterStageType, setFilterStageType] = useState('');
  const [filterEncadrant, setFilterEncadrant] = useState('');

  // Formulaire (État par défaut pour un nouvel étudiant)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Student123", // Mot de passe par défaut
    matricule: "",
    filiere: "",
    stage_type: "PFE",
    phone: "",
    encadrant_id: "",
    rapporteur_id: "",
  });

  // --- EFFETS (LIFECYCLE) ---
  useEffect(() => {
    fetchStudents();
    fetchProfessors();
  }, []);

  // --- API CALLS ---

  /** Charge la liste des étudiants depuis l'API */
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/students?all=1'); // 'all=1' si l'API supporte le mode sans pagination
      // Gestion de la réponse paginée ou non paginée
      const studentsData = response.data.data || response.data || [];
      setStudents(studentsData);
    } catch (error) {
      console.error('Erreur étudiants:', error);
      alert('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  /** Charge la liste des professeurs pour les select */
  const fetchProfessors = async () => {
    try {
      const response = await api.get('/admin/professors?all=1');
      const professorsData = response.data.data || response.data || [];
      setProfessors(professorsData);
    } catch (error) {
      console.error('Erreur professeurs:', error);
    }
  };

  // --- HANDLERS (ACTIONS) ---

  const handleAddStudent = async () => {
    try {
      await api.post('/admin/students', formData);
      closeModals();
      fetchStudents();
      alert('Étudiant créé avec succès !');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    try {
      await api.put(`/admin/students/${editingStudent.id}`, formData);
      closeModals();
      fetchStudents();
      alert('Étudiant mis à jour avec succès !');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible.')) {
      return;
    }
    try {
      await api.delete(`/admin/students/${studentId}`);
      fetchStudents();
      alert('Étudiant supprimé.');
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

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      password: "", // On ne remplit pas le mot de passe à l'édition
      matricule: student.matricule || "",
      filiere: student.filiere || "",
      stage_type: student.stage_type || "PFE",
      phone: student.phone || "",
      encadrant_id: student.encadrant_id || "",
      rapporteur_id: student.rapporteur_id || "",
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingStudent(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "Student123",
      matricule: "",
      filiere: "",
      stage_type: "PFE",
      phone: "",
      encadrant_id: "",
      rapporteur_id: "",
    });
  };

  const handleApiError = (error) => {
    console.error('Erreur API:', error);
    if (error.response?.data?.errors) {
      // Affiche les erreurs de validation du backend
      const errors = Object.values(error.response.data.errors).flat().join('\n');
      alert(`Erreur(s):\n${errors}`);
    } else {
      alert('Une erreur est survenue lors de l\'opération.');
    }
  };

  // --- FILTRES & TRI (LOGIQUE LOCALE) ---

  // Liste des filières uniques (calculée dynamiquement)
  const filieres = useMemo(() => {
    const unique = [...new Set(students.map(s => s.filiere).filter(Boolean))];
    return unique.sort();
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = [...students];

    // 1. Filtrage
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.user?.name?.toLowerCase().includes(term) ||
        s.matricule?.toLowerCase().includes(term) ||
        s.user?.email?.toLowerCase().includes(term) ||
        s.filiere?.toLowerCase().includes(term)
      );
    }
    if (filterFiliere) filtered = filtered.filter(s => s.filiere === filterFiliere);
    if (filterStageType) filtered = filtered.filter(s => s.stage_type === filterStageType);
    if (filterEncadrant) filtered = filtered.filter(s => s.encadrant_id === parseInt(filterEncadrant));

    // 2. Tri
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        // Extraction des valeurs selon le champ
        switch (sortField) {
          case 'name': aValue = a.user?.name; bValue = b.user?.name; break;
          case 'matricule': aValue = a.matricule; bValue = b.matricule; break;
          case 'filiere': aValue = a.filiere; bValue = b.filiere; break;
          case 'encadrant': aValue = a.encadrant?.user?.name; bValue = b.encadrant?.user?.name; break;
          default: aValue = a[sortField]; bValue = b[sortField];
        }

        // Sécurisation
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [students, searchTerm, filterFiliere, filterStageType, filterEncadrant, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /** Composant d'entête de tableau triable */
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
            sortDirection === 'asc' ? <ArrowUpIcon className="w-3 h-3 text-blue-400" /> : <ArrowDownIcon className="w-3 h-3 text-blue-400" />
          ) : (
            <SortIcon className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </th>
    );
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white">
      <Navbar />
      <AdminSidebar />

      <main className="md:ml-64 pt-4 pb-8 px-4 sm:px-6 lg:px-8">

        {/* Titre et Bouton Ajout */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold border-l-4 border-blue-500 pl-4">Gestion des Étudiants</h1>
          <button
            className="btn-primary px-4 py-2 flex items-center gap-2"
            onClick={openAddModal}
          >
            <span>+</span> Ajouter un étudiant
          </button>
        </div>

        {/* Barre de Filtres */}
        <div className="bg-gray-800 rounded-lg p-5 mb-6 shadow-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Recherche */}
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Recherche</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nom, Matricule, Email..."
                  className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-8 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
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

            {/* Filtre Filière */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Filière</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={filterFiliere}
                onChange={(e) => setFilterFiliere(e.target.value)}
              >
                <option value="">Toutes</option>
                {filieres.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Filtre Stage */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Type Stage</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={filterStageType}
                onChange={(e) => setFilterStageType(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="PFE">PFE</option>
                <option value="stage_ete">Stage d'été</option>
              </select>
            </div>

            {/* Filtre Encadrant */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Encadrant</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={filterEncadrant}
                onChange={(e) => setFilterEncadrant(e.target.value)}
              >
                <option value="">Tous</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>{p.user?.name || 'Inconnu'}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Tableau de résultats */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des données...</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <SortableHeader field="matricule">Matricule</SortableHeader>
                    <SortableHeader field="name">Nom</SortableHeader>
                    <SortableHeader field="filiere">Filière</SortableHeader>
                    <SortableHeader field="stage_type">Stage</SortableHeader>
                    <SortableHeader field="encadrant">Encadrant</SortableHeader>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {filteredAndSortedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Aucun résultat trouvé avec ces critères.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-blue-300">{student.matricule}</td>
                        <td className="px-6 py-4 font-medium">{student.user?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{student.filiere}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${student.stage_type === 'PFE' ? 'bg-purple-900 text-purple-300' : 'bg-teal-900 text-teal-300'}`}>
                            {student.stage_type === 'PFE' ? 'PFE' : 'Stage Été'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {student.encadrant?.user?.name || <span className="text-gray-600 italic">Non assigné</span>}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openEditModal(student)}
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
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
              {filteredAndSortedStudents.length} étudiant(s) affiché(s) sur {students.length} au total
            </div>
          </div>
        )}

        {/* --- MODALE (AJOUT / MODIFICATION) --- */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Header Modale */}
              <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-850 rounded-t-xl">
                <h2 className="text-xl font-bold text-white">
                  {showEditModal ? 'Modifier Étudiant' : 'Nouvel Étudiant'}
                </h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-white">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Corps Modale */}
              <div className="p-6 space-y-4">

                {/* Identité */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Nom Complet *</label>
                    <input
                      type="text" className="input-field-dark"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Matricule *</label>
                    <input
                      type="text" className="input-field-dark"
                      value={formData.matricule}
                      onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    />
                  </div>
                </div>

                {/* Compte */}
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
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Mot de passe (Défaut: Student123)</label>
                    <input
                      type="text" className="input-field-dark text-gray-500"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                {/* Info Pédagogiques */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Filière *</label>
                    <input
                      type="text" className="input-field-dark" placeholder="ex: Génie Logiciel"
                      value={formData.filiere}
                      onChange={(e) => setFormData({ ...formData, filiere: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Type de Stage</label>
                    <select
                      className="input-field-dark"
                      value={formData.stage_type}
                      onChange={(e) => setFormData({ ...formData, stage_type: e.target.value })}
                    >
                      <option value="PFE">PFE</option>
                      <option value="stage_ete">Stage d'été</option>
                    </select>
                  </div>
                </div>

                {/* Encadrement */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Encadrant</label>
                  <select
                    className="input-field-dark"
                    value={formData.encadrant_id}
                    onChange={(e) => setFormData({ ...formData, encadrant_id: e.target.value })}
                  >
                    <option value="">-- Aucun --</option>
                    {professors.map(p => (
                      <option key={p.id} value={p.id}>{p.user?.name} ({p.specialite})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer Modale */}
              <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-850 rounded-b-xl">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={showEditModal ? handleUpdateStudent : handleAddStudent}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-lg shadow-blue-900/50 transition-all transform active:scale-95"
                  disabled={!formData.name || !formData.email || !formData.matricule}
                >
                  {showEditModal ? 'Enregistrer' : 'Créer l\'étudiant'}
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Style global pour les inputs (optionnel, on peut aussi l'avoir dans index.css) */}
      <style>{`
        .input-field-dark {
          width: 100%;
          background-color: #374151; /* gray-700 */
          border: 1px solid #4b5563; /* gray-600 */
          border-radius: 0.375rem; /* rounded */
          padding: 0.5rem 0.75rem;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field-dark:focus {
          border-color: #3b82f6; /* blue-500 */
        }
      `}</style>
    </div>
  );
}