<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Agrega aquí tus orígenes de front (o usa la variable de entorno)
    'allowed_origins' => explode(',', env('FRONTEND_ORIGINS', '*')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Ponlo en true si harás auth por cookies (Sanctum SPA). No afecta tokens Bearer.
    'supports_credentials' => true,

];
