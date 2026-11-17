<?php

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Data sekolah resmi FPM XII (sumber: daftar NPSN panitia) + pembersihan data demo.
 *
 * Produksi hanya boleh berisi akun panitia; sekolah demo, akun sekolah demo,
 * dan pendaftaran dummy dihapus (FK cascade). Daftar sekolah diimpor ulang
 * secara idempoten berdasarkan NPSN.
 */
return new class extends Migration
{
    /** NPSN sekolah dummy bawaan SchoolSeeder lama. */
    private const DEMO_NPSNS = [
        '20514401', '20514402', '20514403', '20514404', '20514405',
        '20514406', '20514407', '20514408', '20514409', '20514410',
    ];

    private const DEMO_USER_EMAILS = ['smpn1@fpm.test', 'mtsn1@fpm.test'];

    /** Daftar sekolah resmi (NPSN unik). */
    private const SCHOOLS = [
        ['npsn' => '20581066', 'school_name' => 'MTs AL MAWADDAH 2', 'address' => 'JL. MASJID NO 07, JIWUT, KEC. NGLEGOK, KAB. BLITAR'],
        ['npsn' => '20581085', 'school_name' => 'MTs AL MUHTADUUN', 'address' => 'JL. BRANTAS NO.25 JABUNG TALUN BLITAR, JABUNG, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20585002', 'school_name' => 'MTs AL MUSLIHUN', 'address' => 'JL RAYA TLOGO KANIGORO, TLOGO, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '20581086', 'school_name' => 'MTs AL UMRON', 'address' => 'JL. A. YANI NO. 27 BENDOSEWU, BENDOSEWU, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20585003', 'school_name' => 'MTs BUSTANUL ULUM', 'address' => 'JL RAYA BRANTAS NO 1, MINGGIRSARI, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '20581067', 'school_name' => 'MTs DAARUL ULUUM', 'address' => 'JL. PROTOKOL NO 16  MARGOMULYO, MARGOMULYO, KEC. PANGGUNGREJO, KAB. BLITAR'],
        ['npsn' => '20581092', 'school_name' => 'MTs DARUL HUDA', 'address' => 'JL. SOEKARNO HATTA NO.29 WONODADI BLITAR, WONODADI, KEC. WONODADI, KAB. BLITAR'],
        ['npsn' => '20585001', 'school_name' => 'MTs HASANUDIN', 'address' => 'JL. RAYA GAPRANG KANIGORO BLITAR, GAPRANG, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '20581088', 'school_name' => 'MTs MA\'ARIF BAKUNG', 'address' => 'JL. KH. ZAID 37 BAKUNG UDANAWU BLITAR, BAKUNG, KEC. UDANAWU, KAB. BLITAR'],
        ['npsn' => '20581070', 'school_name' => 'MTs MA\'ARIF KAWEDUSAN', 'address' => 'JL RAYA KAWEDUSAN PONGGOK, BENDO, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20581071', 'school_name' => 'MTs MA\'ARIF NU BACEM', 'address' => 'JL.BRAWIJAYA NO. 01 BACEM PONGGOK, BACEM, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20584996', 'school_name' => 'MTs MA\'ARIF NU GANDUSARI', 'address' => 'JL. RAYA KAWI NO. 32 KEC. GANDUSARI, GANDUSARI, KEC. GANDUSARI, KAB. BLITAR'],
        ['npsn' => '20581081', 'school_name' => 'MTs MA\'ARIF SRENGAT', 'address' => 'JL. MASJID 35 RT/RW 01/03, SRENGAT, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20585004', 'school_name' => 'MTs MAFTAHUL ULUM', 'address' => 'KARANGSONO RT :003 RW:001, KARANGSONO, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '70044596', 'school_name' => 'MTs MAMBAUS SHOLIHIN BLITAR', 'address' => 'JL AL-HIKMAH BULU CAWANG, BENDO, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20585005', 'school_name' => 'MTs MIFTAHUL HUDA', 'address' => 'JL MASJID 42 RT 03 RW 05 CENTONG, SAWENTAR, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '20581082', 'school_name' => 'MTs MIFTAHUL ULUM', 'address' => 'JL. RAYA BARAT 42 LODOYO KALIPANG SUTOJAYAN BLITAR, KALIPANG, KEC. SUTOJAYAN, KAB. BLITAR'],
        ['npsn' => '20581091', 'school_name' => 'MTs NEGERI 1 BLITAR', 'address' => 'JL PONPES AL-KAMAL KUNIR WONODADI KAB.BLITAR, KUNIR, KEC. WONODADI, KAB. BLITAR'],
        ['npsn' => '69978953', 'school_name' => 'MTs NEGERI 10 BLITAR', 'address' => 'POJOK, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '69995207', 'school_name' => 'MTs NEGERI 11 BLITAR', 'address' => 'JL MASJID NO. 15 DSN. DAWUNG, UMBUL DAMAR, KEC. BINANGUN, KAB. BLITAR'],
        ['npsn' => '20581084', 'school_name' => 'MTs NEGERI 2 BLITAR', 'address' => 'JL. SINGAJAYA NO. 33 DESA JEBLOG KABUPATEN BLITAR, JEBLOG, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20581080', 'school_name' => 'MTs NEGERI 3 BLITAR', 'address' => 'JL. MASJID NO. 7  DSN LANGKAPAN RT 01/RW 01  DS. MARON SRENGAT BLITAR, MARON, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20584987', 'school_name' => 'MTs NEGERI 4 BLITAR', 'address' => 'JL. DESA SUKOSEWU, SUKOSEWU, KEC. GANDUSARI, KAB. BLITAR'],
        ['npsn' => '20581078', 'school_name' => 'MTs NEGERI 5 BLITAR', 'address' => 'JL. RAYA KEMBAR SELOREJO, SELOREJO, KEC. SELOREJO, KAB. BLITAR'],
        ['npsn' => '20581073', 'school_name' => 'MTs NEGERI 6 BLITAR', 'address' => 'JL. JAWA NO. 1B DS. SUMBERJO SANANKULON BLITAR, SUMBERJO, KEC. SANANKULON, KAB. BLITAR'],
        ['npsn' => '20581089', 'school_name' => 'MTs NEGERI 7 BLITAR', 'address' => 'JL. DAHLIA NO. 37, MOJOREJO, KEC. WATES, KAB. BLITAR'],
        ['npsn' => '20581075', 'school_name' => 'MTs NEGERI 8 BLITAR', 'address' => 'DS. JAMBEWANGI RT 003 RW 001, JAMBEWANGI, KEC. SELOPURO, KAB. BLITAR'],
        ['npsn' => '20581069', 'school_name' => 'MTs NEGERI 9 BLITAR', 'address' => 'JL.MASJID PANCIREJO NO.01, SIDOREJO, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20584988', 'school_name' => 'MTs NU GARUM', 'address' => 'JL. RAYA GARUM, POJOK, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20584998', 'school_name' => 'MTs NU SLOROK', 'address' => 'JL. AHMAD YANI NO. 35 DESA SLOROK, SLOROK, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20584989', 'school_name' => 'MTs NURUL ULUM 2 SUTOJAYAN', 'address' => 'JL. DIPONEGORO NO.105, KEDUNG BUNDER, KEC. SUTOJAYAN, KAB. BLITAR'],
        ['npsn' => '20585006', 'school_name' => 'MTs SA HIDAYATUL MUBATADIIN', 'address' => 'JL. MAWAR 40 SAWAHAN, SATREYAN, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '69963466', 'school_name' => 'MTs SALAFIYAH', 'address' => 'JL. KH.DIMYATI NO. 12 KASIM PLOSO SELOPURO BLITAR JAWA TIMUR, PLOSO, KEC. SELOPURO, KAB. BLITAR'],
        ['npsn' => '20581083', 'school_name' => 'MTs SIROJUT THOLIBIIN', 'address' => 'JL.NYIUR BACEM SUTOJAYAN BLITAR, PANDANARUM, KEC. SUTOJAYAN, KAB. BLITAR'],
        ['npsn' => '20581087', 'school_name' => 'MTs SUNAN KALIJOGO', 'address' => 'JL.MASJID SUNAN KALIJOGO KENDALREJO-TALUN, TUMPANG, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20581063', 'school_name' => 'MTs SYEKH SUBAKIR 1', 'address' => 'JL PESANTREN NO. 01 KEC. NGLEGOK KAB. BLITAR, NGLEGOK, KEC. NGLEGOK, KAB. BLITAR'],
        ['npsn' => '20581064', 'school_name' => 'MTs SYEKH SUBAKIR 2', 'address' => 'RT.01 RW. 09, SUMBERASRI, KEC. NGLEGOK, KAB. BLITAR'],
        ['npsn' => '69979828', 'school_name' => 'SMP AL ASHFA MODANGAN', 'address' => 'JL. PONPES RT. 01 RW. 02, MODANGAN, KEC. NGLEGOK, KAB. BLITAR'],
        ['npsn' => '20514362', 'school_name' => 'SMP AL KAMAL KUNIR', 'address' => 'JL PESANTREN NO 20 DESA KUNIR, KUNIR, KEC. WONODADI, KAB. BLITAR'],
        ['npsn' => '20554580', 'school_name' => 'SMP ASWAJA', 'address' => 'JL. RAYA PESANTREN KUNIR WONODADI, KUNIR, KEC. WONODADI, KAB. BLITAR'],
        ['npsn' => '60728382', 'school_name' => 'SMP DARUL FALAH JEBLOG TALUN', 'address' => 'JL. SEMBOJA 35 DSN. PUNDENSARI, JEBLOG, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20551744', 'school_name' => 'SMP DARUSSALAM', 'address' => 'JL. BIMA NO. 27 KADEMANGAN, KEC. KADEMANGAN, KAB. BLITAR'],
        ['npsn' => '20514359', 'school_name' => 'SMP HASANUDDIN', 'address' => 'DSN. BANGGLE, BANGGLE, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '69989475', 'school_name' => 'SMP ISLAM AFADA BLITAR', 'address' => 'DSN. CANGKRING RT. 01 RW. 04, PLOSOARANG, KEC. SANANKULON, KAB. BLITAR'],
        ['npsn' => '20554581', 'school_name' => 'SMP ISLAM ASSALAM', 'address' => 'JL. RAYA JAMBEWANGI  RT.03/RW.01 DSN. KRAJAN, JAMBEWANGI, KEC. SELOPURO, KAB. BLITAR'],
        ['npsn' => '70026902', 'school_name' => 'SMP ISLAM IBNU MAS\'UD', 'address' => 'RT 3 RW 1, SUMBERDIREN, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20514337', 'school_name' => 'SMP ISLAM SRENGAT', 'address' => 'JL. RAYA NO. 11 (BARAT KANTOR TELKOM) KEC. SRENGAT, SRENGAT, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '69899755', 'school_name' => 'SMP MAMBA`UL HISAN', 'address' => 'GONDANG, KEC. GANDUSARI, KAB. BLITAR'],
        ['npsn' => '20514467', 'school_name' => 'SMP MAMBA`US SHOLIHIN 2', 'address' => 'JL. KH. MISBAHUDIN AHMAD SUMBER SANANKULON BLITAR, SUMBER, KEC. SANANKULON, KAB. BLITAR'],
        ['npsn' => '60726249', 'school_name' => 'SMP MIFTAHUL HUDA', 'address' => 'JL. BIMA DSN. NGADE RT.01 RW.05 GOGODESO KANIGORO BLITAR, GOGODESO, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '20514466', 'school_name' => 'SMP MUA`ALIMIN', 'address' => 'JL SOEKARNO HATTA WONODADI, WONODADI, KEC. WONODADI, KAB. BLITAR'],
        ['npsn' => '20551741', 'school_name' => 'SMP NEGERI 1 BAKUNG', 'address' => 'JL AHMAD YANI, BAKUNG, KEC. BAKUNG, KAB. BLITAR'],
        ['npsn' => '20514473', 'school_name' => 'SMP NEGERI 1 DOKO', 'address' => 'JL. DESA RESAPOMBO, RESAPOMBO, KEC. DOKO, KAB. BLITAR'],
        ['npsn' => '20514472', 'school_name' => 'SMP NEGERI 1 GANDUSARI', 'address' => 'JL. KELUD NO. 32 RT. 01 RW. 01, SEMEN, KEC. GANDUSARI, KAB. BLITAR'],
        ['npsn' => '20514471', 'school_name' => 'SMP NEGERI 1 GARUM', 'address' => 'JL SUMATRA NO. 2, SLOROK, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20514470', 'school_name' => 'SMP NEGERI 1 KADEMANGAN', 'address' => 'SURUHWADANG, KEC. KADEMANGAN, KAB. BLITAR'],
        ['npsn' => '20514469', 'school_name' => 'SMP NEGERI 1 KANIGORO', 'address' => 'JL MELATI SRENGAT, SRENGAT, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20514420', 'school_name' => 'SMP NEGERI 1 PONGGOK', 'address' => 'JL JENDRAL SUDIRMAN 208, PONGGOK, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20514465', 'school_name' => 'SMP NEGERI 1 SANANKULON', 'address' => 'JL KELUD 23, TALUN, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20514460', 'school_name' => 'SMP NEGERI 1 SUTOJAYAN', 'address' => 'JL LAPANGAN, PONGGOK, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20514459', 'school_name' => 'SMP NEGERI 1 TALUN', 'address' => 'JL.PALYOKROMO NO 16   RT 03 RW 04, BIROWO, KEC. BINANGUN, KAB. BLITAR'],
        ['npsn' => '20514458', 'school_name' => 'SMP NEGERI 1 UDANAWU', 'address' => 'JL RAYA SIDOREJO, SIDOREJO, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20514454', 'school_name' => 'SMP NEGERI 1 WONOTIRTO', 'address' => 'JL. TEUKU UMAR NO. 68, SATREYAN, KEC. KANIGORO, KAB. BLITAR'],
        ['npsn' => '20514423', 'school_name' => 'SMP NEGERI 2 DOKO', 'address' => 'RT. 02 RW. 02, GENENGAN, KEC. DOKO, KAB. BLITAR'],
        ['npsn' => '20551720', 'school_name' => 'SMP NEGERI 2 GANDUSARI', 'address' => 'JL. KAWI NOMOR 01, GANDUSARI, KEC. GANDUSARI, KAB. BLITAR'],
        ['npsn' => '20514439', 'school_name' => 'SMP NEGERI 2 GARUM', 'address' => 'RT. 03 RW. 05, KARANGREJO, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20514438', 'school_name' => 'SMP NEGERI 2 KADEMANGAN', 'address' => 'JL SADEWO NO. 75, KADEMANGAN, KEC. KADEMANGAN, KAB. BLITAR'],
        ['npsn' => '20514437', 'school_name' => 'SMP NEGERI 2 NGLEGOK', 'address' => 'JL PRAMUKA NO. 24, NGLEGOK, KEC. NGLEGOK, KAB. BLITAR'],
        ['npsn' => '20514436', 'school_name' => 'SMP NEGERI 2 PANGGUNGREJO', 'address' => 'JL. RAYA SERANG, SERANG, KEC. PANGGUNGREJO, KAB. BLITAR'],
        ['npsn' => '20514435', 'school_name' => 'SMP NEGERI 2 PONGGOK', 'address' => 'GEMBONGAN, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20551716', 'school_name' => 'SMP NEGERI 2 SRENGAT', 'address' => 'JL. STADION, DANDONG, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20514433', 'school_name' => 'SMP NEGERI 2 SUTOJAYAN', 'address' => 'JL. RAYA BARAT NO. 65, KALIPANG, KEC. SUTOJAYAN, KAB. BLITAR'],
        ['npsn' => '20514432', 'school_name' => 'SMP NEGERI 2 TALUN', 'address' => 'RT. 5 RW. 5, KENDALREJO, KEC. TALUN, KAB. BLITAR'],
        ['npsn' => '20514429', 'school_name' => 'SMP NEGERI 2 WONOTIRTO', 'address' => 'JL. BRAWIJAYA  NGENI-WONOTIRTO KEC. WONOTIRTO, NGENI, KEC. WONOTIRTO, KAB. BLITAR'],
        ['npsn' => '20514428', 'school_name' => 'SMP NEGERI 3 DOKO', 'address' => 'DSN. SUMBERURIP RT.05 RW.01, SUMBER URIP, KEC. DOKO, KAB. BLITAR'],
        ['npsn' => '20514425', 'school_name' => 'SMP NEGERI 3 PONGGOK', 'address' => 'JL POS KUNING, JATILENGGER, KEC. PONGGOK, KAB. BLITAR'],
        ['npsn' => '20514407', 'school_name' => 'SMP NEGERI 3 SRENGAT', 'address' => 'JL. A. YANI SELOKAJANG, SELOKAJANG, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20514464', 'school_name' => 'SMP NU GARUM', 'address' => 'TAWANGSARI, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20548833', 'school_name' => 'SMP PGRI SUTOJAYAN', 'address' => 'JL. MERAPI NO. 02 KEL. SUKOREJO, SUKOREJO, KEC. SUTOJAYAN, KAB. BLITAR'],
        ['npsn' => '20576014', 'school_name' => 'SMP TERPADU DARUR ROJA', 'address' => 'JL. KH. WAHID HASYIM NOMOR 01, SELOKAJANG, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20574697', 'school_name' => 'SMPIT IBAADURROHMAN', 'address' => 'JL. LETTU IMAM MUASIM DANDONG, DANDONG, KEC. SRENGAT, KAB. BLITAR'],
        ['npsn' => '20583798', 'school_name' => 'MTs DIPONEGORO', 'address' => 'JL JATI NOMOR 193A  BLITAR, TURI, KEC. SUKOREJO, KOTA BLITAR'],
        ['npsn' => '20583796', 'school_name' => 'MTs HIDAYATULLAH', 'address' => 'JL. KALIMANTAN NO.42  SANANWETAN  BLITAR, SANANWETAN, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20583794', 'school_name' => 'MTs MA\'ARIF NU BLITAR', 'address' => 'JL. CILIWUNG 56, BENDO, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20583797', 'school_name' => 'MTs NEGERI 1 KOTA BLITAR', 'address' => 'JL CEMARA X/83 BLITAR, KARANGSARI, KEC. SUKOREJO, KOTA BLITAR'],
        ['npsn' => '20583793', 'school_name' => 'MTs NEGERI 2 KOTA BLITAR', 'address' => 'JL. CILIWUNG 140 BLITAR, BENDO, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20583795', 'school_name' => 'MTs NURUL HUDA', 'address' => 'JL. DI PANJAITAN NO. 73 BLITAR, NGADIREJO, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '70027473', 'school_name' => 'MTs UNGGULAN PERWANIDA', 'address' => 'JL PEMUDA SOEMPONO, GEDOG, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '69865944', 'school_name' => 'SMP AL MUHAFIZHOH', 'address' => 'JL. SUNGAI HULU TIMUR 15 KOTA BLITAR, KAUMAN, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '69786509', 'school_name' => 'SMP ALAM AL GIFARI', 'address' => 'JL. SUMBA GANG III BARAT BLITAR, KARANGTENGAH, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20535087', 'school_name' => 'SMP BUSTANUL MUTA\'ALLIMIN', 'address' => 'JL. SUNGAI HILIR TIMUR NO.05, KAUMAN, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '69991336', 'school_name' => 'SMP LAB UM KOTA BLITAR', 'address' => 'JL. IR. SOEKARNO NO.1 KOTA BLITAR, KEPANJENLOR, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20535073', 'school_name' => 'SMP MUHAMMADIYAH 1 BLITAR', 'address' => 'JL. GILI SILAT NO. 26 KOTA BLITAR, KARANGTENGAH, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20573589', 'school_name' => 'SMP MUHAMMADIYAH 2 BLITAR', 'address' => 'JL. IR. SOEKARNO, KEC. SANANWETAN, BENDOGERIT, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20535076', 'school_name' => 'SMP NEGERI 1 BLITAR', 'address' => 'JL. A. YANI NO. 8, KEPANJENKIDUL, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20535078', 'school_name' => 'SMP NEGERI 2 BLITAR', 'address' => 'JL. MELATI 112, KEPANJENKIDUL, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20535079', 'school_name' => 'SMP NEGERI 3 BLITAR', 'address' => 'JL. CILIWUNG 176, TANGGUNG, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20535080', 'school_name' => 'SMP NEGERI 4 BLITAR', 'address' => 'JL. DR SUTOMO 92, BENDOGERIT, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20535081', 'school_name' => 'SMP NEGERI 5 BLITAR', 'address' => 'JL. WIDURI NO. 123, TLUMPU, KEC. SUKOREJO, KOTA BLITAR'],
        ['npsn' => '20535082', 'school_name' => 'SMP NEGERI 6 BLITAR', 'address' => 'JL. SUDANCO SUPRIYADI NO. 34 BLITAR, BENDOGERIT, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20535083', 'school_name' => 'SMP NEGERI 7 BLITAR', 'address' => 'JL. RAUNG NO. 01, KEPANJENLOR, KEC. KEPANJENKIDUL, KOTA BLITAR'],
        ['npsn' => '20535084', 'school_name' => 'SMP NEGERI 8 BLITAR', 'address' => 'JL. KENARI 28, PLOSOKEREP, KEC. SANANWETAN, KOTA BLITAR'],
        ['npsn' => '20535100', 'school_name' => 'SMP NEGERI 9 BLITAR', 'address' => 'JL. WIDAS NO. 29, PAKUNDEN, KEC. SUKOREJO, KOTA BLITAR'],
        ['npsn' => '69761845', 'school_name' => 'SMP TARBIYATUL FALAH', 'address' => 'JL. KALIPORONG NO.128, PAKUNDEN, KEC. SUKOREJO, KOTA BLITAR'],
        ['npsn' => '20581161', 'school_name' => 'MTs HASAN MUCHYI', 'address' => 'JL KH HASYIM ASYARI 03 KAPUREJO, PAGU, KEC. PAGU, KAB. KEDIRI'],
        ['npsn' => '20581165', 'school_name' => 'MTs NEGERI 1 KEDIRI', 'address' => 'JL. STADION CANDA BHIRAWA 01 PARE, TULUNGREJO, KEC. PARE, KAB. KEDIRI'],
        ['npsn' => '20583788', 'school_name' => 'MTs NEGERI 1 KOTA KEDIRI', 'address' => 'JL. RAUNG 87, BANDAR KIDUL, KEC. MOJOROTO, KOTA KEDIRI'],
        ['npsn' => '20581134', 'school_name' => 'MTs NEGERI 2 KEDIRI', 'address' => 'JL. RAYA KANIGORO KRAS KEDIRI, KANIGORO, KEC. KRAS, KAB. KEDIRI'],
        ['npsn' => '20583785', 'school_name' => 'MTs NEGERI 2 KOTA KEDIRI', 'address' => 'JL. SUNAN AMPEL 12, NGRONGGO, KEC. KOTA KEDIRI, KOTA KEDIRI'],
        ['npsn' => '20581181', 'school_name' => 'MTs NEGERI 3 KEDIRI', 'address' => 'JL. PAHLAWAN PURWOASRI KEDIRI, PURWOASRI, KEC. PURWOASRI, KAB. KEDIRI'],
        ['npsn' => '20583787', 'school_name' => 'MTs NEGERI 3 KOTA KEDIRI', 'address' => 'JL. SERSAN BAHRUN GG. VI NO. 11, MRICAN, KEC. MOJOROTO, KOTA KEDIRI'],
        ['npsn' => '20581188', 'school_name' => 'MTs NEGERI 4 KEDIRI', 'address' => 'JL. BATIK MADRIM NO 53 DSN. BECEK, KALIRONG, KEC. TAROKAN, KAB. KEDIRI'],
        ['npsn' => '20581184', 'school_name' => 'MTs NEGERI 5 KEDIRI', 'address' => 'JL. MARABUNTA BALONG RINGINREJO KEDIRI, RINGINREJO, KEC. RINGINREJO, KAB. KEDIRI'],
        ['npsn' => '20581180', 'school_name' => 'MTs NEGERI 6 KEDIRI', 'address' => 'JL. PARE-WATES KM. 06 SIDOMULYO PUNCU KEDIRI, SIDOMULYO, KEC. PUNCU, KAB. KEDIRI'],
        ['npsn' => '20581123', 'school_name' => 'MTs NEGERI 7 KEDIRI', 'address' => 'JL. KEBONSARI NO.1 DS.KENCONG KEC. KEPUNG KAB. KEDIRI, KENCONG, KEC. KEPUNG, KAB. KEDIRI'],
        ['npsn' => '20581160', 'school_name' => 'MTs NEGERI 8 KEDIRI', 'address' => 'JL. JAYABAYA, MENANG, KEC. PAGU, KAB. KEDIRI'],
        ['npsn' => '70003655', 'school_name' => 'SMP AL HIKMAH KEPUNG', 'address' => 'JL. HARINJING NO. 120 DSN. PURWOREJO DS. KEPUNG, KEC. KEPUNG, KEPUNG, KEC. KEPUNG, KAB. KEDIRI'],
        ['npsn' => '20511898', 'school_name' => 'SMP NEGERI 1 KANDAT', 'address' => 'JL. RAYA DESA KANDAT, KANDAT, KEC. KANDAT, KAB. KEDIRI'],
        ['npsn' => '20511912', 'school_name' => 'SMP NEGERI 1 NGADILUWIH', 'address' => 'JL. PROF. DR. MOESTOPO NO. 30 NGADILUWIH, PURWOKERTO, KEC. NGADILUWIH, KAB. KEDIRI'],
        ['npsn' => '20511845', 'school_name' => 'SMP NEGERI 2 KANDAT', 'address' => 'JL. KELUD NO. 399, TEGALAN, KEC. KANDAT, KAB. KEDIRI'],
        ['npsn' => '20584938', 'school_name' => 'MTs NEGERI 1 TRENGGALEK', 'address' => 'BARAT TMP KARANGSOKO, KARANGSOKO, KEC. TRENGGALEK, KAB. TRENGGALEK'],
        ['npsn' => '20584931', 'school_name' => 'MTs NEGERI 2 TRENGGALEK', 'address' => 'JL.RAYA SUGIHAN KAMPAK TRENGGALEK, SUGIHAN, KEC. KAMPAK, KAB. TRENGGALEK'],
        ['npsn' => '20584933', 'school_name' => 'MTs NEGERI 3 TRENGGALEK', 'address' => 'RT.05 RW.01 DSN. KRAJAN, KEC. MUNJUNGAN, KAB. TRENGGALEK'],
        ['npsn' => '20584944', 'school_name' => 'MTs NEGERI 4 TRENGGALEK', 'address' => 'RT.30 RW.06, PRIGI, KEC. WATULIMO, KAB. TRENGGALEK'],
        ['npsn' => '20584966', 'school_name' => 'MTs DARUL HIKMAH', 'address' => 'JL. KH. ABU MANSUR I, TAWANGSARI, KEC. KEDUNGWARU, KAB. TULUNGAGUNG'],
        ['npsn' => '20584980', 'school_name' => 'MTs MANBA\'UL \'ULUM BUNTARAN', 'address' => 'JL. MASJID NO 29, BUNTARAN, KEC. REJOTANGAN, KAB. TULUNGAGUNG'],
        ['npsn' => '20584953', 'school_name' => 'MTs NEGERI 1 TULUNGAGUNG', 'address' => 'JL. KI HAJAR DEWANTARA, BEJI, KEC. BOYOLANGU, KAB. TULUNGAGUNG'],
        ['npsn' => '20584958', 'school_name' => 'MTs NEGERI 2 TULUNGAGUNG', 'address' => 'JL. RAYA TANJUNG, KALIDAWIR, KEC. KALIDAWIR, KAB. TULUNGAGUNG'],
        ['npsn' => '20584975', 'school_name' => 'MTs NEGERI 3 TULUNGAGUNG', 'address' => 'JL. RAYA BLITAR, ARIYOJEDING, KEC. REJOTANGAN, KAB. TULUNGAGUNG'],
        ['npsn' => '20584947', 'school_name' => 'MTs NEGERI 4 TULUNGAGUNG', 'address' => 'DESA SURUHAN LOR, KECAMATAN BANDUNG, SURUHAN LOR, KEC. BANDUNG, KAB. TULUNGAGUNG'],
        ['npsn' => '20584969', 'school_name' => 'MTs NEGERI 5 TULUNGAGUNG', 'address' => 'JL. RAYA PULOSARI, PULOSARI, KEC. NGUNUT, KAB. TULUNGAGUNG'],
        ['npsn' => '20584961', 'school_name' => 'MTs NEGERI 6 TULUNGAGUNG', 'address' => 'JL DAHLIA NO. 36, KARANGREJO, KEC. KARANGREJO, KAB. TULUNGAGUNG'],
        ['npsn' => '20584967', 'school_name' => 'MTs NEGERI 7 TULUNGAGUNG', 'address' => 'PULEREJO, KEC. NGANTRU, KAB. TULUNGAGUNG'],
        ['npsn' => '20584974', 'school_name' => 'MTs NEGERI 8 TULUNGAGUNG', 'address' => 'JL. MASJID 8A SUMBERDADAP, SUMBERDADAP, KEC. PUCANG LABAN, KAB. TULUNGAGUNG'],
        ['npsn' => '70031909', 'school_name' => 'MTs NURUL HIDAYAH REJOTANGAN', 'address' => 'JL SAWUNGGALING TRT.002/RW.005, REJOTANGAN, KEC. REJOTANGAN, KAB. TULUNGAGUNG'],
        ['npsn' => '69880823', 'school_name' => 'SMP ISLAM AL FATTAHIYYAH', 'address' => 'DSN MIREN, NGRANTI, KEC. BOYOLANGU, KAB. TULUNGAGUNG'],
        ['npsn' => '20515520', 'school_name' => 'SMP ISLAM SUNAN GUNUNG JATI', 'address' => 'JL RAYA 1 GANG PDAM NGUNUT, NGUNUT, KEC. NGUNUT, KAB. TULUNGAGUNG'],
        ['npsn' => '20537274', 'school_name' => 'SMP NEGERI 1 NGANTRU', 'address' => 'JL. RAYA NGANTRU 142, NGANTRU, KEC. NGANTRU, KAB. TULUNGAGUNG'],
        ['npsn' => '20537276', 'school_name' => 'SMP NEGERI 1 REJOTANGAN', 'address' => 'JL. KANDUNG GG. I, REJOTANGAN, KEC. REJOTANGAN, KAB. TULUNGAGUNG'],
        ['npsn' => '20515486', 'school_name' => 'SMP NEGERI 2 NGANTRU', 'address' => 'JL. RAYA SRIKATON NGANTRU, SRIKATON, KEC. NGANTRU, KAB. TULUNGAGUNG'],
        ['npsn' => '69989738', 'school_name' => 'SMP PLUS AL FALAH', 'address' => 'DSN. PADANGAN, KARANGSARI, KEC. REJOTANGAN, KAB. TULUNGAGUNG'],
        ['npsn' => '69867921', 'school_name' => 'SMP RAUDLATUL MUSTHOFA', 'address' => 'JL. MASJID AL-FALAH PUNDENSARI REJOTANGAN, REJOTANGAN, KEC. REJOTANGAN, KAB. TULUNGAGUNG'],
        ['npsn' => '20514418', 'school_name' => 'SMP NEGERI 1 SELOPURO', 'address' => 'DSN. JATILUHUR, DS. JATITENGAH, KEC. SELOPURO, KAB. BLITAR'],
        ['npsn' => '20514422', 'school_name' => 'SMP NEGERI 1 NGLEGOK', 'address' => 'DESA DAYU, KEC. NGLEGOK, KAB. BLITAR'],
        ['npsn' => '20514411', 'school_name' => 'SMP NEGERI 1 WLINGI', 'address' => 'JL AHMAD YANI NO. 22, BERU, KEC. WLINGI, KAB. BLITAR'],
        ['npsn' => '20584999', 'school_name' => 'MTs DARUSSALAM', 'address' => 'JL. BIMA NO. 27 KADEMANGAN, KEC. KADEMANGAN, KAB. BLITAR'],
        ['npsn' => '20581163', 'school_name' => 'MTs ARRAHMAH', 'address' => 'JL. KH. HASYIM ASYARI NO.9, KEC. PAPAR, KAB. KEDIRI'],
        ['npsn' => '20581090', 'school_name' => 'MTs DARUL HUDA WLINGI', 'address' => 'JL GAJAH MADA NO 102 WLINGI BLITAR'],
        ['npsn' => '69991797', 'school_name' => 'SMP AL- HIKAM WANATANI', 'address' => 'Jl. KALISIRAH, NO.1 RT 01 RW 07, DS. SUMBERINGIN, KEC. SANANKULON'],
        ['npsn' => '70042150', 'school_name' => 'SMP TAHFIDZ INSAN MADANI', 'address' => 'JERUK 001/004 MANDESAN SELOPURO BLITAR'],
        ['npsn' => '70050562', 'school_name' => 'SMP DZIKRUL QUR`AN', 'address' => 'JL. KALIBRANTAS NO 79 D DAWUHAN KAUMAN KOTA BLITAR'],
        ['npsn' => '20518230', 'school_name' => 'SMP NEGERI 1 SRENGAT', 'address' => 'JL. RAYA SRENGAT NO. 103, SRENGAT, KAB. BLITAR'],
        ['npsn' => '70008416', 'school_name' => 'SMP NEGERI 3 GARUM', 'address' => 'DS. GARUM, KEC. GARUM, KAB. BLITAR'],
        ['npsn' => '20551738', 'school_name' => 'Upt Smp Negeri 1 Sanankulon', 'address' => 'Jl. Margomulyo Ds. Purworejo Kec. Sanankulon Kab. Blitar'],
    ];

    public function up(): void
    {
        DB::transaction(function () {
            $demoSchoolIds = School::query()->whereIn('npsn', self::DEMO_NPSNS)->pluck('id');

            if ($demoSchoolIds->isNotEmpty()) {
                // Akun sekolah demo (termasuk yang tidak lagi tertaut).
                $deletedUsers = User::query()
                    ->where(function ($query) use ($demoSchoolIds) {
                        $query->where(function ($inner) {
                            $inner->where('role', 'school')->whereIn('email', self::DEMO_USER_EMAILS);
                        })->orWhere(function ($inner) use ($demoSchoolIds) {
                            $inner->where('role', 'school')->whereIn('school_id', $demoSchoolIds);
                        });
                    })
                    ->delete();

                // Pendaftaran, peserta, dan nilai ikut terhapus lewat foreign key cascade.
                $deletedSchools = School::query()->whereIn('id', $demoSchoolIds)->delete();

                Log::info('Data demo dibersihkan', [
                    'schools' => $deletedSchools,
                    'school_users' => $deletedUsers,
                ]);
            }

            $created = 0;
            $updated = 0;

            foreach (self::SCHOOLS as $row) {
                $school = School::query()->firstOrNew(['npsn' => $row['npsn']]);

                $school->fill([
                    'school_name' => $row['school_name'],
                    'address' => $row['address'],
                ]);

                if (! $school->exists) {
                    $school->is_claimed = false;
                    $created++;
                } else {
                    $updated++;
                }

                $school->save();
            }

            Log::info('Impor sekolah resmi selesai', [
                'created' => $created,
                'updated' => $updated,
                'total' => count(self::SCHOOLS),
            ]);
        });
    }

    public function down(): void
    {
        //
    }
};
