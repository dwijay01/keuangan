<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AllocationRule;
use Illuminate\Http\Request;

class AllocationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            AllocationRule::where('user_id', $request->user()->id)
                ->with('goal')
                ->get()
        );
    }

    public function sync(Request $request)
    {
        $request->validate([
            'rules' => 'required|array',
            'rules.*.goal_id' => 'required|exists:goals,id',
            'rules.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        $user = $request->user();
        $totalPercentage = collect($request->rules)->sum('percentage');

        if ($totalPercentage > 100) {
            return response()->json([
                'message' => 'Total persentase tidak boleh melebihi 100%.'
            ], 422);
        }

        // Delete existing rules and recreate
        AllocationRule::where('user_id', $user->id)->delete();

        $rules = [];
        foreach ($request->rules as $ruleData) {
            if ($ruleData['percentage'] > 0) {
                $rules[] = AllocationRule::create([
                    'user_id' => $user->id,
                    'goal_id' => $ruleData['goal_id'],
                    'percentage' => $ruleData['percentage'],
                ]);
            }
        }

        return response()->json(
            AllocationRule::where('user_id', $user->id)->with('goal')->get()
        );
    }
}
