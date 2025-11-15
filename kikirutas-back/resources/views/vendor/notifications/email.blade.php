@php
    $greeting = $greeting ?? '¡Hola!';
    $level = $level ?? 'primary'; // primary | success | error
@endphp

<x-mail::message>
# {{ $greeting }}

@foreach ($introLines as $line)
{{ $line }}
@endforeach

@isset($actionText)
<x-mail::button :url="$actionUrl" :color="$level">
{{ $actionText }}
</x-mail::button>
@endisset

@foreach ($outroLines as $line)
{{ $line }}
@endforeach

@slot('subcopy')
@isset($actionText)
Si tienes problemas para hacer clic en el botón "{{ $actionText }}", copia y pega la siguiente URL en tu navegador:
<span class="break-all"><a href="{{ $actionUrl }}" target="_blank">{{ $displayableActionUrl }}</a></span>
@endisset
@endslot
</x-mail::message>
