/** Names as supplied by the owner (docs/WEDDING_CONTENT_INFO). They are not translated. */
export interface Person {
  name: string;
  lineage: string;
}

export const HOST_GROUPS: readonly (readonly Person[])[] = [
  [
    { name: "Pengiran Haji Mohamad Jaludin", lineage: "bin Pengiran Haji Puteh" },
    { name: "Dayang Masdiah", lineage: "binti Awang Haji Tuah" },
  ],
  [
    { name: "Awangku Mohamad Izzan Naqiuddin", lineage: "bin Pengiran Haji Mohamad Jaludin" },
    { name: "Awangku Mohamad Izzan Qayyum", lineage: "bin Pengiran Haji Mohamad Jaludin" },
  ],
  [
    { name: "Haji Nik Joharris", lineage: "bin Nik Ahmad" },
    { name: "Hajjah Nerisa", lineage: "binti Nawi" },
  ],
  [
    { name: "Nik Arman Danish", lineage: "bin Nik Joharris" },
    { name: "Nik Azlan", lineage: "bin Nik Joharris" },
  ],
];

export const HOST_TITLE = "Yang Mulia";

export const COUPLE: readonly string[] = [
  "Dk Izyan Naqiyah binti Pengiran Haji Mohd. Jaludin",
  "Nik Adam Danish bin Nik Joharris",
];

export const ITINERARY = [
        { time: "7:15 MLM", item: "Menerima Jemputan" },
        { time: "8:15 MLM", item: "Perarakan Masuk Raja Sehari" },
        { time: "", item: "Iringan Persembahan Tausyeh" },
        {
            time: "",
            item: "Majlis Bersanding",
        },
        { time: "", item: "Ucapan Alu-aluan daripada Wakil Keluarga" },
        { time: "", item: "Bacaan Doa Selamat" },
        { time: "", item: "Menikmati Jamuan" },
        { time: "", item: "Sesi bergambar & Rakaman Ucapan Kenangan" },
    ]
