<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Remark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    /**
     * Voir son propre profil étudiant
     */
    public function profile(Request $request)
    {
        // 1. Récupérer l'étudiant connecté
        // $request->user() renvoie l'utilisateur (la connexion)
        // ->student renvoie le profil étudiant associé
        $student = $request->user()->student;

        // 2. Charger les infos des profs (Encadrant et Rapporteur)
        // On veut aussi les noms des profs (liés à leur compte user)
        $student->load(['encadrant.user', 'rapporteur.user']);

        // 3. Renvoyer les données
        return response()->json($student);
    }

    /**
     * Déposer un fichier (rapport de stage)
     */
    public function uploadReport(Request $request)
    {
        // 1. Validation du fichier
        // On accepte PDF ou Word, max 10 Mo
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $student = $request->user()->student;

        // Petite sécurité : si l'utilisateur n'est pas un étudiant (ne devrait pas arriver)
        if (!$student) {
            return response()->json(['message' => 'Profil étudiant non trouvé'], 404);
        }

        // 2. Calcul de la version du rapport
        // Si l'étudiant a DÉJÀ un rapport "initial", alors c'est la version "corrigée"
        // Sinon, c'est la version "initiale"
        $hasInitialReport = $student->reports()->where('version', 'initial')->exists();
        $version = $hasInitialReport ? 'corrige' : 'initial';

        // 3. Sauvegarde physique du fichier
        // On récupère le fichier envoyé
        $file = $request->file('file');

        // On crée un nom unique (avec l'heure actuelle) pour éviter d'écraser des fichiers
        $filename = time() . '_' . $file->getClientOriginalName();

        // On enregistre le fichier dans le dossier 'reports' du disque 'public'
        $path = $file->storeAs('reports', $filename, 'public');

        // 4. Enregistrement dans la base de données
        $report = Report::create([
            'student_id' => $student->id,
            'file_path' => $path, // Le chemin pour retrouver le fichier
            'original_filename' => $file->getClientOriginalName(), // Le vrai nom pour l'affichage
            'version' => $version,
            'status' => 'pending', // En attente de validation
            'submitted_at' => now(), // Date de dépôt
        ]);

        return response()->json($report, 201);
    }

    /**
     * Voir la liste de mes rapports déposés
     */
    public function getReports(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Profil étudiant non trouvé'], 404);
        }

        // On récupère les rapports, du plus récent au plus ancien
        $reports = $student->reports()->orderBy('created_at', 'desc')->get();

        return response()->json($reports);
    }

    /**
     * Voir les remarques (commentaires) sur un rapport
     */
    public function getRemarks(Request $request, Report $report)
    {
        // 1. Sécurité : Vérifier que c'est bien MON rapport
        // Je ne peux pas voir les remarques des autres étudiants
        if ($report->student_id !== $request->user()->student->id) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // 2. Récupérer les remarques
        // On charge aussi le prof qui a fait la remarque
        $remarks = $report->remarks()->with('professor.user')->get();

        return response()->json($remarks);
    }

    /**
     * Voir les infos de ma soutenance
     */
    public function getDefense(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Profil étudiant non trouvé'], 404);
        }

        // Mise à jour automatique : Si une soutenance est passée (date dépassée), on la marque comme "terminée"
        \App\Models\Defense::where('status', 'scheduled')
            ->where('scheduled_at', '<', now())
            ->update(['status' => 'completed']);

        // Récupérer la dernière soutenance prévue pour cet étudiant
        $defense = $student->defenses()->with([
            'juryMembers.professor.user', // Les membres du jury et leurs noms
            'report' // Le rapport associé
        ])->latest()->first();

        return response()->json($defense);
    }
}

