<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\AllocationController;
use App\Http\Controllers\Api\FamilyMemberController;
use App\Http\Controllers\Api\ProjectionController;
use App\Http\Controllers\Api\SettingController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Transactions
    Route::apiResource('transactions', TransactionController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Budgets
    Route::apiResource('budgets', BudgetController::class)->except(['show', 'destroy']);

    // Bills
    Route::apiResource('bills', BillController::class);

    // Goals
    Route::apiResource('goals', GoalController::class);
    Route::post('/goals/{goal}/deposit', [GoalController::class, 'deposit']);
    Route::get('/goals/{goal}/deposits', [GoalController::class, 'deposits']);
    Route::post('/goals/distribute', [GoalController::class, 'distribute']);

    // Allocations
    Route::get('/allocations', [AllocationController::class, 'index']);
    Route::post('/allocations/sync', [AllocationController::class, 'sync']);

    // Family Members
    Route::apiResource('family-members', FamilyMemberController::class);

    // Projections
    Route::get('/projections/cashflow', [ProjectionController::class, 'cashflow']);
    Route::get('/projections/debt-free', [ProjectionController::class, 'debtFreeCalendar']);
    Route::get('/projections/child-timeline', [ProjectionController::class, 'childTimeline']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/settings/export', [SettingController::class, 'export']);
    Route::post('/settings/import', [SettingController::class, 'import']);
});
