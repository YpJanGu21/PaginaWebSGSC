-- Esquema de la base de datos para el Gestor de Solicitudes SGSC
-- Pega este archivo completo en Supabase > SQL Editor > Run
-- (reemplaza la tabla actual: borra la fila de prueba si existe)

drop table if exists public.solicitudes;

create table public.solicitudes (
  id bigint generated always as identity primary key,
  recurso text not null,
  recurso_id text not null default '',
  solicitante text not null,
  departamento text not null default '',
  responsable text not null default '',
  fecha_solicitud date not null,
  fecha_reserva date not null,
  inicio text not null,
  termino text not null,
  hora_inicio text not null,
  hora_fin text not null,
  descripcion text not null default '',
  estado text not null default 'Pendiente',
  observacion_cierre text,
  adicionales jsonb not null default '{}'::jsonb,
  constraint estado_valido check (estado in (
    'Pendiente', 'Aprobada', 'En Espera', 'En Revisión', 'Aprobado',
    'Rechazada', 'Declinado', 'Cancelada', 'Cerrada'
  )),
  constraint finde_semana check (extract(dow from fecha_reserva) between 1 and 5),
  constraint horas_validas check (
    hora_inicio >= '08:00' and hora_fin <= '17:00' and hora_inicio < hora_fin
  )
);

-- La app usa la anon key (pública), así que permitimos acceso anónimo.
-- En un proyecto real añadirías autenticación y restringirías los permisos.
alter table public.solicitudes enable row level security;

drop policy if exists "lectura anonima" on public.solicitudes;
create policy "lectura anonima" on public.solicitudes
  for select using (true);

drop policy if exists "insercion anonima" on public.solicitudes;
create policy "insercion anonima" on public.solicitudes
  for insert with check (true);

drop policy if exists "actualizacion anonima" on public.solicitudes;
create policy "actualizacion anonima" on public.solicitudes
  for update using (true) with check (true);

drop policy if exists "borrado anonimo" on public.solicitudes;
create policy "borrado anonimo" on public.solicitudes
  for delete using (true);
