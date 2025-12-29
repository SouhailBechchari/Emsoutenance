<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Méthode de connexion (Login)
     * 
     * Cette fonction permet à un utilisateur de se connecter.
     * Elle vérifie l'email et le mot de passe, puis génère un jeton d'accès (token).
     */
    public function login(Request $request)
    {
        // 1. Validation des données reçues
        // On vérifie que l'email et le mot de passe sont bien présents
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Recherche de l'utilisateur dans la base de données
        $user = User::where('email', $request->email)->first();

        // 3. Vérification du mot de passe
        // Si l'utilisateur n'existe pas OU si le mot de passe est faux
        if (!$user || !Hash::check($request->password, $user->password)) {
            // On renvoie une erreur 
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        // 4. Création du token de sécurité
        // Ce token servira "d'ID card" pour les futures requêtes
        $token = $user->createToken('auth_token')->plainTextToken;

        // 5. Chargement des rôles (étudiant ou professeur)
        // Cela permet au frontend de savoir qui se connecte
        $user->load(['student', 'professor']);

        // 6. Réponse au client (Format JSON)
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    /**
     * Méthode d'inscription (Register)
     * 
     * Cette fonction permet de créer un nouveau compte Étudiant.
     * Elle utilise une "Transaction" pour éviter de créer un compte à moitié vide en cas d'erreur.
     */
    public function register(Request $request)
    {
        // 1. Validation complète des données
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'matricule' => 'required|string|unique:students',
            'filiere' => 'required|string',
            'stage_type' => 'required|in:PFE,stage_ete',
        ]);

        try {
            // 2. Début de la transaction
            // Tout ce qui se passe ici doit réussir, sinon on annule tout.
            $result = \DB::transaction(function () use ($request) {

                // A. Création de l'utilisateur (Compte principal)
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password), // On crypte toujours le mot de passe
                    'role' => 'student',
                ]);

                // B. Création du profil étudiant associé
                Student::create([
                    'user_id' => $user->id,
                    'matricule' => $request->matricule,
                    'filiere' => $request->filiere,
                    'stage_type' => $request->stage_type,
                ]);

                // C. Connexion automatique après inscription
                $token = $user->createToken('auth_token')->plainTextToken;

                // On charge les infos de l'étudiant pour la réponse
                $user->load('student');

                // On retourne les données pour la réponse JSON
                return [
                    'user' => $user,
                    'token' => $token
                ];
            });

            // 3. Réponse en cas de succès
            return response()->json([
                'access_token' => $result['token'],
                'token_type' => 'Bearer',
                'user' => $result['user'],
            ], 201); // 201 = Créé avec succès

        } catch (\Exception $e) {
            // 4. Gestion des erreurs
            return response()->json([
                'message' => 'Erreur lors de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Méthode de déconnexion (Logout)
     */
    public function logout(Request $request)
    {
        // On supprime le token actuel, ce qui déconnecte l'utilisateur
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    /**
     * Récupérer l'utilisateur connecté
     */
    public function user(Request $request)
    {
        $user = $request->user();
        // On ajoute les profils associés pour être sûr d'avoir toutes les infos
        $user->load(['student', 'professor']);

        return response()->json($user);
    }
}

