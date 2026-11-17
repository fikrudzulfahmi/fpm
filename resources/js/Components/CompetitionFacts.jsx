/**
 * Ringkasan fakta cabang lomba: format peserta, kuota, dan jumlah kriteria.
 * Dipakai kartu di beranda & halaman daftar lomba agar deskripsi panjang tidak
 * menumpuk jadi satu paragraf.
 */
export function competitionFacts(competition) {
    const isGroup = competition.category_type === 'group';
    const min = competition.min_group_members ?? 1;
    const max = competition.max_group_members ?? null;

    const format = isGroup
        ? max
            ? `Beregu ${min}–${max} siswa`
            : 'Beregu'
        : 'Individu';

    const quota = competition.global_quota
        ? `${competition.global_quota} ${isGroup ? 'grup' : 'peserta'}`
        : null;

    const perSchool = competition.school_quota
        ? `maks. ${competition.school_quota} per sekolah`
        : null;

    const criteria = competition.criteria ?? [];

    return {
        isGroup,
        format,
        gender: competition.gender_mode === 'separate' ? 'Putra & Putri' : null,
        quota,
        perSchool,
        criteria,
        criteriaSummary: criteria.length
            ? criteria.map((c) => c.name).join(' · ')
            : 'Nilai tunggal',
    };
}

export default function CompetitionFacts({ competition, showCriteria = false }) {
    const facts = competitionFacts(competition);

    return (
        <ul className="facts">
            <li className="fact">
                <span className="fact__label">Format</span>
                <span className="fact__value">
                    {facts.format}
                    {facts.gender ? ` · ${facts.gender}` : ''}
                </span>
            </li>

            {facts.quota && (
                <li className="fact">
                    <span className="fact__label">Kuota</span>
                    <span className="fact__value">
                        {facts.quota}
                        {facts.perSchool ? ` · ${facts.perSchool}` : ''}
                    </span>
                </li>
            )}

            <li className="fact">
                <span className="fact__label">Penilaian</span>
                <span className="fact__value">
                    {showCriteria
                        ? facts.criteriaSummary
                        : facts.criteria.length
                          ? `${facts.criteria.length} kriteria`
                          : 'Nilai tunggal'}
                </span>
            </li>
        </ul>
    );
}
