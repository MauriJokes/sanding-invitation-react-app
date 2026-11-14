# Approved UI Copy (draft strings accepted by owner)

Malay is the default language; English is the toggle. These strings were accepted by the owner during M1 ("translations seem fine"). `{n}` is the attendee limit. Invitation body copy (host names, dress code source) lives in `WEDDING_CONTENT.md` and `WEDDING_CONTENT_INFO/`.

Not yet written (add and have the owner proofread in M6): music button labels, navigation, gate, countdown and location. The RSVP and guestbook strings are in the second table below.

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
| `dressT` | Pakaian | Dress Code |
| `dress1` | Baju Melayu untuk lelaki dan Baju Kurung untuk wanita dalam warna burgundy. | Baju Melayu for gentlemen and Baju Kurung for ladies in burgundy. |
| `dress2` | Baju Melayu untuk lelaki dan Baju Kurung untuk wanita dalam warna biru navy. | Baju Melayu for gentlemen and Baju Kurung for ladies in navy blue. |
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

Source of truth: `src/i18n/strings.ts` (TypeScript enforces that both languages define every key; this table mirrors it for proofreading). "approved (M1)" strings were accepted from the prototype; **drafts need the owner's proofreading**. `{n}`, `{max}` and `{date}` are filled in by the app. The deadline date is formatted from the configured deadline in venue time.

| Key | Bahasa Melayu | English | Status |
|---|---|---|---|
| `rsvpHeading` | RSVP | RSVP | approved (M1) |
| `rsvpLead` | Satu RSVP untuk seluruh keluarga / kumpulan anda. | One RSVP for your whole family / group. | approved (M1) |
| `familyLabel` | Nama keluarga / kumpulan | Family / group name | approved (M1) |
| `familyHint` | Gunakan nama yang sama untuk seluruh keluarga anda. | Please use the same name for your whole family. | approved (M1) |
| `statusLabel` | Kehadiran | Attendance | approved (M1) |
| `statusAttending` | Akan hadir | Attending | approved (M1) |
| `statusDeclined` | Tidak dapat hadir | Unable to attend | approved (M1) |
| `countLabel` | Jumlah kehadiran | Total attendees | approved (M1) |
| `max` | Maksimum {n} orang. | Maximum {n} people. | approved (M1) |
| `deadline` | RSVP ditutup pada {date}. | RSVP closes on {date}. | approved (M1) |
| `send` | Send RSVP | Send RSVP | approved (M1) |
| `scopeNote` | RSVP ini untuk majlis Walimatulurus sahaja. | This RSVP is for the Walimatulurus celebration only. | draft |
| `checking` | Menyemak… | Checking… | draft |
| `configFailed` | Borang RSVP tidak dapat dimuatkan. Sila semak sambungan anda. | The RSVP form could not be loaded. Please check your connection. | draft |
| `retry` | Cuba lagi | Try again | draft |
| `decrease` | Kurang | Decrease | draft |
| `increase` | Tambah | Increase | draft |
| `sending` | Menghantar… | Sending… | draft |
| `nameRequired` | Sila masukkan nama keluarga / kumpulan (sekurang-kurangnya 2 aksara). | Please enter your family / group name (at least 2 characters). | draft |
| `nameTooLong` | Nama terlalu panjang (maksimum {max} aksara). | The name is too long (maximum {max} characters). | draft |
| `nameInvalid` | Nama mengandungi aksara yang tidak dibenarkan. | The name contains characters that are not allowed. | draft |
| `errorDuplicate` | Satu RSVP untuk keluarga / kumpulan ini telah diterima. | An RSVP for this family/group has already been received. | draft |
| `errorDuplicateAfterRetry` | Penghantaran anda sebelum ini mungkin telah berjaya. Satu RSVP untuk keluarga / kumpulan ini telah diterima. | Your earlier submission may have gone through. An RSVP for this family/group has already been received. | draft |
| `errorLimitChanged` | Had telah dikemas kini kepada {n} orang. Sila semak jumlah anda. | The limit has been updated to {n} people. Please check your total. | draft |
| `errorValidation` | Sila semak jawapan anda. | Please check your responses. | draft |
| `errorRateLimited` | Terlalu banyak percubaan. Sila cuba lagi sebentar lagi. | Too many attempts. Please try again in a little while. | draft |
| `errorFailed` | RSVP anda belum dihantar. Sila semak sambungan anda dan cuba lagi. Maklumat anda masih ada. | Your RSVP has not been sent. Please check your connection and try again. Your details are still here. | draft |
| `closedTitle` | RSVP telah ditutup. | RSVP is now closed. | draft |
| `closedBody` | Jika anda perlu membuat perubahan, sila hubungi pasangan secara terus. | If you need to make a change, please contact the couple directly. | draft |
| `successTitle` | Terima kasih | Thank you | draft |
| `successAttending` | RSVP anda untuk majlis Walimatulurus telah diterima. | Your RSVP for the Walimatulurus celebration has been received. | draft |
| `successDeclined` | Terima kasih kerana memaklumkan kami. RSVP anda untuk majlis Walimatulurus telah diterima. | Thank you for letting us know. Your RSVP for the Walimatulurus celebration has been received. | draft |
| `successFinal` | RSVP ini muktamad. Jika anda perlu membuat pembetulan, sila hubungi pasangan secara terus. | This RSVP is final. If you need to make a correction, please contact the couple directly. | draft |
| `summaryFamily` | Keluarga / kumpulan | Family / group | draft |
| `summaryAttendance` | Kehadiran | Attendance | draft |
| `summaryCount` | Jumlah | Total | draft |
| `guestbookHeading` | Ucapan | Wishes | approved (M1) |
| `guestbookNameLabel` | Nama (pilihan) | Name (optional) | approved (M1) |
| `guestbookAnonymous` | Hantar tanpa nama | Send anonymously | approved (M1) |
| `guestbookMessageLabel` | Ucapan anda | Your wishes | approved (M1) |
| `guestbookAnonymousHint` | Ucapan tanpa nama hanya dilihat oleh pasangan dan tidak dipaparkan di sini. | Anonymous wishes are seen only by the couple and are not displayed here. | approved (M1) |
| `guestbookSend` | Hantar Ucapan | Send Wishes | approved (M1) |
| `guestbookNameHint` | Jika dikosongkan, ucapan anda tidak akan dipaparkan. | If left blank, your wish will not be displayed. | draft |
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
| `guestbookLoadMore` | Muat lagi | Load more | draft |
| `crashTitle` | Maaf, sesuatu tidak kena. | Sorry, something went wrong. | draft |
| `crashBody` | Halaman ini tidak dapat dipaparkan. Sila muat semula halaman. | This page could not be shown. Please reload the page. | draft |
| `crashReload` | Muat semula | Reload | draft |
| `skipToContent` | Langkau ke kandungan | Skip to content | draft |
| `switchLanguageLabel` | Switch language to English | Tukar bahasa ke Bahasa Melayu | draft |
| `switchLanguageText` | EN | BM | draft |
