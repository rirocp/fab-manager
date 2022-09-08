import { Coupon } from '../models/coupon';

export const computePriceWithCoupon = (price: number, coupon?: Coupon): number => {
  if (!coupon) {
    return price;
  }
  if (coupon.type === 'percent_off') {
    return (Math.trunc(price * 100) - (Math.trunc(price * 100) * coupon.percent_off / 100)) / 100;
  } else if (coupon.type === 'amount_off' && price > coupon.amount_off) {
    return (Math.trunc(price * 100) - Math.trunc(coupon.amount_off * 100)) / 100;
  }
  return price;
};
