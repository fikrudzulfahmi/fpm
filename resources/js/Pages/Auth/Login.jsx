import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Field from '../../Components/Field';

export default function Login() {
    const { event, theme } = usePage().props;
    const eventName = event?.event_name ?? 'Festival Pelajar Muslim';
    const editionTitle = theme?.edition_title ?? null;
    const logo = theme?.logo_url ?? '/branding/logo-mark.png';

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
        <div className="fpm-site fpm-auth">
            <Head title="Masuk" />

            <div className="fpm-auth__inner">
                <Link href="/" className="brand fpm-auth__brand" aria-label={`${eventName} — beranda`}>
                    <img className="brand__mark" src={logo} alt="" width="40" height="46" />
                    <span className="brand__text">
                        <strong>{editionTitle ?? eventName}</strong>
                        <span>SMKS Islam 1 Kota Blitar</span>
                    </span>
                </Link>

                <form onSubmit={submit} className="form-card">
                    <span className="eyebrow">Portal peserta</span>
                    <h1 className="h2" style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)' }}>
                        Masuk
                    </h1>
                    <p className="small muted" style={{ marginTop: '8px' }}>
                        Gunakan email atau username akun sekolah / panitia.
                    </p>

                    <div className="stack-sm" style={{ marginTop: '22px' }}>
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

                        <label className="check">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span>Ingat saya di perangkat ini</span>
                        </label>

                        <button type="submit" disabled={processing} className="btn btn--gold btn--block">
                            {processing ? 'Memproses…' : 'Masuk'}
                        </button>
                    </div>

                    <p className="fpm-auth__alt">
                        Sekolah belum punya akun?{' '}
                        <Link href="/klaim">
                            <strong>Klaim NPSN di sini</strong>
                        </Link>
                    </p>
                </form>

                <p className="fpm-auth__foot">
                    <Link href="/">Kembali ke beranda</Link>
                    {event?.year ? ` · Edisi ${event.year}` : ''}
                </p>
            </div>
        </div>
    );
}
