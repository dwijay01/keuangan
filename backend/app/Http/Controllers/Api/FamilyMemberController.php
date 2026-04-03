<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FamilyMember;
use App\Models\FamilyMilestone;
use Illuminate\Http\Request;

class FamilyMemberController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            FamilyMember::where('user_id', $request->user()->id)
                ->with('milestones')
                ->orderBy('birth_date', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'relation' => 'required|string|max:100',
        ]);

        $member = FamilyMember::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'birth_date' => $request->birth_date,
            'relation' => $request->relation,
        ]);

        // Auto-create default milestones for children
        if (in_array(strtolower($request->relation), ['anak', 'anak laki-laki', 'anak perempuan', 'balita'])) {
            $milestones = [
                ['name' => 'Berhenti Popok', 'age_months' => 30],
                ['name' => 'Masuk PAUD', 'age_months' => 48],
                ['name' => 'Masuk TK', 'age_months' => 60],
                ['name' => 'Masuk SD', 'age_months' => 72],
                ['name' => 'Masuk SMP', 'age_months' => 144],
                ['name' => 'Masuk SMA', 'age_months' => 180],
                ['name' => 'Masuk Kuliah', 'age_months' => 216],
            ];

            foreach ($milestones as $milestone) {
                FamilyMilestone::create([
                    'family_member_id' => $member->id,
                    'name' => $milestone['name'],
                    'age_months' => $milestone['age_months'],
                    'is_completed' => $member->age_in_months >= $milestone['age_months'],
                ]);
            }
        }

        return response()->json($member->load('milestones'), 201);
    }

    public function update(Request $request, FamilyMember $familyMember)
    {
        if ($familyMember->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'string|max:255',
            'birth_date' => 'date',
            'relation' => 'string|max:100',
        ]);

        $familyMember->update($request->only(['name', 'birth_date', 'relation']));

        return response()->json($familyMember->load('milestones'));
    }

    public function destroy(Request $request, FamilyMember $familyMember)
    {
        if ($familyMember->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $familyMember->delete();

        return response()->json(['message' => 'Anggota keluarga berhasil dihapus.']);
    }
}
