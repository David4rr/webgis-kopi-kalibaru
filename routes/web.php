<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LahanController;

// Halaman utama dengan peta
Route::get('/', [DashboardController::class, 'index']);

// API endpoints untuk lahan
Route::prefix('api')->group(function () {
    Route::get('/lahan', [LahanController::class, 'getAll']);
    Route::post('/lahan', [LahanController::class, 'store']);
    Route::get('/lahan/{id}', [LahanController::class, 'show']);
    Route::put('/lahan/{id}', [LahanController::class, 'update']);
    Route::delete('/lahan/{id}', [LahanController::class, 'destroy']);
});

// Halaman statis
Route::view('/tentang', 'tentang');
Route::view('/bantuan', 'bantuan');
Route::view('/kontak', 'kontak');
