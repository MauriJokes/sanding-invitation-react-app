/** Names as supplied by the owner (docs/WEDDING_CONTENT_INFO). They are not translated. */
export interface Person {
  name: string;
  lineage: string;
}

export const HOST_GROUPS: readonly (readonly Person[])[] = [
  [
    {
      name: "Pengiran Haji Mohamad Jaludin",
      lineage: "bin Pengiran Haji Puteh",
    },
    { name: "Dayang Masdiah binti Awang Haji Tuah", lineage: "" },
  ],
  [
    {
      name: "Awangku Mohamad Izzan Naqiuddin",
      lineage: "bin Pengiran Haji Mohamad Jaludin",
    },
    {
      name: "Awangku Mohamad Izzan Qayyum",
      lineage: "bin Pengiran Haji Mohamad Jaludin",
    },
  ],
  [
    { name: "Haji Nik Joharris bin Nik Ahmad", lineage: "" },
    { name: "Hajah Nerisa binti Nawi", lineage: "" },
  ],
  [
    { name: "Nik Arman Danish bin Nik Joharris", lineage: "" },
    { name: "Nik Azlan bin Nik Joharris", lineage: "" },
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
];

export const ITINERARY_EN = [
  { time: "7:15 PM", item: "Arrival of Guests" },
  { time: "8:15 PM", item: "Procession of the Newlyweds" },
  { time: "", item: "Tausyeh Performance" },
  { time: "", item: "Majlis Bersanding" },
  { time: "", item: "Speech from Family Representative" },
  { time: "", item: "Closing Prayers" },
  { time: "", item: "Dinner" },
  { time: "", item: "Photography & Video Guest Book Session" },
];
