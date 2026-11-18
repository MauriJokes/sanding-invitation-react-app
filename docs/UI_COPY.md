# Approved UI Copy (draft strings accepted by owner)

Malay is the default language; English is the toggle. These strings were accepted by the owner during M1 ("translations seem fine"). `{n}` is the attendee limit. Invitation body copy (host names, dress code source) lives in `WEDDING_CONTENT.md` and `WEDDING_CONTENT_INFO/`.

The first table is the M1 prototype copy and is kept for history. The second table mirrors `src/i18n/strings.ts`, which now holds everything the site shows (gate, navigation, music, details, countdown, location, RSVP including the phone number, and the guestbook slider and pop-up). Rows marked "owner-edited (M6)" were rewritten by the owner directly in `strings.ts`; rows marked "draft" still need the owner's proofreading. The owner's invitation and itinerary wording is in `src/features/details/content.ts`.

| Key | Bahasa Melayu | English |
|---|---|---|
| `event` | Walimatulurus | Walimatulurus |
| `coverDate` | 28 Disember 2026 | 28 December 2026 |
| `open` | Buka | Open |
| `nDetails` | Butiran | Details |
| `nLocation` | Lokasi | Location |
| `nWishes` | Ucapan | Wishes |
| `heroDate` | Isnin, 28 Disember 2026 | Monday, 28 December 2026 |
| `scroll` | Lihat butiran | View details |
| `greet` | Assalamualaikum WBT & Salam Sejahtera | Assalamualaikum WBT & Salam Sejahtera |
| `inviteText` | Dengan segala hormat dan takzim sukacita menjunjung Pengiran berangkat / mempersilakan Pehin / Tan Sri / Puan Sri / Dato / Datin / Awang / Dayang / Tuan / Puan / Encik dan Cik untuk hadir ke Majlis Walimatulurus anakanda kami: | With utmost respect and honor, we humbly invite Pengiran / Pehin / Tan Sri / Puan Sri / Dato / Datin / Sir / Madam / Mr / Ms to attend the walimatulurus of our beloved children: |
| `fDate` | Tarikh | Date |
| `fTime` | Ketibaan Tetamu | Guest Arrival |
| `fTimeV` | 7.15 malam | 7:15 PM |
| `fPlace` | Tempat | Venue |
| `cdT` | Menanti Hari | Counting Down |
| `cdD` | Hari | Days |
| `cdH` | Jam | Hours |
| `cdM` | Minit | Minutes |
| `cdS` | Saat | Seconds |
| `rsvpLead` | Satu RSVP untuk seluruh keluarga / kumpulan anda. | One RSVP for your whole family / group. |
| `famL` | Nama keluarga / kumpulan | Family / group name |
| `famH` | Gunakan nama yang sama untuk seluruh keluarga anda. | Please use the same name for your whole family. |
| `statL` | Kehadiran | Attendance |
| `stYes` | Akan hadir | Attending |
| `stNo` | Tidak dapat hadir | Unable to attend |
| `cntL` | Jumlah kehadiran | Total attendees |
| `dlT` | RSVP ditutup pada 20 Disember 2026. | RSVP closes on 20 December 2026. |
| `send` | Send RSVP | Send RSVP |
| `rsvpOk` | Terima kasih. RSVP anda telah diterima. | Thank you. Your RSVP has been received. |
| `locT` | Lokasi | Location |
| `map` | Buka di Peta | Open in Maps |
| `copy` | Salin alamat | Copy address |
| `copiedMsg` | Alamat disalin. | Address copied. |
| `gbT` | Ucapan | Wishes |
| `gName` | Nama (pilihan) | Name (optional) |
| `anon` | Hantar tanpa nama | Send anonymously |
| `gMsg` | Ucapan anda | Your wishes |
| `anonH` | Ucapan tanpa nama hanya dilihat oleh pasangan dan tidak dipaparkan di sini. | Anonymous wishes are seen only by the couple and are not displayed here. |
| `gSend` | Hantar Ucapan | Send Wishes |
| `sample` | Contoh paparan (bukan ucapan sebenar) | Sample layout (not real wishes) |
| `max` | Maksimum {n} orang. | Maximum {n} people. |

## RSVP, guestbook and shell strings (M4, M5)

Source of truth: `src/i18n/strings.ts` (TypeScript enforces that both languages define every key; this table mirrors it for proofreading). "approved (M1)" strings were accepted from the prototype; **drafts need the owner's proofreading**. `{n}`, `{max}`, `{date}`, `{position}` and `{total}` are filled in by the app. The deadline date is formatted from the configured deadline in venue time.

| Key | Bahasa Melayu | English | Status |
|---|---|---|---|
| `rsvpHeading` | RSVP | RSVP | approved (M1) |
| `rsvpLead` | Sila isi borang RSVP di bawah. | Please fill out the RSVP form below. | owner-edited (M6) |
| `familyLabel` | Nama Anda / Pasangan | Your name / partner's name | owner-edited (M6) |
| `familyHint` | e.g. "Izyan Jaludin" atau "Izyan & Adam" | e.g. "Izyan Jaludin" or "Izyan and Adam" | owner-edited (M6) |
| `phoneLabel` | Nombor telefon | Phone number | draft |
| `phoneHint` | e.g. +673 812 3456. | e.g. +673 812 3456. | draft |
| `statusLabel` | Kehadiran | Attendance | approved (M1) |
| `statusAttending` | Akan hadir | Attending | approved (M1) |
| `statusDeclined` | Tidak hadir | Not attending | owner-edited (M6) |
| `countLabel` | Jumlah kehadiran | Total attendees | approved (M1) |
| `max` | Maksimum {n} orang. | Maximum {n} people. | approved (M1) |
| `deadline` | RSVP ditutup pada {date}. | RSVP closes on {date}. | approved (M1) |
| `send` | Hantar RSVP | Send RSVP | owner-edited (M6) |
| `checking` | Menyemak… | Checking… | draft |
| `configFailed` | Borang RSVP tidak dapat dimuatkan. Sila semak sambungan anda. | The RSVP form could not be loaded. Please check your connection. | draft |
| `retry` | Cuba lagi | Try again | draft |
| `decrease` | Kurang | Decrease | draft |
| `increase` | Tambah | Increase | draft |
| `sending` | Menghantar… | Sending… | draft |
| `nameRequired` | Sila masukkan nama anda / pasangan (sekurang-kurangnya {n} aksara). | Please enter your name / your partner's name (at least {n} characters). | owner-edited (M6) |
| `nameTooLong` | Nama terlalu panjang (maksimum {max} aksara). | The name is too long (maximum {max} characters). | draft |
| `nameInvalid` | Nama mengandungi aksara yang tidak dibenarkan. | The name contains characters that are not allowed. | draft |
| `phoneRequired` | Sila masukkan nombor telefon anda. | Please enter your phone number. | draft |
| `phoneTooLong` | Nombor telefon terlalu panjang (maksimum {n} aksara). | The phone number is too long (maximum {n} characters). | draft |
| `phoneInvalid` | Sila masukkan nombor telefon yang sah dengan kod negara, contohnya +673 812 3456. | Please enter a valid phone number with the country code, e.g. +673 812 3456. | draft |
| `errorDuplicate` | Satu RSVP untuk anda telah diterima. | An RSVP for this name has already been received. | owner-edited (M6) |
| `errorDuplicateAfterRetry` | Penghantaran anda sebelum ini mungkin telah berjaya. Satu RSVP untuk anda telah diterima. | Your earlier submission may have gone through. An RSVP for this name has already been received. | owner-edited (M6) |
| `errorLimitChanged` | Had telah dikemas kini kepada {n} orang. Sila semak jumlah anda. | The limit has been updated to {n} people. Please check your total. | draft |
| `errorValidation` | Sila semak jawapan anda. | Please check your responses. | draft |
| `errorRateLimited` | Terlalu banyak percubaan. Sila cuba lagi sebentar lagi. | Too many attempts. Please try again in a little while. | draft |
| `errorFailed` | RSVP anda belum dihantar. Sila semak sambungan anda dan cuba lagi. Maklumat anda masih ada. | Your RSVP has not been sent. Please check your connection and try again. Your details are still here. | draft |
| `closedTitle` | RSVP telah ditutup. | RSVP is now closed. | draft |
| `closedBody` | Jika anda perlu membuat perubahan, sila hubungi Izyan dan Adam secara terus. | If you need to make a change, please contact Izyan and Adam directly. | owner-edited (M6) |
| `successTitle` | Terima kasih | Thank you | draft |
| `successAttending` | RSVP anda untuk Majlis Perkahwinan Izyan dan Adam telah diterima. | Your RSVP for Izyan and Adam's Wedding Ceremony has been received. | owner-edited (M6) |
| `successDeclined` | Terima kasih kerana memaklumkan kami. RSVP anda untuk Majlis Perkahwinan Izyan dan Adam telah diterima. | Thank you for letting us know. Your RSVP for Izyan and Adam's Wedding Ceremony has been received. | owner-edited (M6) |
| `successFinal` | RSVP ini muktamad. Jika anda perlu membuat pembetulan, sila hubungi Izyan dan Adam secara terus. | This RSVP is final. If you need to make a correction, please contact Izyan and Adam directly. | owner-edited (M6) |
| `summaryFamily` | Nama Anda / Pasangan | Your name / partner's name | owner-edited (M6) |
| `summaryPhone` | Nombor telefon | Phone number | draft |
| `summaryAttendance` | Kehadiran | Attendance | draft |
| `summaryCount` | Jumlah | Total | draft |
| `guestbookHeading` | Ucapan | Wishes | approved (M1) |
| `guestbookNameLabel` | Nama | Name | draft |
| `guestbookNameRequired` | Sila masukkan nama anda. | Please enter your name. | draft |
| `guestbookAnonymous` | Hantar secara rahsia | Send privately | owner-edited (M6) |
| `guestbookMessageLabel` | Ucapan anda | Your wishes | approved (M1) |
| `guestbookAnonymousHint` | Ucapan tersebut hanya diterima oleh pasangan dan tidak akan dipaparkan di sini | Private wishes are seen only by the couple and are not displayed here. | owner-edited (M6) |
| `guestbookSend` | Hantar Ucapan | Send Wishes | approved (M1) |
| `guestbookPublished` | Terima kasih! Ucapan anda telah dipaparkan. | Thank you! Your wish is now displayed. | draft |
| `guestbookPrivate` | Terima kasih! Ucapan anda telah diterima dan hanya dilihat oleh pasangan. | Thank you! Your wish has been received and will be seen only by the couple. | draft |
| `guestbookMessageRequired` | Sila tulis ucapan anda. | Please write your wish. | draft |
| `guestbookMessageTooLong` | Ucapan terlalu panjang (maksimum {max} aksara). | Your message is too long (maximum {max} characters). | draft |
| `guestbookMessageInvalid` | Ucapan mengandungi aksara yang tidak dibenarkan. | Your message contains characters that are not allowed. | draft |
| `guestbookErrorFailed` | Ucapan anda belum dihantar. Sila semak sambungan anda dan cuba lagi. Ucapan anda masih ada. | Your wish has not been sent. Please check your connection and try again. Your message is still here. | draft |
| `guestbookListLabel` | Ucapan daripada tetamu | Wishes from guests | draft |
| `guestbookLoading` | Memuatkan ucapan… | Loading wishes… | draft |
| `guestbookEmpty` | Belum ada ucapan. Jadilah yang pertama! | No wishes yet. Be the first! | draft |
| `guestbookLoadFailed` | Ucapan tidak dapat dimuatkan. | Wishes could not be loaded. | draft |
| `guestbookLead` | Baca ucapan daripada keluarga dan sahabat, atau tinggalkan ucapan anda untuk kami. | Read the wishes from family and friends, or leave a message of your own for us. | draft |
| `guestbookOpen` | Tinggalkan Ucapan | Leave a Wish | draft |
| `guestbookDialogTitle` | Tinggalkan Ucapan Anda | Leave Your Wishes | draft |
| `guestbookClose` | Tutup | Close | draft |
| `guestbookPrev` | Ucapan sebelumnya | Previous wish | draft |
| `guestbookNext` | Ucapan seterusnya | Next wish | draft |
| `guestbookPause` | Jeda slaid | Pause slides | draft |
| `guestbookPlay` | Main slaid | Play slides | draft |
| `guestbookSlideLabel` | Ucapan {position} daripada {total} | Wish {position} of {total} | draft |
| `crashTitle` | Maaf, sesuatu tidak kena. | Sorry, something went wrong. | draft |
| `crashBody` | Halaman ini tidak dapat dipaparkan. Sila muat semula halaman. | This page could not be shown. Please reload the page. | draft |
| `crashReload` | Muat semula | Reload | draft |
| `skipToContent` | Langkau ke kandungan | Skip to content | draft |
| `coverLabel` | Muka depan jemputan | Invitation cover | draft |
| `coverOpen` | Buka | Open | approved (M1, `open`) |
| `switchLanguageLabel` | Switch language to English | Tukar bahasa ke Bahasa Melayu | draft |
| `switchLanguageText` | EN | BM | draft |
| `navLabel` | Navigasi utama | Main navigation | draft |
| `navDetails` | Butiran | Details | approved (M1, `nDetails`) |
| `navRsvp` | RSVP | RSVP | approved (M1) |
| `navLocation` | Lokasi | Location | approved (M1, `nLocation`) |
| `navPrayer` | Doa | Prayer | replaces standalone location nav (2026-11-17) |
| `navWishes` | Ucapan | Wishes | approved (M1, `nWishes`) |
| `musicPlay` | Mainkan muzik | Play music | draft |
| `musicPause` | Jeda muzik | Pause music | draft |
| `musicUnavailable` | Muzik tidak tersedia | Music unavailable | draft |
| `detailsGreeting` | Assalamualaikum WBT & Salam Sejahtera | Assalamualaikum WBT & Salam Sejahtera | approved (source) |
| `detailsIntro` | Dengan izin Allah S.W.T dan rahmatnya, kami: | By the grace and blessings of Allah S.W.T, we | approved (source) |
| `detailsInvite` | Dengan penuh hormat dan takzim sukacita menjunjung Pengiran berangkat / mempersilakan Pehin / Dato / Datin / Awang / Dayang / Tuan / Puan / Encik / Cik hadir ke Majlis Perkahwinan anakanda / kekanda abis peramba / kaola / kami: | With utmost respect and honor, we humbly invite Pehin / Dato / Datin / Awang / Dayang / Sir / Madam / Mr / Ms to attend the Wedding Ceremony of our beloved children: | owner-edited (M6) |
| `detailsAnd` | dengan penuh hatinya | and | draft |
| `factDate` | Tarikh | Date | draft |
| `factItinerary` | Aturcara Majlis | Itinerary | draft |
| `normalDate` | Isnin, 28 Disember 2026M | Monday, 28 December 2026 | draft |
| `islamicDate` | Bersamaan 18 Rejab 1448H | 18 Rejab 1448H | draft |
| `factVenue` | Tempat | Venue | draft |
| `countdownHeading` | Menanti Hari | Counting Down | approved (M1, `cdT`) |
| `countdownDays` | Hari | Days | draft |
| `countdownHours` | Jam | Hours | draft |
| `countdownMinutes` | Minit | Minutes | draft |
| `countdownSeconds` | Saat | Seconds | draft |
| `countdownToday` | Hari ini hari bahagia kami. | Today is our special day. | draft |
| `countdownAfter` | Terima kasih kerana meraikan hari bahagia kami. | Thank you for celebrating our special day with us. | draft |
| `heroScroll` | Lihat butiran | View details | approved (M1, `scroll`) |
| `locationHeading` | Lokasi | Location | approved (M1, `locT`) |
| `prayerHeading` | Doa untuk Pengantin | Prayer for the Newlyweds | supplied reference |
| `prayerOpening` | Bismillahirrahmanirrahim | Bismillahirrahmanirrahim | text placeholder for owner asset |
| `prayerBlessing` | Ya Allah, Ya Rahim, dari setinggi dan seluas kasih sayang-Mu kepada pengantin suami isteri, berkatilah majlis yang diadakan dengan keberkatan dari permulaan hingga pengakhirannya. | O Allah, the Most Merciful, in Your boundless love for this husband and wife, bless this celebration from its beginning to its end. | supplied reference; English draft |
| `prayerUnion` | Sesungguhnya pertemuan ini adalah dengan izin-Mu. Mudah-mudahan perkongsian hidup yang dibina berkekalan hingga ke akhir usia. | Truly, this union is by Your permission. May the life they build together endure to the end of their days. | supplied reference; English draft |
| `prayerGuidance` | Dengan taufik dan hidayah-Mu, beruntunglah keduanya dalam kehidupan di dunia lebih-lebih lagi di akhirat. | Through Your help and guidance, may they both prosper in this world and, above all, in the Hereafter. | supplied reference; English draft |
| `prayerClosing` | Aamiin Ya Rabbal 'Alamin | Aamiin Ya Rabbal 'Alamin | text placeholder for owner asset |
| `locationMapOpen` | Buka di Peta | Open in Maps | approved (M1, `map`) |
| `locationNewTab` | (dibuka di tab baharu) | (opens in a new tab) | draft (screen-reader only) |
| `locationCopy` | Salin alamat | Copy address | approved (M1, `copy`) |
| `locationCopied` | Alamat disalin. | Address copied. | approved (M1, `copiedMsg`) |
| `locationCopyFailed` | Alamat tidak dapat disalin. Sila salin secara manual. | The address could not be copied. Please copy it manually. | draft |
| `countdownLabel` | Kiraan detik ke {n} | Countdown to {n} | owner-edited (M6) |
