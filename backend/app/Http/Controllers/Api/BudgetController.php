<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $budgets = Budget::where('user_id', $user->id)
            ->where('month', $month)
            ->where('year', $year)
            ->with('category')
            ->get();

        return response()->json($budgets);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'monthly_limit' => 'required|numeric|min:0',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
        ]);

        $budget = Budget::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'category_id' => $request->category_id,
                'month' => $request->month,
                'year' => $request->year,
            ],
            ['monthly_limit' => $request->monthly_limit]
        );

        return response()->json($budget->load('category'), 201);
    }

    public function update(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'monthly_limit' => 'required|numeric|min:0',
        ]);

        $budget->update(['monthly_limit' => $request->monthly_limit]);

        return response()->json($budget->load('category'));
    }
}
