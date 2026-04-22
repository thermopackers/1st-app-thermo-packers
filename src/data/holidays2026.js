// Holidays for the Year 2026
export const holidays2026 = [
  { sn: 1, name: "Vishwakarma Day", date: "2026-01-16", day: "Friday", type: "gazetted" },
  { sn: 2, name: "Baisakhi", date: "2026-04-13", day: "Monday", type: "gazetted" },
  { sn: 3, name: "Dusshera", date: "2026-10-20", day: "Tuesday", type: "gazetted" },
  { sn: 4, name: "26 January", date: "2026-01-26", day: "Monday", type: "gazetted" },
  { sn: 5, name: "15 August", date: "2026-08-15", day: "Saturday", type: "gazetted" },
  { sn: 6, name: "Janmashtami", date: "2026-09-04", day: "Friday", type: "gazetted" },
  { sn: 7, name: "Holi", date: "2026-03-04", day: "Wednesday", type: "gazetted" },
  { sn: 8, name: "Diwali", date: "2026-11-08", day: "Sunday", type: "gazetted" },
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