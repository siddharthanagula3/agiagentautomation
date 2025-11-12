/**
 * Countdown timer date helpers.
 */
export const getOneMonthFromNow = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

export const createDiscountEndDate = (): Date => {
  // 15 minutes from now
  const now = new Date();
  return new Date(now.getTime() + 15 * 60 * 1000);
};
