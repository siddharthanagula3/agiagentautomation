/**
 * Countdown timer date helpers.
 */
export const getOneMonthFromNow = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

export const createDiscountEndDate = (): Date => {
  // 99 hours, 59 minutes, 59 seconds from now
  const now = new Date();
  return new Date(
    now.getTime() + 99 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000
  );
};
