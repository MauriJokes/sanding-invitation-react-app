export type Lang = "ms" | "en";

/**
 * Source of truth for UI copy. Keys marked "approved" were accepted by the owner in M1
 * (docs/UI_COPY.md); the rest are drafts awaiting the owner's proofreading.
 * TypeScript guarantees both languages define every key.
 */
export interface Strings {
  // RSVP: approved in M1
  rsvpHeading: string;
  rsvpLead: string;
  familyLabel: string;
  familyHint: string;
  phoneLabel: string;
  phoneHint: string;
  statusLabel: string;
  statusAttending: string;
  statusDeclined: string;
  countLabel: string;
  max: (n: number) => string;
  deadline: (date: string) => string;
  send: string;
  // RSVP: drafts
  checking: string;
  configFailed: string;
  retry: string;
  decrease: string;
  increase: string;
  sending: string;
  nameRequired: (min: number) => string;
  nameTooLong: (max: number) => string;
  nameInvalid: string;
  phoneRequired: string;
  phoneTooLong: (max: number) => string;
  phoneInvalid: string;
  errorDuplicate: string;
  errorDuplicateAfterRetry: string;
  errorLimitChanged: (n: number) => string;
  errorValidation: string;
  errorRateLimited: string;
  errorFailed: string;
  closedTitle: string;
  closedBody: string;
  successTitle: string;
  successAttending: string;
  successDeclined: string;
  successFinal: string;
  summaryFamily: string;
  summaryPhone: string;
  summaryAttendance: string;
  summaryCount: string;
  // Guestbook: approved in M1
  guestbookHeading: string;
  guestbookNameLabel: string;
  guestbookNameRequired: string;
  guestbookAnonymous: string;
  guestbookMessageLabel: string;
  guestbookAnonymousHint: string;
  guestbookSend: string;
  // Guestbook: drafts
  guestbookPublished: string;
  guestbookPrivate: string;
  guestbookMessageRequired: string;
  guestbookMessageTooLong: (max: number) => string;
  guestbookMessageInvalid: string;
  guestbookErrorFailed: string;
  guestbookListLabel: string;
  guestbookLoading: string;
  guestbookEmpty: string;
  guestbookLoadFailed: string;
  guestbookLead: string;
  guestbookOpen: string;
  guestbookDialogTitle: string;
  guestbookClose: string;
  guestbookPrev: string;
  guestbookNext: string;
  guestbookPause: string;
  guestbookPlay: string;
  guestbookSlideLabel: (position: number, total: number) => string;
  // Shell
  crashTitle: string;
  crashBody: string;
  crashReload: string;
  skipToContent: string;
  coverLabel: string;
  coverOpen: string;
  switchLanguageLabel: string;
  switchLanguageText: string;
  navLabel: string;
  navDetails: string;
  navRsvp: string;
  navLocation: string;
  navPrayer: string;
  navWishes: string;
  musicPlay: string;
  musicPause: string;
  musicUnavailable: string;
  detailsGreeting: string;
  detailsIntro: string;
  detailsInvite: string;
  detailsAnd: string;
  factDate: string;
  factItinerary: string;
  normalDate: string;
  islamicDate: string;
  factVenue: string;
  countdownHeading: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  countdownToday: string;
  countdownAfter: string;
  heroScroll: string;
  locationHeading: string;
  prayerHeading: string;
  prayerOpening: string;
  prayerBlessing: string;
  prayerUnion: string;
  prayerGuidance: string;
  prayerClosing: string;
  locationMapOpen: string;
  locationNewTab: string;
  locationCopy: string;
  locationCopied: string;
  locationCopyFailed: string;
  countdownLabel: (when: string) => string;
}

export const strings: Record<Lang, Strings> = {
  ms: {
    rsvpHeading: "RSVP",
    rsvpLead: "Sila isi borang RSVP di bawah.",
    familyLabel: "Nama Anda / Pasangan",
    familyHint: 'e.g. "Izyan Jaludin" atau "Izyan & Adam"',
    phoneLabel: "Nombor telefon",
    phoneHint: "e.g. +673 812 3456.",
    statusLabel: "Kehadiran",
    statusAttending: "Akan hadir",
    statusDeclined: "Tidak hadir",
    countLabel: "Jumlah kehadiran",
    max: (n) => `Maksimum ${n} orang.`,
    deadline: (date) => `RSVP ditutup pada ${date}.`,
    send: "Hantar RSVP",

    checking: "Menyemak…",
    configFailed:
      "Borang RSVP tidak dapat dimuatkan. Sila semak sambungan anda.",
    retry: "Cuba lagi",
    decrease: "Kurang",
    increase: "Tambah",
    sending: "Menghantar…",
    nameRequired: (min) =>
      `Sila masukkan nama anda / pasangan (sekurang-kurangnya ${min} aksara).`,
    nameTooLong: (max) => `Nama terlalu panjang (maksimum ${max} aksara).`,
    nameInvalid: "Nama mengandungi aksara yang tidak dibenarkan.",
    phoneRequired: "Sila masukkan nombor telefon anda.",
    phoneTooLong: (max) =>
      `Nombor telefon terlalu panjang (maksimum ${max} aksara).`,
    phoneInvalid:
      "Sila masukkan nombor telefon yang sah dengan kod negara, contohnya +673 812 3456.",
    errorDuplicate: "Satu RSVP untuk anda telah diterima.",
    errorDuplicateAfterRetry:
      "Penghantaran anda sebelum ini mungkin telah berjaya. Satu RSVP untuk anda telah diterima.",
    errorLimitChanged: (n) =>
      `Had telah dikemas kini kepada ${n} orang. Sila semak jumlah anda.`,
    errorValidation: "Sila semak jawapan anda.",
    errorRateLimited: "Terlalu banyak percubaan. Sila cuba lagi sebentar lagi.",
    errorFailed:
      "RSVP anda belum dihantar. Sila semak sambungan anda dan cuba lagi. Maklumat anda masih ada.",
    closedTitle: "RSVP telah ditutup.",
    closedBody:
      "Jika anda perlu membuat perubahan, sila hubungi Izyan dan Adam secara terus.",
    successTitle: "Terima kasih",
    successAttending:
      "RSVP anda untuk Majlis Perkahwinan Izyan dan Adam telah diterima.",
    successDeclined:
      "Terima kasih kerana memaklumkan kami. RSVP anda untuk Majlis Perkahwinan Izyan dan Adam telah diterima.",
    successFinal:
      "RSVP ini muktamad. Jika anda perlu membuat pembetulan, sila hubungi Izyan dan Adam secara terus.",
    summaryFamily: "Nama Anda / Pasangan",
    summaryPhone: "Nombor telefon",
    summaryAttendance: "Kehadiran",
    summaryCount: "Jumlah",

    guestbookHeading: "Ucapan",
    guestbookNameLabel: "Nama",
    guestbookNameRequired: "Sila masukkan nama anda.",
    guestbookAnonymous: "Hantar secara rahsia",
    guestbookMessageLabel: "Ucapan anda",
    guestbookAnonymousHint:
      "Ucapan tersebut hanya diterima oleh pasangan dan tidak akan dipaparkan di sini",
    guestbookSend: "Hantar Ucapan",
    guestbookPublished: "Terima kasih! Ucapan anda telah dipaparkan.",
    guestbookPrivate:
      "Terima kasih! Ucapan anda telah diterima dan hanya dilihat oleh pasangan.",
    guestbookMessageRequired: "Sila tulis ucapan anda.",
    guestbookMessageTooLong: (max) =>
      `Ucapan terlalu panjang (maksimum ${max} aksara).`,
    guestbookMessageInvalid: "Ucapan mengandungi aksara yang tidak dibenarkan.",
    guestbookErrorFailed:
      "Ucapan anda belum dihantar. Sila semak sambungan anda dan cuba lagi. Ucapan anda masih ada.",
    guestbookListLabel: "Ucapan daripada tetamu",
    guestbookLoading: "Memuatkan ucapan…",
    guestbookEmpty: "Belum ada ucapan. Jadilah yang pertama!",
    guestbookLoadFailed: "Ucapan tidak dapat dimuatkan.",
    guestbookLead:
      "Baca ucapan daripada keluarga dan sahabat, atau tinggalkan ucapan anda untuk kami.",
    guestbookOpen: "Tinggalkan Ucapan",
    guestbookDialogTitle: "Tinggalkan Ucapan Anda",
    guestbookClose: "Tutup",
    guestbookPrev: "Ucapan sebelumnya",
    guestbookNext: "Ucapan seterusnya",
    guestbookPause: "Jeda slaid",
    guestbookPlay: "Main slaid",
    guestbookSlideLabel: (position, total) =>
      `Ucapan ${position} daripada ${total}`,
    crashTitle: "Maaf, sesuatu tidak kena.",
    crashBody: "Halaman ini tidak dapat dipaparkan. Sila muat semula halaman.",
    crashReload: "Muat semula",
    skipToContent: "Langkau ke kandungan",
    coverLabel: "Muka depan jemputan",
    coverOpen: "Buka",
    switchLanguageLabel: "Switch language to English",
    switchLanguageText: "EN",
    navLabel: "Navigasi utama",
    navDetails: "Butiran",
    navRsvp: "RSVP",
    navLocation: "Lokasi",
    navPrayer: "Doa",
    navWishes: "Ucapan",
    musicPlay: "Mainkan muzik",
    musicPause: "Jeda muzik",
    musicUnavailable: "Muzik tidak tersedia",
    detailsGreeting: "Assalamualaikum WBT & Salam Sejahtera",
    detailsIntro: "Dengan izin Allah S.W.T dan rahmatnya, kami:",
    detailsInvite:
      "Dengan penuh hormat dan takzim sukacita menjunjung Pengiran berangkat / mempersilakan Pehin / Dato / Datin / Awang / Dayang / Tuan / Puan / Encik / Cik hadir ke Majlis Perkahwinan anakanda / kekanda abis peramba / kaola / kami:",
    detailsAnd: "dengan pilihan hatinya",
    factDate: "Tarikh",
    factItinerary: "Aturcara Majlis",
    normalDate: "Isnin, 28 Disember 2026M",
    islamicDate: "Bersamaan 18 Rejab 1448H",
    factVenue: "Tempat",
    countdownHeading: "Menanti Hari",
    countdownDays: "Hari",
    countdownHours: "Jam",
    countdownMinutes: "Minit",
    countdownSeconds: "Saat",
    countdownToday: "Hari ini hari bahagia kami.",
    countdownAfter: "Terima kasih kerana meraikan hari bahagia kami.",
    heroScroll: "Lihat butiran",
    locationHeading: "Lokasi",
    prayerHeading: "Doa untuk Pengantin",
    prayerOpening: "Bismillahirrahmanirrahim",
    prayerBlessing:
      "Ya Allah, Ya Rahim, dari setinggi dan seluas kasih sayang-Mu kepada pengantin suami isteri, berkatilah majlis yang diadakan dengan keberkatan dari permulaan hingga pengakhirannya.",
    prayerUnion:
      "Sesungguhnya pertemuan ini adalah dengan izin-Mu. Mudah-mudahan perkongsian hidup yang dibina berkekalan hingga ke akhir usia.",
    prayerGuidance:
      "Dengan taufik dan hidayah-Mu, beruntunglah keduanya dalam kehidupan di dunia lebih-lebih lagi di akhirat.",
    prayerClosing: "Aamiin Ya Rabbal 'Alamin",
    locationMapOpen: "Buka di Peta",
    locationNewTab: "(dibuka di tab baharu)",
    locationCopy: "Salin alamat",
    locationCopied: "Alamat disalin.",
    locationCopyFailed: "Alamat tidak dapat disalin. Sila salin secara manual.",
    countdownLabel: (when) => `Kiraan detik ke ${when}`,
  },
  en: {
    rsvpHeading: "RSVP",
    rsvpLead: "Please fill out the RSVP form below.",
    familyLabel: "Your name / partner's name",
    familyHint: 'e.g. "Izyan Jaludin" or "Izyan and Adam"',
    phoneLabel: "Phone number",
    phoneHint: "e.g. +673 812 3456.",
    statusLabel: "Attendance",
    statusAttending: "Attending",
    statusDeclined: "Not attending",
    countLabel: "Total attendees",
    max: (n) => `Maximum ${n} people.`,
    deadline: (date) => `RSVP closes on ${date}.`,
    send: "Send RSVP",

    checking: "Checking…",
    configFailed:
      "The RSVP form could not be loaded. Please check your connection.",
    retry: "Try again",
    decrease: "Decrease",
    increase: "Increase",
    sending: "Sending…",
    nameRequired: (min) =>
      `Please enter your name / your partner's name (at least ${min} characters).`,
    nameTooLong: (max) => `The name is too long (maximum ${max} characters).`,
    nameInvalid: "The name contains characters that are not allowed.",
    phoneRequired: "Please enter your phone number.",
    phoneTooLong: (max) =>
      `The phone number is too long (maximum ${max} characters).`,
    phoneInvalid:
      "Please enter a valid phone number with the country code, e.g. +673 812 3456.",
    errorDuplicate: "An RSVP for this name has already been received.",
    errorDuplicateAfterRetry:
      "Your earlier submission may have gone through. An RSVP for this name has already been received.",
    errorLimitChanged: (n) =>
      `The limit has been updated to ${n} people. Please check your total.`,
    errorValidation: "Please check your responses.",
    errorRateLimited: "Too many attempts. Please try again in a little while.",
    errorFailed:
      "Your RSVP has not been sent. Please check your connection and try again. Your details are still here.",
    closedTitle: "RSVP is now closed.",
    closedBody:
      "If you need to make a change, please contact Izyan and Adam directly.",
    successTitle: "Thank you",
    successAttending:
      "Your RSVP for Izyan and Adam's Wedding Ceremony has been received.",
    successDeclined:
      "Thank you for letting us know. Your RSVP for Izyan and Adam's Wedding Ceremony has been received.",
    successFinal:
      "This RSVP is final. If you need to make a correction, please contact Izyan and Adam directly.",
    summaryFamily: "Your name / partner's name",
    summaryPhone: "Phone number",
    summaryAttendance: "Attendance",
    summaryCount: "Total",

    guestbookHeading: "Wishes",
    guestbookNameLabel: "Name",
    guestbookNameRequired: "Please enter your name.",
    guestbookAnonymous: "Send privately",
    guestbookMessageLabel: "Your wishes",
    guestbookAnonymousHint:
      "Private wishes are seen only by the couple and are not displayed here.",
    guestbookSend: "Send Wishes",
    guestbookPublished: "Thank you! Your wish is now displayed.",
    guestbookPrivate:
      "Thank you! Your wish has been received and will be seen only by the couple.",
    guestbookMessageRequired: "Please write your wish.",
    guestbookMessageTooLong: (max) =>
      `Your message is too long (maximum ${max} characters).`,
    guestbookMessageInvalid:
      "Your message contains characters that are not allowed.",
    guestbookErrorFailed:
      "Your wish has not been sent. Please check your connection and try again. Your message is still here.",
    guestbookListLabel: "Wishes from guests",
    guestbookLoading: "Loading wishes…",
    guestbookEmpty: "No wishes yet. Be the first!",
    guestbookLoadFailed: "Wishes could not be loaded.",
    guestbookLead:
      "Read the wishes from family and friends, or leave a message of your own for us.",
    guestbookOpen: "Leave a Wish",
    guestbookDialogTitle: "Leave Your Wishes",
    guestbookClose: "Close",
    guestbookPrev: "Previous wish",
    guestbookNext: "Next wish",
    guestbookPause: "Pause slides",
    guestbookPlay: "Play slides",
    guestbookSlideLabel: (position, total) => `Wish ${position} of ${total}`,
    crashTitle: "Sorry, something went wrong.",
    crashBody: "This page could not be shown. Please reload the page.",
    crashReload: "Reload",
    skipToContent: "Skip to content",
    coverLabel: "Invitation cover",
    coverOpen: "Open",
    switchLanguageLabel: "Tukar bahasa ke Bahasa Melayu",
    switchLanguageText: "BM",
    navLabel: "Main navigation",
    navDetails: "Details",
    navRsvp: "RSVP",
    navLocation: "Location",
    navPrayer: "Prayer",
    navWishes: "Wishes",
    musicPlay: "Play music",
    musicPause: "Pause music",
    musicUnavailable: "Music unavailable",
    detailsGreeting: "Assalamualaikum WBT & Salam Sejahtera",
    detailsIntro: "By the grace and blessings of Allah S.W.T, we",
    detailsInvite:
      "With utmost respect and honor, we humbly invite Pehin / Dato / Datin / Awang / Dayang / Sir / Madam / Mr / Ms to attend the Wedding Ceremony of our beloved children:",
    detailsAnd: "and her love",
    factDate: "Date",
    factItinerary: "Itinerary",
    normalDate: "Monday, 28 December 2026",
    islamicDate: "18 Rejab 1448H",
    factVenue: "Venue",
    countdownHeading: "Counting Down",
    countdownDays: "Days",
    countdownHours: "Hours",
    countdownMinutes: "Minutes",
    countdownSeconds: "Seconds",
    countdownToday: "Today is our special day.",
    countdownAfter: "Thank you for celebrating our special day with us.",
    heroScroll: "View details",
    locationHeading: "Location",
    prayerHeading: "Prayer for the Newlyweds",
    prayerOpening: "Bismillahirrahmanirrahim",
    prayerBlessing:
      "O Allah, the Most Merciful, in Your boundless love for this husband and wife, bless this celebration from its beginning to its end.",
    prayerUnion:
      "Truly, this union is by Your permission. May the life they build together endure to the end of their days.",
    prayerGuidance:
      "Through Your help and guidance, may they both prosper in this world and, above all, in the Hereafter.",
    prayerClosing: "Aamiin Ya Rabbal 'Alamin",
    locationMapOpen: "Open in Maps",
    locationNewTab: "(opens in a new tab)",
    locationCopy: "Copy address",
    locationCopied: "Address copied.",
    locationCopyFailed:
      "The address could not be copied. Please copy it manually.",
    countdownLabel: (when) => `Countdown to ${when}`,
  },
};

export const LOCALES: Record<Lang, string> = { ms: "ms", en: "en-GB" };
