import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Field from '../../Components/Field';

export default function Login() {
    const { event, theme } = usePage().props;
    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';

    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk" />

            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="mb-6 text-center">
                        <div
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                            aria-hidden="true"
                        >
                            FP
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">{eventName}</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {theme?.edition_title ?? 'Portal pendaftaran peserta'}
                        </p>
                    </div>

                    <form
                        onSubmit={submit}
                        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Masuk</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Gunakan email atau username akun sekolah / panitia.
                            </p>
                        </div>

                        <Field
                            label="Email atau Username"
                            name="login"
                            autoComplete="username"
                            autoFocus
                            required
                            value={data.login}
                            error={errors}
                            onChange={(e) => setData('login', e.target.value)}
                            placeholder="sekolah@contoh.sch.id"
                        />

                        <Field
                            label="Kata Sandi"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={data.password}
                            error={errors}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />

                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                            />
                            Ingat saya
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                            style={{ backgroundColor: 'var(--primary-color, #0f766e)' }}
                        >
                            {processing ? 'Memproses…' : 'Masuk'}
                        </button>

                        <p className="border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
                            Sekolah belum punya akun?{' '}
                            <Link
                                href="/klaim"
                                className="font-semibold underline decoration-2 underline-offset-2"
                                style={{ color: 'var(--primary-color, #0f766e)' }}
                            >
                                Klaim NPSN di sini
                            </Link>
                        </p>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        {eventName} {event?.year ? `· ${event.year}` : ''}
                    </p>
                </div>
            </div>
        </>
    );
}
