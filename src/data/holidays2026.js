// Holidays for the Year 2026
export const holidays2026 = [
  // Saka Era 1947
  { sn: 1, name: "Statehood Day", date: "2026-01-25", sakaDate: "Magha 05", day: "Sunday", type: "gazetted" },
  { sn: 2, name: "Republic Day", date: "2026-01-26", sakaDate: "Magha 06", day: "Monday", type: "gazetted" },
  { sn: 3, name: "Guru Ravidas's Birthday", date: "2026-02-01", sakaDate: "Magha 12", day: "Sunday", type: "gazetted" },
  { sn: 4, name: "Maha Shivratri", date: "2026-02-15", sakaDate: "Magha 26", day: "Sunday", type: "gazetted" },
  { sn: 5, name: "Holi", date: "2026-03-04", sakaDate: "Phalgun 13", day: "Wednesday", type: "gazetted" },
  { sn: 6, name: "Id-ul-Fitr", date: "2026-03-21", sakaDate: "Phalgun 30", day: "Saturday", type: "gazetted" },
  
  // Saka Era 1948
  { sn: 7, name: "Ram Navmi", date: "2026-03-26", sakaDate: "Chaitra 05", day: "Thursday", type: "gazetted" },
  { sn: 8, name: "Good Friday", date: "2026-04-03", sakaDate: "Chaitra 13", day: "Friday", type: "gazetted" },
  { sn: 9, name: "Dr. B. R. Ambedkar's Birthday", date: "2026-04-14", sakaDate: "Chaitra 24", day: "Tuesday", type: "gazetted" },
  { sn: 10, name: "Himachal Day", date: "2026-04-15", sakaDate: "Chaitra 25", day: "Wednesday", type: "gazetted" },
  { sn: 11, name: "Bhagvan Shree Parshuram Jayanti", date: "2026-04-19", sakaDate: "Chaitra 29", day: "Sunday", type: "gazetted" },
  { sn: 12, name: "Budha Purnima", date: "2026-05-01", sakaDate: "Vaishakha 11", day: "Friday", type: "gazetted" },
  { sn: 13, name: "Id-ul-Zuha (Bakrid)", date: "2026-05-27", sakaDate: "Jyaistha 06", day: "Wednesday", type: "gazetted" },
  { sn: 14, name: "Maharana Pratap Jayanti", date: "2026-06-17", sakaDate: "Jyaistha 26", day: "Wednesday", type: "gazetted" },
  { sn: 15, name: "Muharram", date: "2026-06-26", sakaDate: "Ashadha 05", day: "Friday", type: "gazetted" },
  { sn: 16, name: "Sant Guru Kabir Jayanti (Prakat Diwas)", date: "2026-06-29", sakaDate: "Ashadha 08", day: "Monday", type: "gazetted" },
  { sn: 17, name: "Independence Day", date: "2026-08-15", sakaDate: "Sravana 24", day: "Saturday", type: "gazetted" },
  { sn: 18, name: "Janmashtami", date: "2026-09-04", sakaDate: "Bhadra 13", day: "Friday", type: "gazetted" },
  { sn: 19, name: "Mahatma Gandhi's Birthday", date: "2026-10-02", sakaDate: "Asvina 10", day: "Friday", type: "gazetted" },
  { sn: 20, name: "Dussehra", date: "2026-10-20", sakaDate: "Asvina 28", day: "Tuesday", type: "gazetted" },
  { sn: 21, name: "Maharishi Valmiki's Birthday", date: "2026-10-26", sakaDate: "Kartika 04", day: "Monday", type: "gazetted" },
  { sn: 22, name: "Diwali (Deepavali)", date: "2026-11-08", sakaDate: "Kartika 17", day: "Sunday", type: "gazetted" },
  { sn: 23, name: "Guru Nanak's Birthday", date: "2026-11-24", sakaDate: "Agrahayana 03", day: "Tuesday", type: "gazetted" },
  { sn: 24, name: "Christmas Day", date: "2026-12-25", sakaDate: "Pausha 04", day: "Friday", type: "gazetted" },
];

// Group holidays by month
export const getHolidaysByMonth = () => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const holidaysByMonth = months.map(() => []);
  
  holidays2026.forEach(holiday => {
    const month = new Date(holiday.date).getMonth();
    holidaysByMonth[month].push(holiday);
  });
  
  return { months, holidaysByMonth };
};

// Get upcoming holidays (from today onwards)
export const getUpcomingHolidays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return holidays2026
    .filter(holiday => new Date(holiday.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Get holiday by date
export const getHolidayByDate = (dateStr) => {
  return holidays2026.find(h => h.date === dateStr);
};