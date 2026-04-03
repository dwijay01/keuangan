<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use App\Models\GoalDeposit;
use App\Models\AllocationRule;
use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Goal::where('user_id', $request->user()->id)
                ->with('allocationRule')
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:education,asset,working_capital,custom',
            'target_amount' => 'required|numeric|min:0',
            'deadline' => 'nullable|date',
            'color' => 'string|max:7',
        ]);

        $goal = Goal::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'type' => $request->type,
            'target_amount' => $request->target_amount,
            'current_amount' => 0,
            'deadline' => $request->deadline,
            'color' => $request->color ?? '#00D4FF',
        ]);

        return response()->json($goal, 201);
    }

    public function update(Request $request, Goal $goal)
    {
        if ($goal->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'string|max:255',
            'type' => 'in:education,asset,working_capital,custom',
            'target_amount' => 'numeric|min:0',
            'deadline' => 'nullable|date',
            'color' => 'string|max:7',
        ]);

        $goal->update($request->only(['name', 'type', 'target_amount', 'deadline', 'color']));

        return response()->json($goal);
    }

    public function destroy(Request $request, Goal $goal)
    {
        if ($goal->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $goal->delete();

        return response()->json(['message' => 'Target berhasil dihapus.']);
    }

    public function deposit(Request $request, Goal $goal)
    {
        if ($goal->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:1',
            'note' => 'nullable|string|max:500',
        ]);

        $category = Category::firstOrCreate([
            'user_id' => $request->user()->id,
            'name' => 'Tabungan & Investasi'
        ], [
            'type' => 'expense',
            'icon' => 'piggy-bank',
            'color' => '#8A2BE2'
        ]);

        DB::transaction(function () use ($request, $goal, $category) {
            GoalDeposit::create([
                'goal_id' => $goal->id,
                'amount' => $request->amount,
                'deposit_date' => now()->toDateString(),
                'note' => $request->note,
            ]);

            $goal->increment('current_amount', $request->amount);

            Transaction::create([
                'user_id' => $request->user()->id,
                'category_id' => $category->id,
                'amount' => $request->amount,
                'type' => 'expense',
                'transaction_date' => now()->toDateString(),
                'note' => 'Setor ke target: ' . $goal->name . ($request->note ? ' (' . $request->note . ')' : ''),
            ]);
        });

        return response()->json($goal->fresh());
    }

    public function deposits(Request $request, Goal $goal)
    {
        if ($goal->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $goal->deposits()->orderBy('deposit_date', 'desc')->get()
        );
    }

    public function distribute(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'note' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $rules = AllocationRule::where('user_id', $user->id)->with('goal')->get();

        if ($rules->isEmpty()) {
            return response()->json(['message' => 'Belum ada aturan alokasi.'], 422);
        }

        $totalPercentage = $rules->sum('percentage');
        $distributions = [];

        $categoryExpense = Category::firstOrCreate([
            'user_id' => $user->id,
            'name' => 'Tabungan & Investasi'
        ], [
            'type' => 'expense',
            'icon' => 'piggy-bank',
            'color' => '#8A2BE2'
        ]);

        $categoryIncome = Category::firstOrCreate([
            'user_id' => $user->id,
            'name' => 'Pendapatan Sampingan'
        ], [
            'type' => 'income',
            'icon' => 'briefcase',
            'color' => '#00FF66'
        ]);

        DB::transaction(function () use ($request, $rules, $totalPercentage, &$distributions, $user, $categoryExpense, $categoryIncome) {
            
            // Catat pemasukan dulu
            Transaction::create([
                'user_id' => $user->id,
                'category_id' => $categoryIncome->id,
                'amount' => $request->amount,
                'type' => 'income',
                'transaction_date' => now()->toDateString(),
                'note' => $request->note ? 'Distribusi Penghasilan: ' . $request->note : 'Distribusi Penghasilan Sampingan',
            ]);

            foreach ($rules as $rule) {
                $depositAmount = round(($rule->percentage / 100) * $request->amount, 2);

                if ($depositAmount > 0) {
                    GoalDeposit::create([
                        'goal_id' => $rule->goal_id,
                        'amount' => $depositAmount,
                        'deposit_date' => now()->toDateString(),
                        'note' => 'Distribusi otomatis',
                    ]);

                    $rule->goal->increment('current_amount', $depositAmount);

                    Transaction::create([
                        'user_id' => $user->id,
                        'category_id' => $categoryExpense->id,
                        'amount' => $depositAmount,
                        'type' => 'expense',
                        'transaction_date' => now()->toDateString(),
                        'note' => 'Distribusi ke target: ' . $rule->goal->name,
                    ]);

                    $distributions[] = [
                        'goal' => $rule->goal->name,
                        'percentage' => $rule->percentage,
                        'amount' => $depositAmount,
                    ];
                }
            }
        });

        $unallocated = $totalPercentage < 100
            ? round(((100 - $totalPercentage) / 100) * $request->amount, 2)
            : 0;

        return response()->json([
            'total_distributed' => $request->amount - $unallocated,
            'unallocated' => $unallocated,
            'distributions' => $distributions,
        ]);
    }
}
