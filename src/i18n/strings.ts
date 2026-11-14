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
  statusLabel: string;
  statusAttending: string;
  statusDeclined: string;
  countLabel: string;
  max: (n: number) => string;
  deadline: (date: string) => string;
  send: string;
  // RSVP: drafts
  scopeNote: string;
  checking: string;
  configFailed: string;
  retry: string;
  decrease: string;
  increase: string;
  sending: string;
  nameRequired: (min: number) => string;
  nameTooLong: (max: number) => string;
  nameInvalid: string;
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
  summaryAttendance: string;
  summaryCount: string;
  // Shell
  skipToContent: string;
  switchLanguageLabel: string;
  switchLanguageText: string;
}

export const strings: Record<Lang, Strings> = {
  ms: {
    rsvpHeading: "RSVP",
    rsvpLead: "Satu RSVP untuk seluruh keluarga / kumpulan anda.",
    familyLabel: "Nama keluarga / kumpulan",
    familyHint: "Gunakan nama yang sama untuk seluruh keluarga anda.",
    statusLabel: "Kehadiran",
    statusAttending: "Akan hadir",
    statusDeclined: "Tidak dapat hadir",
    countLabel: "Jumlah kehadiran",
    max: (n) => `Maksimum ${n} orang.`,
    deadline: (date) => `RSVP ditutup pada ${date}.`,
    send: "Send RSVP",

    scopeNote: "RSVP ini untuk majlis Walimatulurus sahaja.",
    checking: "Menyemak…",
    configFailed: "Borang RSVP tidak dapat dimuatkan. Sila semak sambungan anda.",
    retry: "Cuba lagi",
    decrease: "Kurang",
    increase: "Tambah",
    sending: "Menghantar…",
    nameRequired: (min) => `Sila masukkan nama keluarga / kumpulan (sekurang-kurangnya ${min} aksara).`,
    nameTooLong: (max) => `Nama terlalu panjang (maksimum ${max} aksara).`,
    nameInvalid: "Nama mengandungi aksara yang tidak dibenarkan.",
    errorDuplicate: "Satu RSVP untuk keluarga / kumpulan ini telah diterima.",
    errorDuplicateAfterRetry:
      "Penghantaran anda sebelum ini mungkin telah berjaya. Satu RSVP untuk keluarga / kumpulan ini telah diterima.",
    errorLimitChanged: (n) => `Had telah dikemas kini kepada ${n} orang. Sila semak jumlah anda.`,
    errorValidation: "Sila semak jawapan anda.",
    errorRateLimited: "Terlalu banyak percubaan. Sila cuba lagi sebentar lagi.",
    errorFailed: "RSVP anda belum dihantar. Sila semak sambungan anda dan cuba lagi. Maklumat anda masih ada.",
    closedTitle: "RSVP telah ditutup.",
    closedBody: "Jika anda perlu membuat perubahan, sila hubungi pasangan secara terus.",
    successTitle: "Terima kasih",
    successAttending: "RSVP anda untuk majlis Walimatulurus telah diterima.",
    successDeclined: "Terima kasih kerana memaklumkan kami. RSVP anda untuk majlis Walimatulurus telah diterima.",
    successFinal: "RSVP ini muktamad. Jika anda perlu membuat pembetulan, sila hubungi pasangan secara terus.",
    summaryFamily: "Keluarga / kumpulan",
    summaryAttendance: "Kehadiran",
    summaryCount: "Jumlah",

    skipToContent: "Langkau ke kandungan",
    switchLanguageLabel: "Switch language to English",
    switchLanguageText: "EN",
  },
  en: {
    rsvpHeading: "RSVP",
    rsvpLead: "One RSVP for your whole family / group.",
    familyLabel: "Family / group name",
    familyHint: "Please use the same name for your whole family.",
    statusLabel: "Attendance",
    statusAttending: "Attending",
    statusDeclined: "Unable to attend",
    countLabel: "Total attendees",
    max: (n) => `Maximum ${n} people.`,
    deadline: (date) => `RSVP closes on ${date}.`,
    send: "Send RSVP",

    scopeNote: "This RSVP is for the Walimatulurus celebration only.",
    checking: "Checking…",
    configFailed: "The RSVP form could not be loaded. Please check your connection.",
    retry: "Try again",
    decrease: "Decrease",
    increase: "Increase",
    sending: "Sending…",
    nameRequired: (min) => `Please enter your family / group name (at least ${min} characters).`,
    nameTooLong: (max) => `The name is too long (maximum ${max} characters).`,
    nameInvalid: "The name contains characters that are not allowed.",
    errorDuplicate: "An RSVP for this family/group has already been received.",
    errorDuplicateAfterRetry:
      "Your earlier submission may have gone through. An RSVP for this family/group has already been received.",
    errorLimitChanged: (n) => `The limit has been updated to ${n} people. Please check your total.`,
    errorValidation: "Please check your responses.",
    errorRateLimited: "Too many attempts. Please try again in a little while.",
    errorFailed: "Your RSVP has not been sent. Please check your connection and try again. Your details are still here.",
    closedTitle: "RSVP is now closed.",
    closedBody: "If you need to make a change, please contact the couple directly.",
    successTitle: "Thank you",
    successAttending: "Your RSVP for the Walimatulurus celebration has been received.",
    successDeclined: "Thank you for letting us know. Your RSVP for the Walimatulurus celebration has been received.",
    successFinal: "This RSVP is final. If you need to make a correction, please contact the couple directly.",
    summaryFamily: "Family / group",
    summaryAttendance: "Attendance",
    summaryCount: "Total",

    skipToContent: "Skip to content",
    switchLanguageLabel: "Tukar bahasa ke Bahasa Melayu",
    switchLanguageText: "BM",
  },
};

export const LOCALES: Record<Lang, string> = { ms: "ms", en: "en-GB" };
