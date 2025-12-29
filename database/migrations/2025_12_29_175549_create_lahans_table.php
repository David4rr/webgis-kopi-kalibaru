<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lahans', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->decimal('luas', 10, 2);
            $table->json('koordinat');
            $table->decimal('elevasi', 8, 2)->nullable();
            $table->decimal('suhu', 5, 2)->nullable();
            $table->decimal('curah_hujan', 6, 2)->nullable();
            $table->string('pola_tanam')->default('monokultur');
            $table->decimal('produktivitas', 10, 2);
            $table->string('kategori');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('lahans');
    }
};
