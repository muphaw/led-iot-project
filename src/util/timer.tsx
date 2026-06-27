export const getFutureTime = (minutes: number) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);

  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");

  return `${hh}:${mm}`;
};