# Financial Dashboard

A financial dashboard application built with React and Supabase.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

This application requires a Supabase project for authentication and data storage.

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Go to your project settings: `Settings` → `API`
3. Copy your project URL and anon/public key
4. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

5. Update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Development Server

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

## Troubleshooting

### ERR_NAME_NOT_RESOLVED

If you see this error, it means your Supabase URL is not configured correctly. Make sure you:

1. Created a `.env` file with the correct Supabase credentials
2. Restarted the development server after creating/updating the `.env` file
