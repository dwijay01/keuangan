<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\Category;
use App\Models\Budget;
use App\Models\Bill;
use App\Models\Goal;
use App\Models\GoalDeposit;
use App\Models\AllocationRule;
use App\Models\FamilyMember;
use App\Models\FamilyMilestone;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $settings = Setting::where('user_id', $request->user()->id)
            ->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        $user = $request->user();

        foreach ($request->settings as $key => $value) {
            Setting::setValue($user->id, $key, $value);
        }

        return response()->json(
            Setting::where('user_id', $user->id)->pluck('value', 'key')
        );
    }

    public function export(Request $request)
    {
        $user = $request->user();

        $data = [
            'exported_at' => now()->toIso8601String(),
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'categories' => Category::where('user_id', $user->id)->get(),
            'transactions' => Transaction::where('user_id', $user->id)->with('splits')->get(),
            'budgets' => Budget::where('user_id', $user->id)->get(),
            'bills' => Bill::where('user_id', $user->id)->get(),
            'goals' => Goal::where('user_id', $user->id)->with('deposits')->get(),
            'allocation_rules' => AllocationRule::where('user_id', $user->id)->get(),
            'family_members' => FamilyMember::where('user_id', $user->id)->with('milestones')->get(),
            'settings' => Setting::where('user_id', $user->id)->pluck('value', 'key'),
        ];

        return response()->json($data);
    }

    public function import(Request $request)
    {
        $request->validate([
            'data' => 'required|array',
        ]);

        $user = $request->user();
        $data = $request->data;

        \DB::transaction(function () use ($user, $data) {
            // Clear existing data
            Transaction::where('user_id', $user->id)->delete();
            Category::where('user_id', $user->id)->delete();
            Budget::where('user_id', $user->id)->delete();
            Bill::where('user_id', $user->id)->delete();
            Goal::where('user_id', $user->id)->delete();
            AllocationRule::where('user_id', $user->id)->delete();
            FamilyMember::where('user_id', $user->id)->delete();
            Setting::where('user_id', $user->id)->delete();

            // Import categories (need ID mapping for transactions)
            $categoryMap = [];
            if (isset($data['categories'])) {
                foreach ($data['categories'] as $cat) {
                    $newCat = Category::create([
                        'user_id' => $user->id,
                        'name' => $cat['name'],
                        'icon' => $cat['icon'] ?? 'circle',
                        'type' => $cat['type'],
                        'color' => $cat['color'] ?? '#A0A0A0',
                        'sort_order' => $cat['sort_order'] ?? 0,
                    ]);
                    $categoryMap[$cat['id']] = $newCat->id;
                }
            }

            // Import transactions
            if (isset($data['transactions'])) {
                foreach ($data['transactions'] as $tx) {
                    $newTx = Transaction::create([
                        'user_id' => $user->id,
                        'transaction_date' => $tx['transaction_date'],
                        'amount' => $tx['amount'],
                        'type' => $tx['type'],
                        'category_id' => isset($tx['category_id']) ? ($categoryMap[$tx['category_id']] ?? null) : null,
                        'note' => $tx['note'] ?? null,
                        'is_split' => $tx['is_split'] ?? false,
                    ]);

                    if (!empty($tx['splits'])) {
                        foreach ($tx['splits'] as $split) {
                            $newTx->splits()->create([
                                'category_id' => isset($split['category_id']) ? ($categoryMap[$split['category_id']] ?? null) : null,
                                'amount' => $split['amount'],
                                'note' => $split['note'] ?? null,
                            ]);
                        }
                    }
                }
            }

            // Import budgets
            if (isset($data['budgets'])) {
                foreach ($data['budgets'] as $budget) {
                    Budget::create([
                        'user_id' => $user->id,
                        'category_id' => $categoryMap[$budget['category_id']] ?? null,
                        'monthly_limit' => $budget['monthly_limit'],
                        'month' => $budget['month'],
                        'year' => $budget['year'],
                    ]);
                }
            }

            // Import bills
            if (isset($data['bills'])) {
                foreach ($data['bills'] as $bill) {
                    Bill::create(array_merge(
                        collect($bill)->only([
                            'name', 'amount', 'due_day', 'is_recurring',
                            'start_date', 'end_date', 'total_installments', 'paid_installments'
                        ])->toArray(),
                        [
                            'user_id' => $user->id,
                            'category_id' => isset($bill['category_id']) ? ($categoryMap[$bill['category_id']] ?? null) : null,
                        ]
                    ));
                }
            }

            // Import goals
            $goalMap = [];
            if (isset($data['goals'])) {
                foreach ($data['goals'] as $goal) {
                    $newGoal = Goal::create([
                        'user_id' => $user->id,
                        'name' => $goal['name'],
                        'type' => $goal['type'],
                        'target_amount' => $goal['target_amount'],
                        'current_amount' => $goal['current_amount'] ?? 0,
                        'deadline' => $goal['deadline'] ?? null,
                        'color' => $goal['color'] ?? '#00D4FF',
                    ]);
                    $goalMap[$goal['id']] = $newGoal->id;

                    if (!empty($goal['deposits'])) {
                        foreach ($goal['deposits'] as $dep) {
                            GoalDeposit::create([
                                'goal_id' => $newGoal->id,
                                'amount' => $dep['amount'],
                                'deposit_date' => $dep['deposit_date'],
                                'note' => $dep['note'] ?? null,
                            ]);
                        }
                    }
                }
            }

            // Import allocation rules
            if (isset($data['allocation_rules'])) {
                foreach ($data['allocation_rules'] as $rule) {
                    if (isset($goalMap[$rule['goal_id']])) {
                        AllocationRule::create([
                            'user_id' => $user->id,
                            'goal_id' => $goalMap[$rule['goal_id']],
                            'percentage' => $rule['percentage'],
                        ]);
                    }
                }
            }

            // Import family members
            if (isset($data['family_members'])) {
                foreach ($data['family_members'] as $member) {
                    $newMember = FamilyMember::create([
                        'user_id' => $user->id,
                        'name' => $member['name'],
                        'birth_date' => $member['birth_date'],
                        'relation' => $member['relation'],
                    ]);

                    if (!empty($member['milestones'])) {
                        foreach ($member['milestones'] as $ms) {
                            FamilyMilestone::create([
                                'family_member_id' => $newMember->id,
                                'name' => $ms['name'],
                                'age_months' => $ms['age_months'],
                                'is_completed' => $ms['is_completed'] ?? false,
                            ]);
                        }
                    }
                }
            }

            // Import settings
            if (isset($data['settings'])) {
                foreach ($data['settings'] as $key => $value) {
                    Setting::setValue($user->id, $key, $value);
                }
            }
        });

        return response()->json(['message' => 'Data berhasil diimpor.']);
    }
}
