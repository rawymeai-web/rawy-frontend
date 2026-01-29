import React, { type CSSProperties, type SVGProps } from 'react';

export interface GaugeProps extends Omit<SVGProps<SVGSVGElement>, 'className'> {
  value: number;
  size?: number | string;
  gapPercent?: number;
  strokeWidth?: number;
  equal?: boolean;
  showValue?: boolean;
  primary?: string;
  secondary?: string;
  transition?: {
    length?: number;
    step?: number;
    delay?: number;
  };
  className?:
    | string
    | {
        svgClassName?: string;
        primaryClassName?: string;
        secondaryClassName?: string;
        textClassName?: string;
      };
}

function Gauge({
  value,
  size = '100%',
  gapPercent = 5,
  strokeWidth = 10,
  equal = false,
  showValue = true,
  primary,
  secondary,
  transition = {
    length: 1000, // ms
    step: 200, // ms
    delay: 0, // ms
  },
  className,
  ...props
}: GaugeProps) {
  const strokePercent = value; // %

  const circleSize = 100; // px
  const radius = circleSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const percentToDegree = 360 / 100; // deg
  const percentToPx = circumference / 100; // px

  const offsetFactor = equal ? 0.5 : 0;
  const offsetFactorSecondary = 1 - offsetFactor;

  const primaryStrokeDasharray = () => {
    if (offsetFactor > 0 && strokePercent > 100 - gapPercent * 2 * offsetFactor) {
      const subtract = -strokePercent + 100;
      return `${Math.max(strokePercent * percentToPx - subtract * percentToPx, 0)} ${circumference}`;
    } else {
      const subtract = gapPercent * 2 * offsetFactor;
      return `${Math.max(strokePercent * percentToPx - subtract * percentToPx, 0)} ${circumference}`;
    }
  };

  const secondaryStrokeDasharray = () => {
    if (offsetFactorSecondary < 1 && strokePercent < gapPercent * 2 * offsetFactorSecondary) {
      const subtract = strokePercent;
      return `${Math.max((100 - strokePercent) * percentToPx - subtract * percentToPx, 0)} ${circumference}`;
    } else {
      const subtract = gapPercent * 2 * offsetFactorSecondary;
      return `${Math.max((100 - strokePercent) * percentToPx - subtract * percentToPx, 0)} ${circumference}`;
    }
  };

  const primaryTransform = () => {
    if (offsetFactor > 0 && strokePercent > 100 - gapPercent * 2 * offsetFactor) {
      const add = 0.5 * (-strokePercent + 100);
      return `rotate(${-90 + add * percentToDegree}deg)`;
    } else {
      const add = gapPercent * offsetFactor;
      return `rotate(${-90 + add * percentToDegree}deg)`;
    }
  };

  const secondaryTransform = () => {
    if (offsetFactorSecondary < 1 && strokePercent < gapPercent * 2 * offsetFactorSecondary) {
      const subtract = 0.5 * strokePercent;
      return `rotate(${360 - 90 - subtract * percentToDegree}deg) scaleY(-1)`;
    } else {
      const subtract = gapPercent * offsetFactorSecondary;
      return `rotate(${360 - 90 - subtract * percentToDegree}deg) scaleY(-1)`;
    }
  };

  const primaryStroke = () => {
    return primary ?? '#22c55e';
  };

  const secondaryStroke = () => {
    return secondary ?? '#e5e7eb';
  };

  const primaryOpacity = () => {
    if (offsetFactor > 0 && strokePercent < gapPercent * 2 * offsetFactor && strokePercent < gapPercent * 2 * offsetFactorSecondary) {
      return 0;
    } else return 1;
  };

  const secondaryOpacity = () => {
    if ((offsetFactor === 0 && strokePercent > 100 - gapPercent * 2) || (offsetFactor > 0 && strokePercent > 100 - gapPercent * 2 * offsetFactor && strokePercent > 100 - gapPercent * 2 * offsetFactorSecondary)) {
      return 0;
    } else return 1;
  };

  const circleStyles: CSSProperties = {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDashoffset: 0,
    strokeWidth: strokeWidth,
    transition: `all ${transition?.length}ms ease ${transition?.delay}ms`,
    transformOrigin: '50% 50%',
    shapeRendering: 'geometricPrecision',
  };

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`0 0 ${circleSize} ${circleSize}`}
      shapeRendering='crispEdges'
      width={size}
      height={size}
      style={{ userSelect: 'none' }}
      strokeWidth={2}
      fill='none'
      className={typeof className === 'string' ? className : className?.svgClassName}
      {...props}
    >
      <circle
        cx={circleSize / 2}
        cy={circleSize / 2}
        r={radius}
        style={{
          ...circleStyles,
          strokeDasharray: secondaryStrokeDasharray(),
          transform: secondaryTransform(),
          stroke: secondaryStroke(),
          opacity: secondaryOpacity(),
        }}
        className={typeof className === 'object' ? className.secondaryClassName : undefined}
      />
      <circle
        cx={circleSize / 2}
        cy={circleSize / 2}
        r={radius}
        style={{
          ...circleStyles,
          strokeDasharray: primaryStrokeDasharray(),
          transform: primaryTransform(),
          stroke: primaryStroke(),
          opacity: primaryOpacity(),
        }}
        className={typeof className === 'object' ? className.primaryClassName : undefined}
      />
      {showValue && (
        <text
          x='50%'
          y='50%'
          textAnchor='middle'
          dominantBaseline='middle'
          alignmentBaseline='central'
          fill='currentColor'
          fontSize={36}
          className={`font-semibold ${typeof className === 'object' && className.textClassName ? className.textClassName : ''}`}
        >
          {`${Math.round(strokePercent)}%`}
        </text>
      )}
    </svg>
  );
}

export { Gauge };
