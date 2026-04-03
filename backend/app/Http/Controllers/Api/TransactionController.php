<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionSplit;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Transaction::where('user_id', $user->id)
            ->with(['category', 'splits.category']);

        // Filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('date_from')) {
            $query->where('transaction_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('transaction_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $query->where('note', 'like', '%' . $request->search . '%');
        }

        // Summary for filtered results
        $summaryQuery = clone $query;
        $totalIncome = (clone $summaryQuery)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $summaryQuery)->where('type', 'expense')->sum('amount');

        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'transactions' => $transactions,
            'summary' => [
                'total_income' => (float) $totalIncome,
                'total_expense' => (float) $totalExpense,
                'net' => (float) ($totalIncome - $totalExpense),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:income,expense',
            'category_id' => 'nullable|exists:categories,id',
            'note' => 'nullable|string|max:500',
            'is_split' => 'boolean',
            'splits' => 'required_if:is_split,true|array',
            'splits.*.category_id' => 'required|exists:categories,id',
            'splits.*.amount' => 'required|numeric|min:0',
            'splits.*.note' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'transaction_date' => $request->transaction_date,
            'amount' => $request->amount,
            'type' => $request->type,
            'category_id' => $request->is_split ? null : $request->category_id,
            'note' => $request->note,
            'is_split' => $request->is_split ?? false,
        ]);

        if ($request->is_split && $request->has('splits')) {
            foreach ($request->splits as $split) {
                TransactionSplit::create([
                    'transaction_id' => $transaction->id,
                    'category_id' => $split['category_id'],
                    'amount' => $split['amount'],
                    'note' => $split['note'] ?? null,
                ]);
            }
        }

        return response()->json(
            $transaction->load(['category', 'splits.category']),
            201
        );
    }

    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'transaction_date' => 'date',
            'amount' => 'numeric|min:0',
            'type' => 'in:income,expense',
            'category_id' => 'nullable|exists:categories,id',
            'note' => 'nullable|string|max:500',
            'is_split' => 'boolean',
            'splits' => 'array',
            'splits.*.category_id' => 'required|exists:categories,id',
            'splits.*.amount' => 'required|numeric|min:0',
            'splits.*.note' => 'nullable|string|max:500',
        ]);

        $transaction->update($request->only([
            'transaction_date', 'amount', 'type', 'category_id', 'note', 'is_split'
        ]));

        if ($request->has('splits')) {
            $transaction->splits()->delete();
            foreach ($request->splits as $split) {
                TransactionSplit::create([
                    'transaction_id' => $transaction->id,
                    'category_id' => $split['category_id'],
                    'amount' => $split['amount'],
                    'note' => $split['note'] ?? null,
                ]);
            }
        }

        return response()->json($transaction->load(['category', 'splits.category']));
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $transaction->delete();

        return response()->json(['message' => 'Transaksi berhasil dihapus.']);
    }
}
