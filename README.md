# ShareNest - Sprint 1 Setup

Base mobile app con Expo + Supabase Auth (magic link y OTP), sesión persistente y onboarding inicial.

## Requisitos

- Node.js 20+
- Proyecto Supabase creado
- Expo CLI (vía `npx expo`)

## Entornos

La app usa `app.config.ts` + `expo-constants`:

- `APP_ENV=dev | staging | prod`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

1. Copia `.env.example` a `.env`.
2. Rellena URL y anon key de Supabase.

## Ejecutar local

```bash
npm install
npm run start
```

## Auth implementado

- Email magic link (`supabase.auth.signInWithOtp({ email })`)
- Phone OTP (`signInWithOtp({ phone })` + `verifyOtp`)
- Sesión persistente con `expo-secure-store`
- Onboarding post-login (aparece si el perfil no tiene `full_name`)

## Base de datos (RLS desde día 1)

Migración incluida:

- `supabase/migrations/202603170001_init_profiles.sql`

Incluye:

- Tabla `profiles`
- Trigger para crear perfil al registrarse un usuario
- Policies:
  - select para usuarios autenticados
  - insert/update solo sobre tu propio `id`

## Calidad

```bash
npm run lint
npm test
```

CI en PR:

- `.github/workflows/ci.yml` ejecuta `npm ci`, `npm run lint`, `npm test`.
