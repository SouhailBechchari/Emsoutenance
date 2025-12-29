<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Contrôleur pour la gestion des Professeurs par l'Administrateur
 *
 * Gère le cycle de vie des professeurs (création, modification, supression).
 * Comme pour les étudiants, un professeur est composé d'un User et d'un profil Professor.
 */
class ProfessorController extends Controller
{
    /**
     * Liste tous les professeurs
     */
    public function index(Request $request)
    {
        // On récupère la liste paginée (15 par page) avec les données User associées
        $professors = Professor::with(['user'])->paginate(15);

        return response()->json($professors);
    }

    /**
     * Crée un nouveau professeur
     */
    public function store(Request $request)
    {
        // 1. Validation
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'specialite' => 'nullable|string',
            // Le type peut être : encadrant, rapporteur, examinateur, president (seulement informatif ici)
            'type' => 'nullable|string',
        ]);

        // 2. Création de l'utilisateur
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'professor',
            'type' => $request->type, // Stocké sur User pour certains besoins, mais redondant parfois.
        ]);

        // 3. Création du profil Professeur
        $professor = Professor::create([
            'user_id' => $user->id,
            'specialite' => $request->specialite,
            'phone' => $request->phone,
        ]);

        $professor->load('user');

        return response()->json($professor, 201);
    }

    /**
     * Affiche les détails d'un professeur
     * Y compris ses étudiants et son historique de jurys
     */
    public function show(Professor $professor)
    {
        $professor->load([
            'user',
            'studentsEncadres.user', // Étudiants qu'il encadre
            'studentsRapportes.user', // Étudiants qu'il évalue
            'juryDefenses.defense.student.user' // Soutenances où il est juré
        ]);

        return response()->json($professor);
    }

    /**
     * Met à jour un professeur
     */
    public function update(Request $request, Professor $professor)
    {
        $request->validate([
            'name' => 'sometimes|required|string',
            'email' => 'sometimes|required|email|unique:users,email,' . $professor->user_id,
            'specialite' => 'nullable|string',
        ]);

        // Mise à jour User
        if ($request->has('name') || $request->has('email')) {
            $professor->user->update($request->only(['name', 'email']));
        }

        if ($request->filled('password')) {
            $professor->user->update(['password' => Hash::make($request->password)]);
        }

        if ($request->has('type')) {
            $professor->user->update(['type' => $request->type]);
        }

        // Mise à jour Profil
        $professor->update($request->only(['specialite', 'phone']));

        return response()->json($professor->load('user'));
    }

    /**
     * Supprime un professeur
     */
    public function destroy(Professor $professor)
    {
        // Supprime l'utilisateur, ce qui supprime le profil prof par cascade
        $professor->user->delete();

        return response()->json(['message' => 'Professeur supprimé']);
    }
}

