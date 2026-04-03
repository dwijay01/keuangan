<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Bill;
use App\Models\FamilyMember;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ProjectionController extends Controller
{
    public function cashflow(Request $request)
    {
        $user = $request->user();
        $months = $request->get('months', 12);
        $data = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $income = Transaction::where('user_id', $user->id)
                ->where('type', 'income')
                ->whereBetween('transaction_date', [$start, $end])
                ->sum('amount');

            $expense = Transaction::where('user_id', $user->id)
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [$start, $end])
                ->sum('amount');

            $data[] = [
                'month' => $date->format('M Y'),
                'month_number' => $date->month,
                'year' => $date->year,
                'income' => (float) $income,
                'expense' => (float) $expense,
                'net' => (float) ($income - $expense),
            ];
        }

        return response()->json($data);
    }

    public function debtFreeCalendar(Request $request)
    {
        $user = $request->user();

        $bills = Bill::where('user_id', $user->id)
            ->whereNotNull('total_installments')
            ->with('category')
            ->get()
            ->map(function ($bill) {
                $remaining = max(0, $bill->total_installments - $bill->paid_installments);
                $monthsLeft = $remaining;

                // Estimate debt-free date
                $freeDate = Carbon::now()->addMonths($monthsLeft);

                return [
                    'id' => $bill->id,
                    'name' => $bill->name,
                    'amount' => (float) $bill->amount,
                    'total_installments' => $bill->total_installments,
                    'paid_installments' => $bill->paid_installments,
                    'remaining_installments' => $remaining,
                    'progress_percentage' => $bill->total_installments > 0
                        ? round(($bill->paid_installments / $bill->total_installments) * 100, 1)
                        : 0,
                    'estimated_free_date' => $freeDate->toDateString(),
                    'months_left' => $monthsLeft,
                    'category' => $bill->category,
                ];
            });

        return response()->json($bills);
    }

    public function childTimeline(Request $request)
    {
        $user = $request->user();

        $members = FamilyMember::where('user_id', $user->id)
            ->with('milestones')
            ->get()
            ->map(function ($member) {
                $milestones = $member->milestones->map(function ($milestone) use ($member) {
                    $targetDate = $member->birth_date->copy()->addMonths($milestone->age_months);
                    $isPast = $targetDate->isPast();

                    return [
                        'id' => $milestone->id,
                        'name' => $milestone->name,
                        'age_months' => $milestone->age_months,
                        'age_display' => floor($milestone->age_months / 12) . ' tahun ' . ($milestone->age_months % 12) . ' bulan',
                        'target_date' => $targetDate->toDateString(),
                        'is_past' => $isPast,
                        'is_completed' => $milestone->is_completed,
                        'months_until' => $isPast ? 0 : (int) now()->diffInMonths($targetDate),
                    ];
                });

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'birth_date' => $member->birth_date->toDateString(),
                    'relation' => $member->relation,
                    'age_in_months' => $member->age_in_months,
                    'age_display' => $member->age_display,
                    'milestones' => $milestones,
                ];
            });

        return response()->json($members);
    }
}
