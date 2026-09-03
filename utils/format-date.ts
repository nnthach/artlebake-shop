export function formatDateTime(date: Date | string) {
  const d = new Date(date);

  const datePart = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);

  return {
    full: `${datePart} ${timePart}`,
    date: datePart,
    time: timePart,
  };
}

export function formatDateReverse(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}
