<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Bill::where('user_id', $request->user()->id)
                ->with('category')
                ->orderBy('due_day')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_day' => 'required|integer|between:1,31',
            'category_id' => 'nullable|exists:categories,id',
            'is_recurring' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'total_installments' => 'nullable|integer|min:1',
            'paid_installments' => 'nullable|integer|min:0',
        ]);

        $bill = Bill::create(array_merge(
            $request->only([
                'name', 'amount', 'due_day', 'category_id', 'is_recurring',
                'start_date', 'end_date', 'total_installments', 'paid_installments'
            ]),
            ['user_id' => $request->user()->id]
        ));

        return response()->json($bill->load('category'), 201);
    }

    public function update(Request $request, Bill $bill)
    {
        if ($bill->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'string|max:255',
            'amount' => 'numeric|min:0',
            'due_day' => 'integer|between:1,31',
            'category_id' => 'nullable|exists:categories,id',
            'is_recurring' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'total_installments' => 'nullable|integer|min:1',
            'paid_installments' => 'nullable|integer|min:0',
        ]);

        $bill->update($request->only([
            'name', 'amount', 'due_day', 'category_id', 'is_recurring',
            'start_date', 'end_date', 'total_installments', 'paid_installments'
        ]));

        return response()->json($bill->load('category'));
    }

    public function destroy(Request $request, Bill $bill)
    {
        if ($bill->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bill->delete();

        return response()->json(['message' => 'Tagihan berhasil dihapus.']);
    }
}
