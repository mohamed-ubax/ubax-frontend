import type { ReservationAvailabilityMetric } from '../types/reservation.types';
import { Plugin } from 'chart.js';

export const AVAILABILITY_COLORS: Record<
  ReservationAvailabilityMetric['tone'],
  string
> = {
  green: '#16b55b',
  orange: '#e87d1e',
  blue: '#008bff',
  red: '#fa191d',
};

export function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function buildActiveRevenuePlugin(activeIndex: number): Plugin<'line'> {
  return {
    id: `ubaxCommercialRevenueActivePoint-${activeIndex}`,
    afterDatasetsDraw(chart) {
      const activePoint = chart.getDatasetMeta(0).data[activeIndex];

      if (!activePoint) {
        return;
      }

      const { ctx, chartArea } = chart;

      ctx.save();
      ctx.strokeStyle = '#e87d1e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(activePoint.x, activePoint.y + 14);
      ctx.lineTo(activePoint.x, chartArea.bottom - 8);
      ctx.stroke();

      ctx.fillStyle = '#e87d1e';
      ctx.beginPath();
      ctx.arc(activePoint.x, activePoint.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };
}
