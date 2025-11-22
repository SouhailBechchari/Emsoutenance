<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes publiques
Route::post('/login', [App\Http\Controllers\Api\AuthController::class, 'login']);
Route::post('/register', [App\Http\Controllers\Api\AuthController::class, 'register']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    // Routes d'authentification
    Route::post('/logout', [App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('/user', [App\Http\Controllers\Api\AuthController::class, 'user']);
    Route::put('/profile', [App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::post('/change-password', [App\Http\Controllers\Api\AuthController::class, 'changePassword']);

    // Routes étudiants
    Route::prefix('students')->middleware('role:student')->group(function () {
        Route::get('/profile', [App\Http\Controllers\Api\StudentController::class, 'profile']);
        Route::post('/reports', [App\Http\Controllers\Api\StudentController::class, 'uploadReport']);
        Route::get('/reports', [App\Http\Controllers\Api\StudentController::class, 'getReports']);
        Route::get('/reports/{report}/remarks', [App\Http\Controllers\Api\StudentController::class, 'getRemarks']);
        Route::get('/defense', [App\Http\Controllers\Api\StudentController::class, 'getDefense']);
    });

    // Routes professeurs
    Route::prefix('professors')->middleware('role:professor')->group(function () {
        Route::get('/profile', [App\Http\Controllers\Api\ProfessorController::class, 'profile']);
        Route::get('/students', [App\Http\Controllers\Api\ProfessorController::class, 'getStudents']);
        Route::get('/reports', [App\Http\Controllers\Api\ProfessorController::class, 'getReports']);
        Route::post('/reports/{report}/remarks', [App\Http\Controllers\Api\ProfessorController::class, 'addRemark']);
        Route::post('/reports/{report}/validate', [App\Http\Controllers\Api\ProfessorController::class, 'validateReport']);
        Route::get('/defenses', [App\Http\Controllers\Api\ProfessorController::class, 'getDefenses']);
    });

    // Routes administrateur
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Gestion des étudiants
        Route::apiResource('students', App\Http\Controllers\Api\Admin\StudentController::class);
        
        // Gestion des professeurs
        Route::apiResource('professors', App\Http\Controllers\Api\Admin\ProfessorController::class);
        
        // Gestion des rapports
        Route::get('/reports', [App\Http\Controllers\Api\Admin\ReportController::class, 'index']);
        Route::post('/reports/{report}/validate', [App\Http\Controllers\Api\Admin\ReportController::class, 'validateReport']);
        
        // Gestion des soutenances
        Route::apiResource('defenses', App\Http\Controllers\Api\Admin\DefenseController::class);
        Route::post('/defenses/{defense}/jury', [App\Http\Controllers\Api\Admin\DefenseController::class, 'assignJury']);
        
        // Planning
        Route::get('/schedule', [App\Http\Controllers\Api\Admin\ScheduleController::class, 'index']);
        Route::get('/schedule/by-filiere', [App\Http\Controllers\Api\Admin\ScheduleController::class, 'byFiliere']);
        Route::get('/schedule/by-encadrant', [App\Http\Controllers\Api\Admin\ScheduleController::class, 'byEncadrant']);
    });
});

