<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Contrôleur pour la gestion des Étudiants par l'Administrateur
 *
 * Ce contrôleur gère les opérations CRUD (Create, Read, Update, Delete)
 * pour les étudiants.
 *
 * NOTE IMPORTANTE :
 * Dans notre architecture, un "Étudiant" est composé de deux parties :
 * 1. Un "User" (table users) : Pour l'authentification (email, password, role).
 * 2. Un "Student" (table students) : Pour les infos pédagogiques (matricule, filière, etc.).
 */
class StudentController extends Controller
{
    /**
     * Liste tous les étudiants
     * Récupère aussi les infos de l'utilisateur associé, de l'encadrant et du rapporteur.
     */
    public function index(Request $request)
    {
        // On prépare la requête avec les relations ("Eager Loading" pour la performance)
        $query = Student::with(['user', 'encadrant.user', 'rapporteur.user']);

        // --- FILTRES ---
        if ($request->has('filiere')) {
            $query->where('filiere', $request->filiere);
        }

        if ($request->has('stage_type')) {
            $query->where('stage_type', $request->stage_type);
        }

        // --- MODE LISTE COMPLÈTE (sans pagination) ---
        // Utile pour remplir des listes déroulantes dans le frontend
        if ($request->has('all') && $request->all == '1') {
            return response()->json(['data' => $query->get()]);
        }

        // --- MODE PAGINÉ (par défaut) ---
        // Retourne 15 étudiants par page
        $students = $query->paginate(15);

        return response()->json($students);
    }

    /**
     * Crée un nouvel étudiant
     * DOIT créer d'abord un User, PUIS un Student lié à cet User.
     */
    public function store(Request $request)
    {
        // 1. Validation des données
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users', // Email unique dans toute l'app
            'password' => 'required|string|min:8',
            'matricule' => 'required|string|unique:students', // Matricule unique pour les étudiants
            'filiere' => 'required|string',
            'stage_type' => 'required|in:PFE,stage_ete',
            'encadrant_id' => 'nullable|exists:professors,id',
            'rapporteur_id' => 'nullable|exists:professors,id',
        ]);

        // 2. Création du compte utilisateur (Login/Mot de passe)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Toujours hacher le mot de passe !
            'role' => 'student',
        ]);

        // 3. Création du profil étudiant lié (Infos métier)
        $student = Student::create([
            'user_id' => $user->id, // Lien vers l'utilisateur créé juste avant
            'matricule' => $request->matricule,
            'filiere' => $request->filiere,
            'stage_type' => $request->stage_type,
            'phone' => $request->phone,
            'encadrant_id' => $request->encadrant_id,
            'rapporteur_id' => $request->rapporteur_id,
        ]);

        // 4. On retourne l'étudiant complet avec ses relations
        $student->load(['user', 'encadrant.user', 'rapporteur.user']);

        return response()->json($student, 201);
    }

    /**
     * Affiche les détails d'un étudiant spécifique
     */
    public function show(Student $student)
    {
        // On charge tout ce qui est utile pour l'affichage complet
        $student->load([
            'user',
            'encadrant.user',
            'rapporteur.user',
            'reports', // Historique des rapports
            'defenses.juryMembers.professor.user' // Historique des soutenances
        ]);

        return response()->json($student);
    }

    /**
     * Met à jour un étudiant
     * Peut mettre à jour les infos User (email/pass) ET les infos Student
     */
    public function update(Request $request, Student $student)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            // On ignore l'email actuel de l'utilisateur pour la vérification d'unicité
            'email' => 'sometimes|required|email|unique:users,email,' . $student->user_id,
            'matricule' => 'sometimes|required|unique:students,matricule,' . $student->id,
            'encadrant_id' => 'nullable|exists:professors,id',
            'rapporteur_id' => 'nullable|exists:professors,id',
        ]);

        // 1. Mise à jour de l'Utilisateur (si besoin)
        if ($request->has('name') || $request->has('email')) {
            $student->user->update($request->only(['name', 'email']));
        }

        if ($request->filled('password')) {
            $student->user->update(['password' => Hash::make($request->password)]);
        }

        // 2. Mise à jour du Profil Étudiant
        $student->update($request->only([
            'matricule',
            'filiere',
            'stage_type',
            'phone',
            'encadrant_id',
            'rapporteur_id'
        ]));

        $student->load(['user', 'encadrant.user', 'rapporteur.user']);

        return response()->json($student);
    }

    /**
     * Supprime un étudiant
     */
    public function destroy(Student $student)
    {
        // IMPORTANT : On supprime le User.
        // Grâce à la configuration de la base de données (ON DELETE CASCADE),
        // le profil Student sera automatiquement supprimé aussi.
        $student->user->delete();

        return response()->json(['message' => 'Étudiant et compte utilisateur supprimés']);
    }
}

