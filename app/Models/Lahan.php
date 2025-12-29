<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lahan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama', 'luas', 'koordinat', 'elevasi', 'suhu',
        'curah_hujan', 'pola_tanam', 'produktivitas', 'kategori'
    ];

    protected $casts = [
        'koordinat' => 'array',
        'luas' => 'decimal:2',
        'elevasi' => 'decimal:2',
        'suhu' => 'decimal:2',
        'curah_hujan' => 'decimal:2',
        'produktivitas' => 'decimal:2'
    ];
}
