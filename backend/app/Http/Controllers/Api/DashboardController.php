<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Budget;
use App\Models\Bill;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // Monthly income & expense
        $monthlyIncome = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthlyExpense = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // Today's discretionary expense (exclude savings, education, and fixed bills)
        $excludedNames = ['Tabungan & Investasi', 'Pendidikan', 'Tagihan', 'Listrik', 'Air', 'Cicilan', 'Asuransi', 'Kesehatan'];
        $excludedCategoryIds = $user->categories()
            ->whereIn('name', $excludedNames)
            ->pluck('id')
            ->toArray();

        // Also automatically exclude any categories that are registered as recurring Bills
        $billCategoryIds = Bill::where('user_id', $user->id)
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->toArray();

        $allExcludedIds = array_unique(array_merge($excludedCategoryIds, $billCategoryIds));

        $todayExpense = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->where('transaction_date', $now->toDateString())
            ->when(!empty($allExcludedIds), function ($q) use ($allExcludedIds) {
                $q->whereNotIn('category_id', $allExcludedIds);
            })
            ->sum('amount');

        $dailyBudget = (float) Setting::getValue($user->id, 'daily_budget', 50000);
        $dailyRemaining = $dailyBudget - $todayExpense;

        // Side income (non-salary income this month)
        $salaryCategory = $user->categories()->where('name', 'Gaji')->first();
        $sideIncome = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->when($salaryCategory, function ($q) use ($salaryCategory) {
                $q->where('category_id', '!=', $salaryCategory->id);
            })
            ->sum('amount');

        // Budget progress (top 5 categories with budgets)
        $budgets = Budget::where('user_id', $user->id)
            ->where('month', $now->month)
            ->where('year', $now->year)
            ->with('category')
            ->get()
            ->map(function ($budget) use ($user, $startOfMonth, $endOfMonth) {
                $spent = Transaction::where('user_id', $user->id)
                    ->where('type', 'expense')
                    ->where('category_id', $budget->category_id)
                    ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                    ->sum('amount');

                return [
                    'id' => $budget->id,
                    'category' => $budget->category,
                    'limit' => (float) $budget->monthly_limit,
                    'spent' => (float) $spent,
                    'percentage' => $budget->monthly_limit > 0
                        ? min(100, round(($spent / $budget->monthly_limit) * 100, 1))
                        : 0,
                ];
            });

        // Upcoming bills (next 7 days)
        $today = $now->day;
        $upcomingBills = Bill::where('user_id', $user->id)
            ->where(function ($q) use ($today) {
                $q->whereBetween('due_day', [$today, $today + 7])
                  ->orWhere(function ($q2) use ($today) {
                      if ($today + 7 > 28) {
                          $q2->whereBetween('due_day', [1, ($today + 7) % 28]);
                      }
                  });
            })
            ->with('category')
            ->get()
            ->map(function ($bill) use ($now) {
                $dueDate = $now->copy()->day($bill->due_day);
                if ($dueDate->lt($now)) {
                    $dueDate->addMonth();
                }
                $bill->days_until = $now->diffInDays($dueDate, false);
                return $bill;
            });

        // Last 7 days expense sparkline
        $sparkline = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $amount = Transaction::where('user_id', $user->id)
                ->where('type', 'expense')
                ->where('transaction_date', $date->toDateString())
                ->sum('amount');
            $sparkline[] = [
                'date' => $date->toDateString(),
                'amount' => (float) $amount,
            ];
        }

        return response()->json([
            'daily_budget' => $dailyBudget,
            'daily_remaining' => $dailyRemaining,
            'today_expense' => (float) $todayExpense,
            'monthly_income' => (float) $monthlyIncome,
            'monthly_expense' => (float) $monthlyExpense,
            'monthly_net' => (float) ($monthlyIncome - $monthlyExpense),
            'side_income' => (float) $sideIncome,
            'budget_progress' => $budgets,
            'upcoming_bills' => $upcomingBills,
            'sparkline' => $sparkline,
        ]);
    }
}
