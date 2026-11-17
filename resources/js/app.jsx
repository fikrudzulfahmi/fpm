import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

const appName = 'Festival Pelajar Muslim';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: false });
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Halaman Inertia tidak ditemukan: ${name}`);
        }

        return page().then((module) => module.default ?? module);
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#064b3d',
    },
});
